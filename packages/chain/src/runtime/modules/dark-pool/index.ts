import { runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { assert, State, StateMap } from "@proto-kit/protocol";
import { UInt64 } from "@proto-kit/library";
import { Bool, Field, Poseidon, Provable, PublicKey, Struct } from "o1js";
import { XYK } from "../xyk";
import { PoolKey } from "../xyk/pool-key";

export class OrderId extends UInt64 {}

export class Order extends Struct({
  user: PublicKey,
  amountIn: UInt64,
  amountOut: UInt64,
  isAtoB: Bool,
}) {
  hash() {
    return Poseidon.hash([
      Poseidon.hash(this.user.toFields()),
      Field.from(this.amountIn.toBigInt()),
      Field.from(this.amountOut.toBigInt()),
      this.isAtoB.toField(),
    ]);
  }

  static empty(): Order {
    return new Order({
      user: PublicKey.empty(),
      amountIn: UInt64.from(0),
      amountOut: UInt64.from(0),
      isAtoB: Bool(false),
    });
  }
}

export class OrderWithPoolKey extends Struct({
  user: PublicKey,
  amountIn: UInt64,
  amountOut: UInt64,
  isAtoB: Bool,
  poolKey: PoolKey,
}) {}

export class PoolWhitelist extends Struct({
  poolKey: PoolKey,
  user: PublicKey,
}) {}

export class OrderIdUser extends Struct({
  orderId: OrderId,
  user: PublicKey,
}) {}

@runtimeModule()
export class DarkPool extends XYK {
  /**
   * Mapping of pool keys to a boolean indicating if the pool is whitelisted.
   */
  @state() public poolWhitelist = StateMap.from<PoolWhitelist, Bool>(
    PoolWhitelist,
    Bool
  );
  /**
   * Mapping of order ids to orders.
   * TODO: This should not be a runtime state
   */
  @state() public orderBook = StateMap.from<OrderId, Order>(OrderId, Order);
  /**
   * Counter for the number of orders.
   */
  @state() public orderCounter = State.from<UInt64>(UInt64);
  /**
   * Mapping of users to the number of orders they have.
   */
  @state() public userOrderCount = StateMap.from<PublicKey, UInt64>(
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
  /**
   * The first order id in the order book.
   */
  @state() public firstOrderId = State.from<OrderId>(OrderId);
  /**
   * The last order id in the order book.
   */
  @state() public lastOrderId = State.from<OrderId>(OrderId);

  @runtimeMethod()
  public async submitOrder(order: Order, poolKey: PoolKey) {
    const sender = this.transaction.sender.value;
    const isWhitelisted = await this.poolWhitelist.get({
      user: sender,
      poolKey,
    });
    assert(isWhitelisted.value, "User is not whitelisted for this pool");

    const orderId = await this.orderCounter.get();
    const newOrderId = orderId.orElse(UInt64.from(0)).add(UInt64.from(1));
    await this.orderBook.set(newOrderId, order);

    const userOrderCount = await this.userOrderCount.get(sender);
    const newUserOrderCount = userOrderCount
      .orElse(UInt64.from(0))
      .add(UInt64.from(1));
    await this.userOrderCount.set(sender, newUserOrderCount);

    await this.userOrderIdByIndex.set(
      { orderId: newOrderId, user: sender },
      newOrderId
    );
    await this.orderIdToNextOrderId.set(newOrderId, newOrderId);

    const firstOrderId = await this.firstOrderId.get();
    if (firstOrderId.isSome.not()) {
      await this.firstOrderId.set(newOrderId);
    }

    const lastOrderId = await this.lastOrderId.get();
    if (lastOrderId.isSome) {
      await this.orderIdToNextOrderId.set(lastOrderId.value, newOrderId);
    }

    await this.lastOrderId.set(newOrderId);
  }

  @runtimeMethod()
  public async getOrder(orderId: OrderId) {
    return await this.orderBook.get(orderId);
  }

  @runtimeMethod()
  public async whitelistUser(user: PublicKey, poolKey: PoolKey) {
    await this.poolWhitelist.set({ user, poolKey }, Bool(true));
  }

  @runtimeMethod()
  public async dewhitelistUser(user: PublicKey, poolKey: PoolKey) {
    await this.poolWhitelist.set({ user, poolKey }, Bool(false));
  }

  @runtimeMethod()
  public async removeOrder(orderId: OrderId) {
    const order = await this.orderBook.get(orderId);
    assert(order.isSome, "Order does not exist");

    const userOrderCount = await this.userOrderCount.get(order.value.user);
    const newUserOrderCount = userOrderCount
      .orElse(UInt64.from(0))
      .sub(UInt64.from(1));
    await this.userOrderCount.set(order.value.user, newUserOrderCount);

    const nextOrderId = await this.orderIdToNextOrderId.get(orderId);
    if (nextOrderId.isSome) {
      await this.orderIdToNextOrderId.set(orderId, nextOrderId.value);
    }

    const lastOrderId = await this.lastOrderId.get();
    if (lastOrderId.isSome && lastOrderId.value.equals(orderId)) {
      await this.lastOrderId.set(nextOrderId.value);
    }

    await this.orderBook.set(orderId, Order.empty());
  }
}
