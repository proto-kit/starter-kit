import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey, Provable, PublicKey } from "o1js";
import "reflect-metadata";
import { Balances } from "../../../src/runtime/modules/balances";
import { Faucet } from "../../../src/runtime/modules/faucet";
import { TokenRegistry } from "../../../src/runtime/modules/tokens";
import { TokenIdPath, XYK, errors } from "../../../src/runtime/modules/xyk";
import { LPTokenId } from "../../../src/runtime/modules/xyk/lp-token-id";
import { PoolKey } from "../../../src/runtime/modules/xyk/pool-key";
import { TokenPair } from "../../../src/runtime/modules/xyk/token-pair";
import { drip } from "../helpers";

describe("xyk", () => {
  const alicePrivateKey = PrivateKey.random();
  const alice = alicePrivateKey.toPublicKey();

  const tokenAId = TokenId.from(0);
  const tokenBId = TokenId.from(1);
  const tokenAInitialLiquidity = Balance.from(1_000_000);
  const tokenBInitialLiquidity = Balance.from(1_000_000);

  const lpTokenId = LPTokenId.fromTokenPair(TokenPair.from(tokenAId, tokenBId));
  let appChain: any;

  async function createPoolSigned(
    appChain: any,
    senderPrivateKey: PrivateKey,
    tokenAId: TokenId,
    tokenBId: TokenId,
    tokenAAmount: Balance,
    tokenBAmount: Balance,
    options?: { nonce: number }
  ) {
    const xyk = appChain.runtime.resolve("XYK");
    await appChain.start();
    appChain.setSigner(senderPrivateKey);

    const tx = await appChain.transaction(
      senderPrivateKey.toPublicKey(),
      async () => {
        await xyk.createPoolSigned(
          tokenAId,
          tokenBId,
          tokenAAmount,
          tokenBAmount
        );
      },
      options
    );

    await tx.sign();
    await tx.send();

    return tx;
  }

  async function addLiquiditySigned(
    appChain: any,
    senderPrivateKey: PrivateKey,
    tokenAId: TokenId,
    tokenBId: TokenId,
    tokenAAmount: Balance,
    tokenBLimit: Balance,
    options?: { nonce: number }
  ) {
    const xyk = appChain.runtime.resolve("XYK");
    await appChain.start();
    appChain.setSigner(senderPrivateKey);

    const tx = await appChain.transaction(
      senderPrivateKey.toPublicKey(),
      async () => {
        await xyk.addLiquiditySigned(
          tokenAId,
          tokenBId,
          tokenAAmount,
          tokenBLimit
        );
      },
      options
    );

    await tx.sign();
    await tx.send();

    return tx;
  }

  async function removeLiquiditySigned(
    appChain: any,
    senderPrivateKey: PrivateKey,
    tokenAId: TokenId,
    tokenBId: TokenId,
    lpTokenAmount: Balance,
    tokenAAmountLimit: Balance,
    tokenBAmountLimit: Balance,
    options?: { nonce: number }
  ) {
    const xyk = appChain.runtime.resolve("XYK");
    await appChain.start();
    appChain.setSigner(senderPrivateKey);

    const tx = await appChain.transaction(
      senderPrivateKey.toPublicKey(),
      async () => {
        await xyk.removeLiquiditySigned(
          tokenAId,
          tokenBId,
          lpTokenAmount,
          tokenAAmountLimit,
          tokenBAmountLimit
        );
      },
      options
    );

    await tx.sign();
    await tx.send();

    return tx;
  }

  async function sellPathSigned(
    appChain: any,
    senderPrivateKey: PrivateKey,
    path: TokenIdPath,
    amountIn: Balance,
    amountOutMinLimit: Balance,
    options?: { nonce: number }
  ) {
    const xyk = appChain.runtime.resolve("XYK");
    await appChain.start();
    appChain.setSigner(senderPrivateKey);

    const tx = await appChain.transaction(
      senderPrivateKey.toPublicKey(),
      async () => {
        await xyk.sellPathSigned(path, amountIn, amountOutMinLimit);
      },
      options
    );

    await tx.sign();
    await tx.send();

    return tx;
  }

  async function queryPool(
    appChain: any,
    tokenAId: TokenId,
    tokenBId: TokenId
  ) {
    const address = PoolKey.fromTokenPair(TokenPair.from(tokenAId, tokenBId));
    await appChain.start();
    return {
      pool: await appChain.query.runtime.XYK.pools.get(address),
      liquidity: {
        tokenA: await appChain.query.runtime.Balances.balances.get({
          address,
          tokenId: tokenAId,
        }),
        tokenB: await appChain.query.runtime.Balances.balances.get({
          address,
          tokenId: tokenBId,
        }),
      },
    };
  }

  async function queryBalance(
    appChain: any,
    tokenId: TokenId,
    address: PublicKey
  ) {
    await appChain.start();
    return {
      balance: await appChain.query.runtime.Balances.balances.get({
        tokenId,
        address,
      }),
    };
  }

  describe("create pool", () => {
    beforeEach(async () => {
      appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: {
          Balances: {
            totalSupply: Balance.from(10_000),
          },
          TokenRegistry: {
            maxTokens: UInt64.from(100),
          },
          XYK: {
            feeDivider: 1000n,
            fee: 3n,
          },
          Faucet: {},
        },
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);
    });

    it("should create a pool", async () => {
      await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity);
      await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity);

      await createPoolSigned(
        appChain,
        alicePrivateKey,
        tokenAId,
        tokenBId,
        tokenAInitialLiquidity,
        tokenBInitialLiquidity
      );

      await appChain.produceBlock();

      const { pool, liquidity } = await queryPool(appChain, tokenAId, tokenBId);
      const { balance: aliceLpBalance } = await queryBalance(
        appChain,
        lpTokenId,
        alice
      );

      expect(pool).toBeDefined();
      expect(liquidity.tokenA?.toString()).toEqual(
        tokenAInitialLiquidity.toString()
      );
      expect(liquidity.tokenB?.toString()).toEqual(
        tokenBInitialLiquidity.toString()
      );
      expect(aliceLpBalance?.toString()).toEqual(
        tokenAInitialLiquidity.toString()
      );
    });

    it("should not create a pool if the pool already exists", async () => {
      await createPoolSigned(
        appChain,
        alicePrivateKey,
        tokenAId,
        tokenBId,
        tokenAInitialLiquidity,
        tokenBInitialLiquidity
      );

      const block = await appChain.produceBlock();
      const tx = block?.transactions[0];

      expect(tx?.status.toBoolean()).toBe(false);
      expect(tx?.statusMessage).toBe(errors.poolAlreadyExists());
    });
  });

  describe("add liquidity", () => {
    beforeEach(async () => {
      appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: {
          Balances: {
            totalSupply: Balance.from(10_000),
          },
          TokenRegistry: {
            maxTokens: UInt64.from(100),
          },
          XYK: {
            feeDivider: 1000n,
            fee: 3n,
          },
          Faucet: {},
        },
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

      await drip(
        appChain,
        alicePrivateKey,
        tokenAId,
        Balance.from(tokenAInitialLiquidity.mul(2))
      );
      await drip(
        appChain,
        alicePrivateKey,
        tokenBId,
        Balance.from(tokenBInitialLiquidity.mul(2))
      );

      await createPoolSigned(
        appChain,
        alicePrivateKey,
        tokenAId,
        tokenBId,
        tokenAInitialLiquidity,
        tokenBInitialLiquidity
      );
    });

    it("should add liquidity to an existing pool", async () => {
      await addLiquiditySigned(
        appChain,
        alicePrivateKey,
        tokenAId,
        tokenBId,
        Balance.from(tokenAInitialLiquidity.div(2)),
        Balance.from(tokenBInitialLiquidity.div(2))
      );

      await appChain.produceBlock();
      const { balance: aliceLpBalance } = await queryBalance(
        appChain,
        lpTokenId,
        alice
      );

      const { liquidity } = await queryPool(appChain, tokenAId, tokenBId);

      expect(aliceLpBalance?.toString()).toEqual(
        tokenAInitialLiquidity.add(tokenAInitialLiquidity.div(2)).toString()
      );
      expect(liquidity.tokenA?.toString()).toEqual(
        tokenAInitialLiquidity.add(tokenAInitialLiquidity.div(2)).toString()
      );
      expect(liquidity.tokenB?.toString()).toEqual(
        tokenBInitialLiquidity.add(tokenBInitialLiquidity.div(2)).toString()
      );
    });
  });

  describe("remove liquidity", () => {
    beforeEach(async () => {
      appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: {
          Balances: {
            totalSupply: Balance.from(10_000),
          },
          TokenRegistry: {
            maxTokens: UInt64.from(100),
          },
          XYK: {
            feeDivider: 1000n,
            fee: 3n,
          },
          Faucet: {},
        },
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

      await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity);
      await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity);

      await createPoolSigned(
        appChain,
        alicePrivateKey,
        tokenAId,
        tokenBId,
        tokenAInitialLiquidity,
        tokenBInitialLiquidity
      );
    });

    it("should add liquidity to an existing pool", async () => {
      await removeLiquiditySigned(
        appChain,
        alicePrivateKey,
        tokenAId,
        tokenBId,
        tokenAInitialLiquidity,
        tokenAInitialLiquidity,
        tokenBInitialLiquidity
      );

      await appChain.produceBlock();
      const { balance: aliceLpBalance } = await queryBalance(
        appChain,
        lpTokenId,
        alice
      );

      const { liquidity } = await queryPool(appChain, tokenAId, tokenBId);

      expect(aliceLpBalance?.toString()).toEqual("0");
      expect(liquidity.tokenA?.toString()).toEqual("0");
      expect(liquidity.tokenB?.toString()).toEqual("0");
    });
  });

  describe("sell", () => {
    beforeEach(async () => {
      appChain = TestingAppChain.fromRuntime({
        Faucet,
        Balances,
        XYK,
        TokenRegistry,
      });
      appChain.configurePartial({
        Runtime: {
          Balances: {
            totalSupply: Balance.from(10_000),
          },
          TokenRegistry: {
            maxTokens: UInt64.from(100),
          },
          XYK: {
            feeDivider: 1000n,
            fee: 3n,
          },
          Faucet: {},
        },
      });
      await appChain.start();
      appChain.setSigner(alicePrivateKey);

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

      await createPoolSigned(
        appChain,
        alicePrivateKey,
        tokenAId,
        tokenBId,
        tokenAInitialLiquidity,
        tokenBInitialLiquidity
      );
    });

    it("should sell tokens for tokens out", async () => {
      const path = new TokenIdPath({
        path: [
          tokenAId,
          tokenBId,
          TokenId.from(
            appChain.runtime.config.TokenRegistry!.maxTokens.toBigInt()
          ),
        ],
      });

      await sellPathSigned(
        appChain,
        alicePrivateKey,
        path,
        Balance.from(100),
        Balance.from(1)
      );

      const block = await appChain.produceBlock();
      Provable.log("block", block);

      const { balance: balanceA } = await queryBalance(
        appChain,
        tokenAId,
        alice
      );

      const { balance: balanceB } = await queryBalance(
        appChain,
        tokenBId,
        alice
      );

      expect(balanceA?.toString()).toEqual("999900");
      expect(balanceB?.toString()).toEqual("1000099");

      Provable.log("balances", {
        balanceA,
        balanceB,
      });
    });
  });
});
