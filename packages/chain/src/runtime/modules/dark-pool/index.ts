import { TokenId, UInt64 } from "@proto-kit/library";
import { runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { assert, State, StateMap } from "@proto-kit/protocol";
import { Bool, Field, Poseidon, PublicKey, Struct } from "o1js";
import { XYK } from "../xyk";
import { PoolKey } from "../xyk/pool-key";
import { TokenPair } from "../xyk/token-pair";
import { calculateExecutionAmounts } from "./utils";

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

  @runtimeMethod()
  public async submitOrder(order: Order) {
    const sender = this.transaction.sender.value;
    const isBuy = order.tokenIn.lessThanOrEqual(order.tokenOut);
    const poolKey = PoolKey.fromTokenPair(
      TokenPair.from(order.tokenIn, order.tokenOut)
    );
    const isWhitelisted = await this.poolWhitelist.get({
      user: sender,
      poolKey,
    });
    assert(isWhitelisted.value, "User is not whitelisted for this pool");

    // Transfer tokens from sender to pool
    if (isBuy.equals(Bool(true))) {
      await this.balances.transfer(
        order.tokenIn,
        sender,
        this.transaction.sender.value,
        order.amountIn
      );
    } else {
      await this.balances.transfer(
        order.tokenOut,
        sender,
        this.transaction.sender.value,
        order.amountOut
      );
    }

    // Update order book with order data
    const orderId = isBuy.equals(Bool(true))
      ? await this.buyOrderCounter.get()
      : await this.sellOrderCounter.get();
    const newOrderId = orderId.orElse(UInt64.from(0)).add(UInt64.from(1));
    const orderBook = isBuy.equals(Bool(true))
      ? this.buyOrderBook
      : this.sellOrderBook;
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
    const firstOrderId = isBuy.equals(Bool(true))
      ? await this.firstBuyOrderId.get()
      : await this.firstSellOrderId.get();
    if (firstOrderId.isSome.equals(Bool(false))) {
      await this.firstBuyOrderId.set(newOrderId);
    }

    const lastOrderId = isBuy.equals(Bool(true))
      ? await this.lastBuyOrderId.get()
      : await this.lastSellOrderId.get();
    if (lastOrderId.isSome.equals(Bool(true))) {
      await this.orderIdToNextOrderId.set(lastOrderId.value, newOrderId);
    }

    // Update counters
    if (isBuy.equals(Bool(true))) {
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
    if (order.isSome.equals(Bool(false))) {
      order = await this.sellOrderBook.get(orderId);
      isBuy = Bool(false);
    }
    assert(order.isSome, "Order does not exist");

    const userOrderCount = await this.userOrderCounter.get(order.value.user);
    const newUserOrderCount = userOrderCount
      .orElse(UInt64.from(0))
      .sub(UInt64.from(1));
    await this.userOrderCounter.set(order.value.user, newUserOrderCount);

    const nextOrderId = await this.orderIdToNextOrderId.get(orderId);
    if (nextOrderId.isSome.equals(Bool(true))) {
      await this.orderIdToNextOrderId.set(orderId, nextOrderId.value);
    }

    if (isBuy.equals(Bool(true))) {
      const lastOrderId = await this.lastBuyOrderId.get();
      if (lastOrderId.value.equals(orderId)) {
        await this.lastBuyOrderId.set(nextOrderId.value);
      }
      await this.buyOrderCounter.set(newUserOrderCount);
      await this.buyOrderBook.set(orderId, Order.empty());
    } else {
      const lastOrderId = await this.lastSellOrderId.get();
      if (lastOrderId.value.equals(orderId)) {
        await this.lastSellOrderId.set(nextOrderId.value);
      }
      await this.sellOrderCounter.set(newUserOrderCount);
      await this.sellOrderBook.set(orderId, Order.empty());
    }
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
    while (buyOrderId.isSome) {
      const buyOrder = await this.buyOrderBook.get(buyOrderId.value);
      if (buyOrder.isSome.equals(Bool(false))) {
        break;
      }
      // If the buy order is not active, skip it
      if (
        buyOrder.value.minBlockHeight.value.greaterThan(
          currentBlockHeight.value
        )
      ) {
        buyOrderId = await this.orderIdToNextOrderId.get(buyOrderId.value);
        continue;
      }
      // If the buy order is expired, remove it and continue
      if (
        buyOrder.value.maxBlockHeight.value.lessThan(currentBlockHeight.value)
      ) {
        await this.removeOrder(buyOrderId.value);
        buyOrderId = await this.orderIdToNextOrderId.get(buyOrderId.value);
        continue;
      }

      const sellOrder = await this.sellOrderBook.get(sellOrderId.value);
      if (sellOrder.isSome.equals(Bool(false))) {
        break;
      }
      // If the sell order is not active, skip it
      if (
        sellOrder.value.minBlockHeight.value.greaterThan(
          currentBlockHeight.value
        )
      ) {
        sellOrderId = await this.orderIdToNextOrderId.get(sellOrderId.value);
        continue;
      }
      // If the sell order is expired, remove it and continue
      if (
        sellOrder.value.maxBlockHeight.value.lessThan(currentBlockHeight.value)
      ) {
        await this.removeOrder(sellOrderId.value);
        sellOrderId = await this.orderIdToNextOrderId.get(sellOrderId.value);
        continue;
      }

      const buyOrderRatio = buyOrder.value.amountOut.div(
        buyOrder.value.amountIn
      );
      const sellOrderRatio = sellOrder.value.amountIn.div(
        sellOrder.value.amountOut
      );

      // No match, move to next order
      if (buyOrderRatio.greaterThan(sellOrderRatio)) {
        sellOrderId = await this.orderIdToNextOrderId.get(sellOrderId.value);
        continue;
      }

      // Match orders
      const [executedAmountIn, executedAmountOut] = calculateExecutionAmounts(
        sellOrder.value.amountIn,
        sellOrder.value.amountOut,
        buyOrder.value.amountIn,
        buyOrder.value.amountOut
      );

      // If it is possible to execute the trade, continue
      if (
        executedAmountIn.greaterThan(UInt64.from(0)) &&
        executedAmountOut.greaterThan(UInt64.from(0))
      ) {
        await this.balances.transfer(
          buyOrder.value.tokenIn,
          buyOrder.value.user,
          sellOrder.value.user,
          executedAmountIn
        );
        await this.balances.transfer(
          sellOrder.value.tokenOut,
          sellOrder.value.user,
          buyOrder.value.user,
          executedAmountOut
        );

        // Update orders
        const updatedBuyOrder = new Order({
          user: buyOrder.value.user,
          tokenIn: buyOrder.value.tokenIn,
          tokenOut: buyOrder.value.tokenOut,
          amountIn: buyOrder.value.amountIn.sub(executedAmountIn),
          amountOut: buyOrder.value.amountOut.sub(executedAmountOut),
          minBlockHeight: buyOrder.value.minBlockHeight,
          maxBlockHeight: buyOrder.value.maxBlockHeight,
        });

        const updatedSellOrder = new Order({
          user: sellOrder.value.user,
          tokenIn: sellOrder.value.tokenIn,
          tokenOut: sellOrder.value.tokenOut,
          amountIn: sellOrder.value.amountIn.sub(executedAmountOut),
          amountOut: sellOrder.value.amountOut.sub(executedAmountIn),
          minBlockHeight: sellOrder.value.minBlockHeight,
          maxBlockHeight: sellOrder.value.maxBlockHeight,
        });

        // Remove or update orders
        if (updatedBuyOrder.amountIn.equals(UInt64.from(0))) {
          await this.removeOrder(buyOrderId.value);
          buyOrderId = await this.orderIdToNextOrderId.get(buyOrderId.value);
        } else {
          await this.buyOrderBook.set(buyOrderId.value, updatedBuyOrder);
        }

        if (updatedSellOrder.amountIn.equals(UInt64.from(0))) {
          await this.removeOrder(sellOrderId.value);
          sellOrderId = await this.orderIdToNextOrderId.get(sellOrderId.value);
        } else {
          await this.sellOrderBook.set(sellOrderId.value, updatedSellOrder);
        }
      } else {
        // No match, move to next order
        buyOrderId = await this.orderIdToNextOrderId.get(buyOrderId.value);
      }
    }
  }

  public async getUserOrders(user: PublicKey) {
    const userOrderCount = await this.userOrderCounter.get(user);
    const userOrderIds = [];
    let i = UInt64.from(0);
    while (userOrderCount.value.greaterThan(i)) {
      const userOrderId = await this.userOrderIdByIndex.get({
        orderId: i,
        user,
      });
      userOrderIds.push(userOrderId.value);
      i = i.add(UInt64.from(1));
    }

    const orders = [];
    for (const userOrderId of userOrderIds) {
      const order = await this.buyOrderBook.get(userOrderId);
      assert(order.isSome, "Order does not exist");

      orders.push(order.value);
    }

    return orders;
  }
}
