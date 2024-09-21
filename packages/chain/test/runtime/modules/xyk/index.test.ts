import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey, Provable } from "o1js";
import "reflect-metadata";
import { Balances } from "../../../../src/runtime/modules/balances";
import { Faucet } from "../../../../src/runtime/modules/faucet";
import { TokenRegistry } from "../../../../src/runtime/modules/token-registry";
import { errors, TokenIdPath, XYK } from "../../../../src/runtime/modules/xyk";
import { LPTokenId } from "../../../../src/runtime/modules/xyk/lp-token-id";
import { PoolKey } from "../../../../src/runtime/modules/xyk/pool-key";
import { TokenPair } from "../../../../src/runtime/modules/xyk/token-pair";
import { drip } from "../../helpers";

const config = {
  Balances: {
    totalSupply: Balance.from(10_000_000_000),
  },
  TokenRegistry: {
    maxTokens: UInt64.from(100),
  },
  XYK: {
    feeDivider: 1000n,
    fee: 3n,
    minimumLiquidity: Balance.from(0),
  },
  Faucet: {},
};

describe("xyk", () => {
  const alicePrivateKey = PrivateKey.random();
  const alice = alicePrivateKey.toPublicKey();

  const tokenAId = TokenId.from(0);
  const tokenBId = TokenId.from(1);
  const tokenAInitialLiquidity = Balance.from(1_000_000);
  const tokenBInitialLiquidity = Balance.from(1_000_000);
  const poolKey = PoolKey.fromTokenPair(TokenPair.from(tokenAId, tokenBId));
  const lpTokenId = LPTokenId.fromTokenPair(TokenPair.from(tokenAId, tokenBId));

  describe("initial state", () => {
    it("should have no liquidity", async () => {
      const appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

      const poolKey = PoolKey.fromTokenPair(TokenPair.from(tokenAId, tokenBId));
      const pool = await appChain.query.runtime.XYK.pools.get(poolKey);
      const liquidity = {
        tokenA: await appChain.query.runtime.Balances.balances.get({
          address: poolKey,
          tokenId: tokenAId,
        }),
        tokenB: await appChain.query.runtime.Balances.balances.get({
          address: poolKey,
          tokenId: tokenBId,
        }),
      };

      expect(pool).toBeUndefined();
      expect(liquidity.tokenA).toBeUndefined();
      expect(liquidity.tokenB).toBeUndefined();
    });
  });

  describe("create pool", () => {
    it("should create a pool", async () => {
      const appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

      await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity, {
        nonce: 0,
      });
      await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity, {
        nonce: 1,
      });
      await appChain.produceBlock();

      const xyk = appChain.runtime.resolve("XYK");
      const tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.createPoolSigned(
            tokenAId,
            tokenBId,
            tokenAInitialLiquidity,
            tokenBInitialLiquidity
          );
        },
        {
          nonce: 2,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      const pool = await appChain.query.runtime.XYK.pools.get(poolKey);
      const tokenALiquidity =
        await appChain.query.runtime.Balances.balances.get({
          address: poolKey,
          tokenId: tokenAId,
        });
      const tokenBLiquidity =
        await appChain.query.runtime.Balances.balances.get({
          address: poolKey,
          tokenId: tokenBId,
        });

      const aliceLpBalance = await appChain.query.runtime.Balances.balances.get(
        {
          address: alice,
          tokenId: lpTokenId,
        }
      );

      expect(pool).toBeDefined();
      expect(tokenALiquidity?.toString()).toEqual(
        tokenAInitialLiquidity.toString()
      );
      expect(tokenBLiquidity?.toString()).toEqual(
        tokenBInitialLiquidity.toString()
      );
      expect(aliceLpBalance?.toString()).toEqual(
        tokenAInitialLiquidity.toString()
      );
    });

    it("should not create a pool if the pool already exists", async () => {
      const appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

      await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity, {
        nonce: 0,
      });
      await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity, {
        nonce: 1,
      });
      await appChain.produceBlock();

      const xyk = appChain.runtime.resolve("XYK");
      let tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.createPoolSigned(
            tokenAId,
            tokenBId,
            tokenAInitialLiquidity,
            tokenBInitialLiquidity
          );
        },
        {
          nonce: 2,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.createPoolSigned(
            tokenAId,
            tokenBId,
            tokenAInitialLiquidity,
            tokenBInitialLiquidity
          );
        },
        {
          nonce: 3,
        }
      );
      await tx.sign();
      await tx.send();
      const block = await appChain.produceBlock();

      const transaction = block?.transactions[0];
      expect(transaction?.statusMessage).toBe(errors.poolAlreadyExists());
    });
  });

  describe("add liquidity", () => {
    it("should add liquidity to an existing pool", async () => {
      const appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });
      await appChain.start();
      await drip(
        appChain,
        alicePrivateKey,
        tokenAId,
        Balance.from(tokenAInitialLiquidity.mul(2)),
        {
          nonce: 0,
        }
      );
      await drip(
        appChain,
        alicePrivateKey,
        tokenBId,
        Balance.from(tokenBInitialLiquidity.mul(2)),
        {
          nonce: 1,
        }
      );
      await appChain.produceBlock();

      const xyk = appChain.runtime.resolve("XYK");
      let tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.createPoolSigned(
            tokenAId,
            tokenBId,
            tokenAInitialLiquidity,
            tokenBInitialLiquidity
          );
        },
        {
          nonce: 2,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.addLiquiditySigned(
            tokenAId,
            tokenBId,
            Balance.from(tokenAInitialLiquidity.div(2)),
            Balance.from(tokenBInitialLiquidity.div(2))
          );
        },
        {
          nonce: 3,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      const aliceLpBalance = await appChain.query.runtime.Balances.balances.get(
        {
          address: alice,
          tokenId: lpTokenId,
        }
      );
      const tokenALiquidity =
        await appChain.query.runtime.Balances.balances.get({
          address: poolKey,
          tokenId: tokenAId,
        });
      const tokenBLiquidity =
        await appChain.query.runtime.Balances.balances.get({
          address: poolKey,
          tokenId: tokenBId,
        });

      expect(aliceLpBalance?.toString()).toEqual(
        tokenAInitialLiquidity.add(tokenAInitialLiquidity.div(2)).toString()
      );
      expect(tokenALiquidity?.toString()).toEqual(
        tokenAInitialLiquidity.add(tokenAInitialLiquidity.div(2)).toString()
      );
      expect(tokenBLiquidity?.toString()).toEqual(
        tokenBInitialLiquidity.add(tokenBInitialLiquidity.div(2)).toString()
      );
    });
  });

  describe("remove liquidity", () => {
    it("should remove liquidity from an existing pool", async () => {
      const appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

      await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity, {
        nonce: 0,
      });
      await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity, {
        nonce: 1,
      });
      await appChain.produceBlock();
      const xyk = appChain.runtime.resolve("XYK");
      let tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.createPoolSigned(
            tokenAId,
            tokenBId,
            tokenAInitialLiquidity,
            tokenBInitialLiquidity
          );
          await xyk.addLiquiditySigned(
            tokenAId,
            tokenBId,
            tokenAInitialLiquidity,
            tokenBInitialLiquidity
          );
        },
        {
          nonce: 2,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Act
      tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.removeLiquiditySigned(
            tokenAId,
            tokenBId,
            tokenAInitialLiquidity,
            tokenAInitialLiquidity,
            tokenBInitialLiquidity
          );
        },
        {
          nonce: 3,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();
      const aliceLpBalance = await appChain.query.runtime.Balances.balances.get(
        {
          address: alice,
          tokenId: lpTokenId,
        }
      );
      const tokenALiquidity =
        await appChain.query.runtime.Balances.balances.get({
          address: poolKey,
          tokenId: tokenAId,
        });
      const tokenBLiquidity =
        await appChain.query.runtime.Balances.balances.get({
          address: poolKey,
          tokenId: tokenBId,
        });

      expect(aliceLpBalance).toBeUndefined();
      expect(tokenALiquidity).toBeUndefined();
      expect(tokenBLiquidity).toBeUndefined();
    });
  });

  describe("sell", () => {
    it("should sell tokens for tokens out", async () => {
      const appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

      await drip(
        appChain,
        alicePrivateKey,
        tokenAId,
        tokenAInitialLiquidity.mul(2),
        {
          nonce: 0,
        }
      );
      await drip(
        appChain,
        alicePrivateKey,
        tokenBId,
        tokenBInitialLiquidity.mul(2),
        {
          nonce: 1,
        }
      );
      await appChain.produceBlock();

      const xyk = appChain.runtime.resolve("XYK");
      let tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.createPoolSigned(
            tokenAId,
            tokenBId,
            tokenAInitialLiquidity,
            tokenBInitialLiquidity
          );
        },
        {
          nonce: 2,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      const path = new TokenIdPath({
        path: [
          tokenAId,
          tokenBId,
          TokenId.from(
            appChain.runtime.config.TokenRegistry!.maxTokens.toBigInt()
          ),
        ],
      });

      tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.sellPathSigned(path, Balance.from(100), Balance.from(1));
        },
        {
          nonce: 3,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      const balanceA = await appChain.query.runtime.Balances.balances.get({
        address: alice,
        tokenId: tokenAId,
      });
      const balanceB = await appChain.query.runtime.Balances.balances.get({
        address: alice,
        tokenId: tokenBId,
      });

      expect(balanceA?.toString()).toEqual("999900");
      expect(balanceB?.toString()).toEqual("1000099");
    });
  });

  describe("whitelist", () => {
    it("should whitelist creators", async () => {
      const appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

      const xyk = appChain.runtime.resolve("XYK");
      const tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.createPoolSigned(
            tokenAId,
            tokenBId,
            tokenAInitialLiquidity,
            tokenBInitialLiquidity
          );
        },
        {
          nonce: 0,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();
      Provable.log({ alice, poolKey });
      const isWhitelisted = await appChain.query.runtime.XYK.poolWhitelist.get({
        user: alice,
        poolKey,
      });

      expect(isWhitelisted?.toBoolean()).toBe(true);
    });

    it("should work when called directly", async () => {
      const appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

      const xyk = appChain.runtime.resolve("XYK");
      const tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.whitelistUser(alice, poolKey);
        },
        {
          nonce: 0,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      const isWhitelisted = await appChain.query.runtime.XYK.poolWhitelist.get({
        user: alice,
        poolKey,
      });

      expect(isWhitelisted?.toBoolean()).toBe(true);
    });
  });
});
