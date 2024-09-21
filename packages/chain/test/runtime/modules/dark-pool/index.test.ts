import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { TestingAppChain } from "@proto-kit/sdk";
import { Bool, Field, Poseidon, PrivateKey, PublicKey } from "o1js";
import "reflect-metadata";
import { Balances } from "../../../../src/runtime/modules/balances";
import {
  DarkPool,
  Order,
  PoolWhitelist,
} from "../../../../src/runtime/modules/dark-pool";
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
      const appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        DarkPool,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });

      await appChain.start();
      appChain.setSigner(alicePrivateKey);
      const darkPool = appChain.runtime.resolve("DarkPool");
      const order = new Order({
        user: alice,
        amountIn: UInt64.from(100),
        amountOut: UInt64.from(50),
        isAtoB: Bool(true),
      });

      // Whitelist the user
      await darkPool.whitelistUser(alice, poolKey);
      await appChain.produceBlock();

      // Act
      const tx = await appChain.transaction(alice, () =>
        darkPool.submitOrder(order, poolKey)
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Assert
      const submittedOrder = await darkPool.orderBook.get(UInt64.from(1));
      expect(submittedOrder.isSome).toBe(true);
      expect(submittedOrder.value).toEqual(order);

      const userOrderCount = await darkPool.userOrderCount.get(alice);
      expect(userOrderCount.value).toEqual(UInt64.from(1));

      const firstOrderId = await darkPool.firstOrderId.get();
      expect(firstOrderId.value).toEqual(UInt64.from(1));

      const lastOrderId = await darkPool.lastOrderId.get();
      expect(lastOrderId.value).toEqual(UInt64.from(1));
    });

    it("should fail when user is not whitelisted", async () => {
      // Setup
      const appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        DarkPool,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);
      const darkPool = appChain.runtime.resolve("DarkPool");
      const order = new Order({
        user: alice,
        amountIn: UInt64.from(100),
        amountOut: UInt64.from(50),
        isAtoB: Bool(true),
      });

      // Act & Assert
      await expect(
        appChain.transaction(alice, () => darkPool.submitOrder(order, poolKey))
      ).rejects.toThrow("User is not whitelisted for this pool");
    });
  });
});
