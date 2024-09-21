import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey, Provable } from "o1js";
import "reflect-metadata";
import { Balances } from "../../../../src/runtime/modules/balances";
import { Faucet } from "../../../../src/runtime/modules/faucet";
import { TokenRegistry } from "../../../../src/runtime/modules/tokens";
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

  // async function createPoolSigned(
  //   senderPrivateKey: PrivateKey,
  //   tokenAId: TokenId,
  //   tokenBId: TokenId,
  //   tokenAAmount: Balance,
  //   tokenBAmount: Balance,
  //   options?: { nonce: number }
  // ) {
  //   const XYK = appChain.runtime.resolve("XYK");
  //   appChain.setSigner(senderPrivateKey);

  //   const tx = await appChain.transaction(
  //     senderPrivateKey.toPublicKey(),
  //     async () => {
  //       await XYK.createPoolSigned(
  //         tokenAId,
  //         tokenBId,
  //         tokenAAmount,
  //         tokenBAmount
  //       );
  //     },
  //     options
  //   );

  //   await tx.sign();
  //   await tx.send();

  //   console.log(tx.transaction);

  //   return tx;
  // }

  // async function addLiquiditySigned(
  //   senderPrivateKey: PrivateKey,
  //   tokenAId: TokenId,
  //   tokenBId: TokenId,
  //   tokenAAmount: Balance,
  //   tokenBLimit: Balance,
  //   options?: { nonce: number }
  // ) {
  //   const XYK = appChain.runtime.resolve("XYK");
  //   appChain.setSigner(senderPrivateKey);

  //   const tx = await appChain.transaction(
  //     senderPrivateKey.toPublicKey(),
  //     async () => {
  //       await XYK.addLiquiditySigned(
  //         tokenAId,
  //         tokenBId,
  //         tokenAAmount,
  //         tokenBLimit
  //       );
  //     },
  //     options
  //   );

  //   await tx.sign();
  //   await tx.send();

  //   return tx;
  // }

  // async function removeLiquiditySigned(
  //   senderPrivateKey: PrivateKey,
  //   tokenAId: TokenId,
  //   tokenBId: TokenId,
  //   lpTokenAmount: Balance,
  //   tokenAAmountLimit: Balance,
  //   tokenBAmountLimit: Balance,
  //   options?: { nonce: number }
  // ) {
  //   const XYK = appChain.runtime.resolve("XYK");
  //   appChain.setSigner(senderPrivateKey);

  //   const tx = await appChain.transaction(
  //     senderPrivateKey.toPublicKey(),
  //     async () => {
  //       await XYK.removeLiquiditySigned(
  //         tokenAId,
  //         tokenBId,
  //         lpTokenAmount,
  //         tokenAAmountLimit,
  //         tokenBAmountLimit
  //       );
  //     },
  //     options
  //   );

  //   await tx.sign();
  //   await tx.send();

  //   return tx;
  // }

  // async function sellPathSigned(
  //   senderPrivateKey: PrivateKey,
  //   path: TokenIdPath,
  //   amountIn: Balance,
  //   amountOutMinLimit: Balance,
  //   options?: { nonce: number }
  // ) {
  //   const XYK = appChain.runtime.resolve("XYK");
  //   appChain.setSigner(senderPrivateKey);

  //   const tx = await appChain.transaction(
  //     senderPrivateKey.toPublicKey(),
  //     async () => {
  //       await XYK.sellPathSigned(path, amountIn, amountOutMinLimit);
  //     },
  //     options
  //   );

  //   await tx.sign();
  //   await tx.send();

  //   return tx;
  // }

  // async function queryPool(tokenAId: TokenId, tokenBId: TokenId) {
  //   const poolKey = PoolKey.fromTokenPair(TokenPair.from(tokenAId, tokenBId));
  //   const poolExists = await appChain.query.runtime.XYK.pools.get(poolKey);
  //   return {
  //     pool: poolExists ?? Field.from(1),
  //     liquidity: {
  //       tokenA: await appChain.query.runtime.Balances.balances.get({
  //         address: poolKey,
  //         tokenId: tokenAId,
  //       }),
  //       tokenB: await appChain.query.runtime.Balances.balances.get({
  //         address: poolKey,
  //         tokenId: tokenBId,
  //       }),
  //     },
  //   };
  // }

  // async function queryBalance(tokenId: TokenId, address: PublicKey) {
  //   return {
  //     balance: await appChain.query.runtime.Balances.balances.get({
  //       tokenId,
  //       address,
  //     }),
  //   };
  // }

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

      let nonce = 0;
      await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity, {
        nonce: nonce++,
      });
      await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity, {
        nonce: nonce++,
      });

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
          nonce: nonce++,
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

      let nonce = 0;
      await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity, {
        nonce: nonce++,
      });
      await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity, {
        nonce: nonce++,
      });

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
          nonce: nonce++,
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
          nonce: nonce++,
        }
      );
      await tx.sign();
      await tx.send();

      await expect(appChain.produceBlock()).rejects.toThrow(
        errors.poolAlreadyExists()
      );
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
      let nonce = 0;
      await drip(
        appChain,
        alicePrivateKey,
        tokenAId,
        Balance.from(tokenAInitialLiquidity.mul(2)),
        {
          nonce: nonce++,
        }
      );
      await drip(
        appChain,
        alicePrivateKey,
        tokenBId,
        Balance.from(tokenBInitialLiquidity.mul(2)),
        {
          nonce: nonce++,
        }
      );

      const xyk = appChain.runtime.resolve("XYK");
      await xyk.createPool(
        alice,
        tokenAId,
        tokenBId,
        tokenAInitialLiquidity,
        tokenBInitialLiquidity
      );
      await appChain.produceBlock();

      const tx = await appChain.transaction(
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
          nonce: nonce++,
        }
      );
      await tx.sign();
      await tx.send();
      const block = await appChain.produceBlock();
      console.log({ block: JSON.stringify(block, null, 2) });

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
      let nonce = 0;

      await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity, {
        nonce: nonce++,
      });
      await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity, {
        nonce: nonce++,
      });

      const xyk = appChain.runtime.resolve("XYK");
      await xyk.createPoolSigned(
        tokenAId,
        tokenBId,
        tokenAInitialLiquidity,
        tokenBInitialLiquidity
      );
      await appChain.produceBlock();
      await xyk.addLiquiditySigned(
        tokenAId,
        tokenBId,
        tokenAInitialLiquidity,
        tokenBInitialLiquidity
      );
      await appChain.produceBlock();

      const tx = await appChain.transaction(
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
          nonce: nonce++,
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

      expect(aliceLpBalance?.toString()).toEqual("0");
      expect(tokenALiquidity?.toString()).toEqual("0");
      expect(tokenBLiquidity?.toString()).toEqual("0");
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
      let nonce = 0;

      await drip(
        appChain,
        alicePrivateKey,
        tokenAId,
        tokenAInitialLiquidity.mul(2)
      );
      await drip(
        appChain,
        alicePrivateKey,
        tokenBId,
        tokenBInitialLiquidity.mul(2)
      );

      const xyk = appChain.runtime.resolve("XYK");
      await xyk.createPoolSigned(
        tokenAId,
        tokenBId,
        tokenAInitialLiquidity,
        tokenBInitialLiquidity
      );
      const path = new TokenIdPath({
        path: [
          tokenAId,
          tokenBId,
          TokenId.from(
            appChain.runtime.config.TokenRegistry!.maxTokens.toBigInt()
          ),
        ],
      });

      const tx = await appChain.transaction(
        alice,
        async () => {
          await xyk.sellPathSigned(path, Balance.from(100), Balance.from(1));
        },
        {
          nonce: nonce++,
        }
      );
      await tx.sign();
      await tx.send();

      const block = await appChain.produceBlock();
      Provable.log("block", block);

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

      Provable.log("balances", {});
    });
  });
});
