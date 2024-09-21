import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { StateServiceQueryModule, TestingAppChain } from "@proto-kit/sdk";
import { Bool, PrivateKey, Provable } from "o1js";
import "reflect-metadata";
import { Balances } from "../../../../src/runtime/modules/balances";
import { DarkPool, Order } from "../../../../src/runtime/modules/dark-pool";
import { Faucet } from "../../../../src/runtime/modules/faucet";
import { TokenRegistry } from "../../../../src/runtime/modules/tokens";
import { LPTokenId } from "../../../../src/runtime/modules/xyk/lp-token-id";
import { PoolKey } from "../../../../src/runtime/modules/xyk/pool-key";
import { TokenPair } from "../../../../src/runtime/modules/xyk/token-pair";

const config = {
  Balances: {
    totalSupply: Balance.from(10_000_000_000),
  },
  TokenRegistry: {
    maxTokens: UInt64.from(100),
  },
  DarkPool: {
    feeDivider: 1000n,
    fee: 3n,
    minimumLiquidity: Balance.from(0),
  },
  Faucet: {},
};

const startAppChain = async () => {
  const appChain = TestingAppChain.fromRuntime({
    Faucet,
    Balances,
    DarkPool,
    TokenRegistry,
  });
  appChain.configurePartial({
    Runtime: config,
    QueryTransportModule: StateServiceQueryModule,
  });
  await appChain.start();
  return appChain;
};

