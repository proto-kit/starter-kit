import {
  Balance,
  TokenId,
  UInt64,
  type SimpleSequencerModulesRecord,
  type VanillaRuntimeModulesRecord,
} from "@proto-kit/library";
import type { RuntimeModulesRecord } from "@proto-kit/module";
import type {
  MandatoryProtocolModulesRecord,
  ProtocolModulesRecord,
} from "@proto-kit/protocol";
import { TestingAppChain, type AppChainModulesRecord } from "@proto-kit/sdk";
import { Field, PrivateKey, PublicKey } from "o1js";
import "reflect-metadata";
import { Balances } from "../../../../src/runtime/modules/balances";
import {
  DarkPool,
  errors,
  TokenIdPath,
} from "../../../../src/runtime/modules/darkpool";
import { LPTokenId } from "../../../../src/runtime/modules/darkpool/lp-token-id";
import { PoolKey } from "../../../../src/runtime/modules/darkpool/pool-key";
import { TokenPair } from "../../../../src/runtime/modules/darkpool/token-pair";
import { Faucet } from "../../../../src/runtime/modules/faucet";
import { TokenRegistry } from "../../../../src/runtime/modules/tokens";
import { drip } from "../../helpers";

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

describe("darkpool", () => {
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
  //   const DarkPool = appChain.runtime.resolve("DarkPool");
  //   appChain.setSigner(senderPrivateKey);

  //   const tx = await appChain.transaction(
  //     senderPrivateKey.toPublicKey(),
  //     async () => {
  //       await DarkPool.createPoolSigned(
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
  //   const DarkPool = appChain.runtime.resolve("DarkPool");
  //   appChain.setSigner(senderPrivateKey);

  //   const tx = await appChain.transaction(
  //     senderPrivateKey.toPublicKey(),
  //     async () => {
  //       await DarkPool.addLiquiditySigned(
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
  //   const DarkPool = appChain.runtime.resolve("DarkPool");
  //   appChain.setSigner(senderPrivateKey);

  //   const tx = await appChain.transaction(
  //     senderPrivateKey.toPublicKey(),
  //     async () => {
  //       await DarkPool.removeLiquiditySigned(
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
  //   const DarkPool = appChain.runtime.resolve("DarkPool");
  //   appChain.setSigner(senderPrivateKey);

  //   const tx = await appChain.transaction(
  //     senderPrivateKey.toPublicKey(),
  //     async () => {
  //       await DarkPool.sellPathSigned(path, amountIn, amountOutMinLimit);
  //     },
  //     options
  //   );

  //   await tx.sign();
  //   await tx.send();

  //   return tx;
  // }

  // async function queryPool(tokenAId: TokenId, tokenBId: TokenId) {
  //   const poolKey = PoolKey.fromTokenPair(TokenPair.from(tokenAId, tokenBId));
  //   const poolExists = await appChain.query.runtime.DarkPool.pools.get(poolKey);
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
        DarkPool,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: config,
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

      const poolKey = PoolKey.fromTokenPair(TokenPair.from(tokenAId, tokenBId));
      const pool = await appChain.query.runtime.DarkPool.pools.get(poolKey);
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
        DarkPool,
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

      const darkPool = appChain.runtime.resolve("DarkPool");
      const tx = await appChain.transaction(
        alice,
        async () => {
          await darkPool.createPoolSigned(
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

      const pool = await appChain.query.runtime.DarkPool.pools.get(poolKey);
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
        DarkPool,
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

      const darkPool = appChain.runtime.resolve("DarkPool");
      let tx = await appChain.transaction(
        alice,
        async () => {
          await darkPool.createPoolSigned(
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
          await darkPool.createPoolSigned(
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

      try {
        await appChain.produceBlock();
      } catch (e) {
        expect((e as Error).message).toBe(errors.poolAlreadyExists());
      }
    });
  });

  // describe("add liquidity", () => {
  //   beforeEach(async () => {
  //     appChain = TestingAppChain.fromRuntime({
  //       Faucet,
  //       Balances,
  //       DarkPool,
  //       TokenRegistry,
  //     });
  //     appChain.configurePartial({
  //       Runtime: {
  //         Balances: {
  //           totalSupply: Balance.from(10_000),
  //         },
  //         TokenRegistry: {
  //           maxTokens: UInt64.from(100),
  //         },
  //         DarkPool: {
  //           feeDivider: 1000n,
  //           fee: 3n,
  //         },
  //         Faucet: {},
  //       },
  //     });
  //     await appChain.start();
  //     appChain.setSigner(alicePrivateKey);

  //     await drip(
  //       appChain,
  //       alicePrivateKey,
  //       tokenAId,
  //       Balance.from(tokenAInitialLiquidity.mul(2))
  //     );
  //     await drip(
  //       appChain,
  //       alicePrivateKey,
  //       tokenBId,
  //       Balance.from(tokenBInitialLiquidity.mul(2))
  //     );

  //     await createPoolSigned(
  //       appChain,
  //       alicePrivateKey,
  //       tokenAId,
  //       tokenBId,
  //       tokenAInitialLiquidity,
  //       tokenBInitialLiquidity
  //     );
  //   });

  //   it("should add liquidity to an existing pool", async () => {
  //     await addLiquiditySigned(
  //       appChain,
  //       alicePrivateKey,
  //       tokenAId,
  //       tokenBId,
  //       Balance.from(tokenAInitialLiquidity.div(2)),
  //       Balance.from(tokenBInitialLiquidity.div(2))
  //     );

  //     await appChain.produceBlock();
  //     const { balance: aliceLpBalance } = await queryBalance(
  //       appChain,
  //       lpTokenId,
  //       alice
  //     );

  //     const { liquidity } = await queryPool(appChain, tokenAId, tokenBId);

  //     expect(aliceLpBalance?.toString()).toEqual(
  //       tokenAInitialLiquidity.add(tokenAInitialLiquidity.div(2)).toString()
  //     );
  //     expect(liquidity.tokenA?.toString()).toEqual(
  //       tokenAInitialLiquidity.add(tokenAInitialLiquidity.div(2)).toString()
  //     );
  //     expect(liquidity.tokenB?.toString()).toEqual(
  //       tokenBInitialLiquidity.add(tokenBInitialLiquidity.div(2)).toString()
  //     );
  //   });
  // });

  // describe("remove liquidity", () => {
  //   beforeEach(async () => {
  //     appChain = TestingAppChain.fromRuntime({
  //       Faucet,
  //       Balances,
  //       DarkPool,
  //       TokenRegistry,
  //     });
  //     appChain.configurePartial({
  //       Runtime: {
  //         Balances: {
  //           totalSupply: Balance.from(10_000),
  //         },
  //         TokenRegistry: {
  //           maxTokens: UInt64.from(100),
  //         },
  //         DarkPool: {
  //           feeDivider: 1000n,
  //           fee: 3n,
  //         },
  //         Faucet: {},
  //       },
  //     });
  //     await appChain.start();
  //     appChain.setSigner(alicePrivateKey);

  //     await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity);
  //     await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity);

  //     await createPoolSigned(
  //       appChain,
  //       alicePrivateKey,
  //       tokenAId,
  //       tokenBId,
  //       tokenAInitialLiquidity,
  //       tokenBInitialLiquidity
  //     );
  //   });

  //   it("should add liquidity to an existing pool", async () => {
  //     await removeLiquiditySigned(
  //       appChain,
  //       alicePrivateKey,
  //       tokenAId,
  //       tokenBId,
  //       tokenAInitialLiquidity,
  //       tokenAInitialLiquidity,
  //       tokenBInitialLiquidity
  //     );

  //     await appChain.produceBlock();
  //     const { balance: aliceLpBalance } = await queryBalance(
  //       appChain,
  //       lpTokenId,
  //       alice
  //     );

  //     const { liquidity } = await queryPool(appChain, tokenAId, tokenBId);

  //     expect(aliceLpBalance?.toString()).toEqual("0");
  //     expect(liquidity.tokenA?.toString()).toEqual("0");
  //     expect(liquidity.tokenB?.toString()).toEqual("0");
  //   });
  // });

  // describe("sell", () => {
  //   beforeEach(async () => {
  //     appChain = TestingAppChain.fromRuntime({
  //       Faucet,
  //       Balances,
  //       DarkPool,
  //       TokenRegistry,
  //     });
  //     appChain.configurePartial({
  //       Runtime: {
  //         Balances: {
  //           totalSupply: Balance.from(10_000),
  //         },
  //         TokenRegistry: {
  //           maxTokens: UInt64.from(100),
  //         },
  //         DarkPool: {
  //           feeDivider: 1000n,
  //           fee: 3n,
  //         },
  //         Faucet: {},
  //       },
  //     });
  //     await appChain.start();
  //     appChain.setSigner(alicePrivateKey);

  //     await drip(
  //       appChain,
  //       alicePrivateKey,
  //       tokenAId,
  //       tokenAInitialLiquidity.mul(2)
  //     );
  //     await drip(
  //       appChain,
  //       alicePrivateKey,
  //       tokenBId,
  //       tokenBInitialLiquidity.mul(2)
  //     );

  //     await createPoolSigned(
  //       appChain,
  //       alicePrivateKey,
  //       tokenAId,
  //       tokenBId,
  //       tokenAInitialLiquidity,
  //       tokenBInitialLiquidity
  //     );
  //   });

  //   it("should sell tokens for tokens out", async () => {
  //     const path = new TokenIdPath({
  //       path: [
  //         tokenAId,
  //         tokenBId,
  //         TokenId.from(
  //           appChain.runtime.config.TokenRegistry!.maxTokens.toBigInt()
  //         ),
  //       ],
  //     });

  //     await sellPathSigned(
  //       appChain,
  //       alicePrivateKey,
  //       path,
  //       Balance.from(100),
  //       Balance.from(1)
  //     );

  //     const block = await appChain.produceBlock();
  //     Provable.log("block", block);

  //     const { balance: balanceA } = await queryBalance(
  //       appChain,
  //       tokenAId,
  //       alice
  //     );

  //     const { balance: balanceB } = await queryBalance(
  //       appChain,
  //       tokenBId,
  //       alice
  //     );

  //     expect(balanceA?.toString()).toEqual("999900");
  //     expect(balanceB?.toString()).toEqual("1000099");

  //     Provable.log("balances", {
  //       balanceA,
  //       balanceB,
  //     });
  //   });
  // });
});
