import { TokenId, UInt64 } from "@proto-kit/library";
import { runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { assert, State, StateMap } from "@proto-kit/protocol";
import {
  Bool,
  Field,
  UInt64 as O1UInt64,
  Poseidon,
  PublicKey,
  Struct,
} from "o1js";
import { XYK } from "../xyk";
import { PoolKey } from "../xyk/pool-key";
import { TokenPair } from "../xyk/token-pair";
import { calculateExecutionAmounts } from "./utils";
import type { CanSubmitOrderProof } from "./can-submit-order";
import "reflect-metadata";

export class OrderId extends UInt64 {}

export class Order extends Struct({
  user: PublicKey,
  tokenIn: TokenId,
  tokenOut: TokenId,
  amountIn: UInt64,
  amountOut: UInt64,
  minBlockHeight: UInt64,
  maxBlockHeight: UInt64,
}) {
  hash() {
    return Poseidon.hash([
      Poseidon.hash(this.user.toFields()),
      Field.from(this.tokenIn.toBigInt()),
      Field.from(this.tokenOut.toBigInt()),
      Field.from(this.amountIn.toBigInt()),
      Field.from(this.amountOut.toBigInt()),
      Field.from(this.minBlockHeight.toBigInt()),
      Field.from(this.maxBlockHeight.toBigInt()),
    ]);
  }

  static empty(): Order {
    return new Order({
      user: PublicKey.empty(),
      tokenIn: TokenId.empty(),
      tokenOut: TokenId.empty(),
      amountIn: UInt64.from(0),
      amountOut: UInt64.from(0),
      minBlockHeight: UInt64.from(0),
      maxBlockHeight: UInt64.from(0),
    });
  }
}

export class OrderIdUser extends Struct({
  orderId: OrderId,
  user: PublicKey,
}) {}

/**
 * TODO: improve how the state is being managed
 * To get all user's orders, we need to:
 * 1. Get the number of orders the user has
 * 2. Iterate from 0 to the number of orders
 * 3. Get the order id from the userOrderIdByIndex mapping
 * 4. Get the order from the order book using the order id
 * 5. Add the order to the list of orders
 */
@runtimeModule()
export class DarkPool extends XYK {
  /**
   * Mapping of order ids to buy orders.
   * TODO: This should not be a runtime state
   */
  @state() public buyOrderBook = StateMap.from<OrderId, Order>(OrderId, Order);
  /**
   * Mapping of order ids to sell orders
   */
  @state() public sellOrderBook = StateMap.from<OrderId, Order>(OrderId, Order);
  /**
   * Counter for the number of buy orders.
   */
  @state() public buyOrderCounter = State.from<UInt64>(UInt64);
  /**
   * Counter for the number of sell orders.
   */
  @state() public sellOrderCounter = State.from<UInt64>(UInt64);
  /**
   * Mapping of users to the number of orders they have.
   */
  @state() public userOrderCounter = StateMap.from<PublicKey, UInt64>(
    PublicKey,
    UInt64
  );
  /**
   * Mapping of order ids to the user who placed the order.
   */
  @state() public userOrderIdByIndex = StateMap.from<OrderIdUser, OrderId>(
    OrderIdUser,
    OrderId
  );
  /**
   * Mapping of order ids to the next order id.
   */
  @state() public orderIdToNextOrderId = StateMap.from<OrderId, OrderId>(
    OrderId,
    OrderId
  );
  @state() public firstBuyOrderId = State.from<OrderId>(OrderId);
  @state() public lastBuyOrderId = State.from<OrderId>(OrderId);
  @state() public firstSellOrderId = State.from<OrderId>(OrderId);
  @state() public lastSellOrderId = State.from<OrderId>(OrderId);

  /**
   * State root of whitelisted users
   */
  @state() public stateRoot = State.from<Field>(Field);

  @runtimeMethod()
  public async setStateRoot(root: Field) {
    this.stateRoot.set(root);
  }

  @runtimeMethod()
  public async submitOrder(proof: CanSubmitOrderProof) {
    proof.verify();

    const stateRoot = await this.stateRoot.get();
    assert(
      proof.publicInput.stateRoot.equals(stateRoot.value),
      "State root does not match"
    );
    assert(proof.publicOutput.canSubmit, "Cannot submit order");

    const order = proof.publicOutput.order;
    const sender = this.transaction.sender.value;
    const isBuy = order.tokenIn.lessThanOrEqual(order.tokenOut);
    const isBuyBoolean = isBuy.equals(Bool(true));
    const poolKey = PoolKey.fromTokenPair(
      TokenPair.from(order.tokenIn, order.tokenOut)
    );

    const isWhitelisted = await this.poolWhitelist.get({
      user: sender,
      poolKey,
    });
    assert(isWhitelisted.value, "User is not whitelisted for this pool");

    // Transfer tokens from sender to pool
    const tokenToTransfer = isBuyBoolean ? order.tokenIn : order.tokenOut;
    const amountToTransfer = isBuyBoolean ? order.amountIn : order.amountOut;
    await this.balances.transfer(
      tokenToTransfer,
      sender,
      this.transaction.sender.value,
      amountToTransfer
    );

    // Update order book with order data
    const orderCounter = isBuyBoolean
      ? this.buyOrderCounter
      : this.sellOrderCounter;
    const orderId = await orderCounter.get();
    const newOrderId = orderId.orElse(UInt64.from(0)).add(UInt64.from(1));
    const orderBook = isBuyBoolean ? this.buyOrderBook : this.sellOrderBook;
    await orderBook.set(newOrderId, order);

    // Update user order counter
    const userOrderCount = await this.userOrderCounter.get(sender);
    const newUserOrderCount = userOrderCount
      .orElse(UInt64.from(0))
      .add(UInt64.from(1));
    await this.userOrderCounter.set(sender, newUserOrderCount);

    // Update user order id by index
    await this.userOrderIdByIndex.set(
      { orderId: newOrderId, user: sender },
      newOrderId
    );
    await this.orderIdToNextOrderId.set(newOrderId, newOrderId);

    // Update first and last order ids
    const firstOrderId = isBuyBoolean
      ? await this.firstBuyOrderId.get()
      : await this.firstSellOrderId.get();
    if (firstOrderId.isSome.equals(Bool(false))) {
      if (isBuy) {
        await this.firstBuyOrderId.set(newOrderId);
      } else {
        await this.firstSellOrderId.set(newOrderId);
      }
    }

    const lastOrderId = isBuyBoolean
      ? await this.lastBuyOrderId.get()
      : await this.lastSellOrderId.get();
    if (lastOrderId.isSome.equals(Bool(true))) {
      await this.orderIdToNextOrderId.set(lastOrderId.value, newOrderId);
    }

    // Update counters
    if (isBuyBoolean) {
      await this.lastBuyOrderId.set(newOrderId);
      await this.buyOrderCounter.set(newUserOrderCount);
    } else {
      await this.lastSellOrderId.set(newOrderId);
      await this.sellOrderCounter.set(newUserOrderCount);
    }
  }

  @runtimeMethod()
  public async removeOrder(orderId: OrderId) {
    let order = await this.buyOrderBook.get(orderId);
    let isBuy = Bool(true);
    let orderBook = this.buyOrderBook;
    let orderCounter = this.buyOrderCounter;
    let lastOrderIdState = this.lastBuyOrderId;
    if (order.isSome.equals(Bool(false))) {
      order = await this.sellOrderBook.get(orderId);
      isBuy = Bool(false);
      orderBook = this.sellOrderBook;
      orderCounter = this.sellOrderCounter;
      lastOrderIdState = this.lastSellOrderId;
    }

    assert(order.isSome, "Order does not exist");

    // Update user order counter
    const userOrderCount = await this.userOrderCounter.get(order.value.user);
    const newUserOrderCount = userOrderCount
      .orElse(UInt64.from(0))
      .sub(UInt64.from(1));
    await this.userOrderCounter.set(order.value.user, newUserOrderCount);

    // Update order chain
    const nextOrderId = await this.orderIdToNextOrderId.get(orderId);
    const lastOrderId = await lastOrderIdState.get();
    if (lastOrderId.value.equals(orderId)) {
      await lastOrderIdState.set(nextOrderId.value);
    } else if (nextOrderId.isSome.equals(Bool(true))) {
      const prevOrderId = await this.findPreviousOrderId(orderId, isBuy);
      if (prevOrderId) {
        await this.orderIdToNextOrderId.set(prevOrderId, nextOrderId.value);
      }
    }

    // Remove order from book and update counter
    await orderBook.set(orderId, Order.empty());
    const newOrderCounter = (await orderCounter.get())
      .orElse(UInt64.from(1))
      .sub(UInt64.from(1));
    await orderCounter.set(newOrderCounter);
  }

  private async findPreviousOrderId(
    orderId: OrderId,
    isBuy: Bool
  ): Promise<OrderId | undefined> {
    let currentOrderId = isBuy
      ? await this.firstBuyOrderId.get()
      : await this.firstSellOrderId.get();
    let prevOrderId: OrderId | undefined;

    while (
      currentOrderId.isSome.equals(Bool(true)) &&
      !currentOrderId.value.equals(orderId)
    ) {
      prevOrderId = currentOrderId.value;
      currentOrderId = await this.orderIdToNextOrderId.get(
        currentOrderId.value
      );
    }

    return prevOrderId;
  }

  // TODO: is this safe to expose as runtimeMethod?
  @runtimeMethod()
  public async matchOrders() {
    const sender = this.transaction.sender.value;
    // make sure sender is 0 address
    assert(sender.equals(PublicKey.empty()), "Sender is not 0 address");

    const currentBlockHeight = this.network.block.height;

    let buyOrderId = await this.firstBuyOrderId.get();
    let sellOrderId = await this.firstSellOrderId.get();
    // Iterate through order book
    // We match buy orders with sell orders
    while (
      buyOrderId.isSome.equals(Bool(true)) &&
      sellOrderId.isSome.equals(Bool(true))
    ) {
      const buyOrder = await this.buyOrderBook.get(buyOrderId.value);
      const sellOrder = await this.sellOrderBook.get(sellOrderId.value);

      if (
        buyOrder.isSome.equals(Bool(false)) ||
        sellOrder.isSome.equals(Bool(false))
      ) {
        break;
      }

      const [buyOrderActive, buyOrderExpired] = this.checkOrderValidity(
        buyOrder.value,
        currentBlockHeight
      );
      // If the buy order is not active, skip it
      if (!buyOrderActive) {
        buyOrderId = await this.orderIdToNextOrderId.get(buyOrderId.value);
        continue;
      }
      // If the buy order is expired, remove it and continue
      if (buyOrderExpired.equals(Bool(true))) {
        buyOrderId = await this.handleInactiveOrder(buyOrderId.value, true);
        continue;
      }

      const [sellOrderActive, sellOrderExpired] = this.checkOrderValidity(
        sellOrder.value,
        currentBlockHeight
      );
      // If the sell order is not active, skip it
      if (!sellOrderActive) {
        sellOrderId = await this.orderIdToNextOrderId.get(sellOrderId.value);
        continue;
      }
      // If the sell order is expired, remove it and continue
      if (sellOrderExpired.equals(Bool(true))) {
        sellOrderId = await this.handleInactiveOrder(sellOrderId.value, false);
        continue;
      }
      const buyOrderRatio = buyOrder.value.amountOut.div(
        buyOrder.value.amountIn
      );
      const sellOrderRatio = sellOrder.value.amountIn.div(
        sellOrder.value.amountOut
      );

      if (buyOrderRatio.greaterThan(sellOrderRatio)) {
        sellOrderId = await this.orderIdToNextOrderId.get(sellOrderId.value);
        continue;
      }

      const [executedAmountIn, executedAmountOut] = calculateExecutionAmounts(
        sellOrder.value.amountIn,
        sellOrder.value.amountOut,
        buyOrder.value.amountIn,
        buyOrder.value.amountOut
      );

      if (
        executedAmountIn.greaterThan(UInt64.from(0)) &&
        executedAmountOut.greaterThan(UInt64.from(0))
      ) {
        await this.executeMatch(
          buyOrder.value,
          sellOrder.value,
          executedAmountIn,
          executedAmountOut
        );

        [buyOrderId.value, sellOrderId.value] =
          await this.updateOrdersAfterMatch(
            buyOrderId.value,
            sellOrderId.value,
            executedAmountIn,
            executedAmountOut
          );
      } else {
        buyOrderId = await this.orderIdToNextOrderId.get(buyOrderId.value);
      }
    }
  }

  private checkOrderValidity(
    order: Order,
    currentBlockHeight: O1UInt64
  ): [Bool, Bool] {
    const isActive = order.minBlockHeight.value.lessThanOrEqual(
      currentBlockHeight.value
    );
    const isExpired = order.maxBlockHeight.value.lessThan(
      currentBlockHeight.value
    );
    return [isActive, isExpired];
  }

  private async handleInactiveOrder(orderId: OrderId, isBuy: boolean) {
    const nextOrderId = await this.orderIdToNextOrderId.get(orderId);
    if (isBuy) {
      await this.removeOrder(orderId);
    }
    return nextOrderId;
  }

  private async executeMatch(
    buyOrder: Order,
    sellOrder: Order,
    executedAmountIn: UInt64,
    executedAmountOut: UInt64
  ) {
    await this.balances.transfer(
      buyOrder.tokenIn,
      buyOrder.user,
      sellOrder.user,
      executedAmountIn
    );
    await this.balances.transfer(
      sellOrder.tokenOut,
      sellOrder.user,
      buyOrder.user,
      executedAmountOut
    );
  }

  private async updateOrdersAfterMatch(
    buyOrderId: OrderId,
    sellOrderId: OrderId,
    executedAmountIn: UInt64,
    executedAmountOut: UInt64
  ) {
    const updatedBuyOrder = await this.updateOrder(
      buyOrderId,
      this.buyOrderBook,
      executedAmountIn,
      executedAmountOut
    );
    const updatedSellOrder = await this.updateOrder(
      sellOrderId,
      this.sellOrderBook,
      executedAmountOut,
      executedAmountIn
    );

    let newBuyOrderId: OrderId | undefined;
    let newSellOrderId: OrderId | undefined;

    if (updatedBuyOrder.amountIn.equals(UInt64.from(0))) {
      await this.removeOrder(buyOrderId);
      newBuyOrderId = (await this.orderIdToNextOrderId.get(buyOrderId)).value;
    }

    if (updatedSellOrder.amountIn.equals(UInt64.from(0))) {
      await this.removeOrder(sellOrderId);
      newSellOrderId = (await this.orderIdToNextOrderId.get(sellOrderId)).value;
    }

    return [newBuyOrderId ?? buyOrderId, newSellOrderId ?? sellOrderId];
  }

  private async updateOrder(
    orderId: OrderId,
    orderBook: StateMap<OrderId, Order>,
    executedAmountIn: UInt64,
    executedAmountOut: UInt64
  ): Promise<Order> {
    const order = (await orderBook.get(orderId)).value;
    const updatedOrder = new Order({
      ...order,
      amountIn: order.amountIn.sub(executedAmountIn),
      amountOut: order.amountOut.sub(executedAmountOut),
    });
    await orderBook.set(orderId, updatedOrder);
    return updatedOrder;
  }
}