describe("DarkPool", () => {
  const tokenAId = TokenId.from(0);
  const tokenBId = TokenId.from(1);
  const tokenAInitialLiquidity = Balance.from(1_000_000);
  const tokenBInitialLiquidity = Balance.from(1_000_000);
  const poolKey = PoolKey.fromTokenPair(TokenPair.from(tokenAId, tokenBId));
  const lpTokenId = LPTokenId.fromTokenPair(TokenPair.from(tokenAId, tokenBId));
  const alicePrivateKey = PrivateKey.random();
  const alice = alicePrivateKey.toPublicKey();

  describe("submitOrder", () => {
    it("should submit an order successfully when user is whitelisted", async () => {
      // Setup
      const appChain = await startAppChain();
      appChain.setSigner(alicePrivateKey);
      const darkPool = appChain.runtime.resolve("DarkPool");
      const order = new Order({
        user: alice,
        amountIn: UInt64.from(100),
        amountOut: UInt64.from(50),
        isAtoB: Bool(true),
      });

      // Whitelist the user
      let tx = await appChain.transaction(alice, async () => {
        await darkPool.whitelistUser(alice, poolKey);
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Act
      tx = await appChain.transaction(alice, async () => {
        await darkPool.submitOrder(order, poolKey);
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Assert
      const submittedOrder =
        await appChain.query.runtime.DarkPool.orderBook.get(UInt64.from(1));
      expect(submittedOrder).toEqual(order);

      const userOrderCount =
        await appChain.query.runtime.DarkPool.userOrderCount.get(alice);
      expect(userOrderCount).toEqual(UInt64.from(1));

      const firstOrderId =
        await appChain.query.runtime.DarkPool.firstOrderId.get();
      expect(firstOrderId).toEqual(UInt64.from(1));

      const lastOrderId =
        await appChain.query.runtime.DarkPool.lastOrderId.get();
      expect(lastOrderId).toEqual(UInt64.from(1));
    });

    it("should fail when user is not whitelisted", async () => {
      // Setup
      const appChain = await startAppChain();
      appChain.setSigner(alicePrivateKey);
      const darkPool = appChain.runtime.resolve("DarkPool");
      const order = new Order({
        user: alice,
        amountIn: UInt64.from(100),
        amountOut: UInt64.from(50),
        isAtoB: Bool(true),
      });

      // Act & Assert
      const tx = await appChain.transaction(alice, async () => {
        await darkPool.submitOrder(order, poolKey);
      });
      await tx.sign();
      await tx.send();

      const block = await appChain.produceBlock();
      const transaction = block?.transactions[0];
      expect(transaction?.status.toBoolean()).toBe(false);
      expect(transaction?.statusMessage).toBe(
        "User is not whitelisted for this pool"
      );
    });
  });

  describe("getOrder", () => {
    it("should return the correct order", async () => {
      // Setup
      const order = new Order({
        user: alice,
        amountIn: UInt64.from(100),
        amountOut: UInt64.from(50),
        isAtoB: Bool(true),
      });
      const appChain = await startAppChain();
      appChain.setSigner(alicePrivateKey);
      const darkPool = appChain.runtime.resolve("DarkPool");

      let tx = await appChain.transaction(alice, async () => {
        await darkPool.whitelistUser(alice, poolKey);
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      tx = await appChain.transaction(alice, async () => {
        await darkPool.submitOrder(order, poolKey);
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Act
      const retrievedOrder =
        await appChain.query.runtime.DarkPool.orderBook.get(UInt64.from(1));

      // Assert
      expect(retrievedOrder).toEqual(order);
    });

    it("should return None for non-existent order", async () => {
      // Act
      const appChain = await startAppChain();
      const retrievedOrder =
        await appChain.query.runtime.DarkPool.orderBook.get(UInt64.from(999));

      // Assert
      expect(retrievedOrder).toBeUndefined();
    });
  });

  describe("whitelistUser", () => {
    it("should whitelist a user for a pool", async () => {
      // Setup
      const appChain = await startAppChain();
      appChain.setSigner(alicePrivateKey);
      const darkPool = appChain.runtime.resolve("DarkPool");

      // Act
      let tx = await appChain.transaction(alice, async () => {
        await darkPool.whitelistUser(alice, poolKey);
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Assert
      const isWhitelisted =
        await appChain.query.runtime.DarkPool.poolWhitelist.get({
          user: alice,
          poolKey,
        });
      expect(isWhitelisted?.toBoolean()).toBe(true);
    });
  });

  describe("dewhitelistUser", () => {
    it("should dewhitelist a user for a pool", async () => {
      // Setup
      const appChain = await startAppChain();
      appChain.setSigner(alicePrivateKey);
      const darkPool = appChain.runtime.resolve("DarkPool");

      let tx = await appChain.transaction(alice, async () => {
        await darkPool.whitelistUser(alice, poolKey);
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Act
      tx = await appChain.transaction(alice, async () => {
        await darkPool.dewhitelistUser(alice, poolKey);
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Assert
      const isWhitelisted =
        await appChain.query.runtime.DarkPool.poolWhitelist.get({
          user: alice,
          poolKey,
        });
      expect(isWhitelisted?.toBoolean()).toBe(false);
    });
  });

  describe("removeOrder", () => {
    it("should remove an existing order", async () => {
      // Setup
      const appChain = await startAppChain();
      appChain.setSigner(alicePrivateKey);
      const darkPool = appChain.runtime.resolve("DarkPool");
      const order = new Order({
        user: alice,
        amountIn: UInt64.from(100),
        amountOut: UInt64.from(50),
        isAtoB: Bool(true),
      });
      let tx = await appChain.transaction(alice, async () => {
        await darkPool.whitelistUser(alice, poolKey);
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      tx = await appChain.transaction(alice, async () => {
        await darkPool.submitOrder(order, poolKey);
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Act
      tx = await appChain.transaction(alice, async () => {
        await darkPool.removeOrder(UInt64.from(1));
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Assert
      const removedOrder = await appChain.query.runtime.DarkPool.orderBook.get(
        UInt64.from(1)
      );
      expect(removedOrder).toEqual(Order.empty());

      const userOrderCount =
        await appChain.query.runtime.DarkPool.userOrderCount.get(alice);
      expect(userOrderCount).toEqual(UInt64.from(0));
    });

    it("should fail when trying to remove a non-existent order", async () => {
      // Setup
      const appChain = await startAppChain();
      appChain.setSigner(alicePrivateKey);
      const darkPool = appChain.runtime.resolve("DarkPool");

      // Act & Assert
      const tx = await appChain.transaction(alice, async () => {
        await darkPool.removeOrder(UInt64.from(999));
      });
      await tx.sign();
      await tx.send();

      // Assert
      const block = await appChain.produceBlock();
      const transaction = block?.transactions[0];
      expect(transaction?.status.toBoolean()).toBe(false);
      expect(transaction?.statusMessage).toBe("Order does not exist");
    });
  });
});
