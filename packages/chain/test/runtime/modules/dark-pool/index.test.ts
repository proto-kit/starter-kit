import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { StateServiceQueryModule, TestingAppChain } from "@proto-kit/sdk";
import {
  Bool,
  MerkleMap,
  Poseidon,
  PrivateKey,
  Provable,
  type PublicKey,
} from "o1js";
import "reflect-metadata";
import { Balances } from "../../../../src/runtime/modules/balances";
import { DarkPool, Order } from "../../../../src/runtime/modules/dark-pool";
import { Faucet } from "../../../../src/runtime/modules/faucet";
import { TokenRegistry } from "../../../../src/runtime/modules/token-registry";
import { LPTokenId } from "../../../../src/runtime/modules/xyk/lp-token-id";
import { PoolKey } from "../../../../src/runtime/modules/xyk/pool-key";
import { TokenPair } from "../../../../src/runtime/modules/xyk/token-pair";
import { drip } from "../../helpers";
import { canSubmitOrderProgram } from "../../../../src/runtime/modules/dark-pool/can-submit-order";

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
    minimumLiquidity: Balance.from(1),
  },
  Faucet: {},
};

const generateProof = async (sender: PublicKey, order: Order) => {
  const map = new MerkleMap();
  const key = Poseidon.hash(sender.toFields());
  map.set(key, Bool(true).toField());

  const witness = map.getWitness(key);

  await canSubmitOrderProgram.compile();

  const poolKey = PoolKey.fromTokenPair(
    TokenPair.from(order.tokenIn, order.tokenOut)
  );
  const stateRoot = map.getRoot();
  const proof = await canSubmitOrderProgram.canSubmitOrder(
    {
      poolKey,
      stateRoot,
    },
    witness,
    order
  );

  return { proof, stateRoot };
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
  });
  await appChain.start();
  return appChain;
};

const DEFAULT_TIMEOUT = 10_000; // 10s

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
    it(
      "should submit an order successfully when user is whitelisted",
      async () => {
        // Setup
        const appChain = await startAppChain();
        appChain.setSigner(alicePrivateKey);
        const darkPool = appChain.runtime.resolve("DarkPool");
        const order = new Order({
          user: alice,
          amountIn: UInt64.from(100),
          amountOut: UInt64.from(50),
          tokenIn: tokenAId,
          tokenOut: tokenBId,
          minBlockHeight: UInt64.from(0),
          maxBlockHeight: UInt64.from(100),
        });

        // Drip to user & create pool
        await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity);
        await appChain.produceBlock();

        let tx = await appChain.transaction(
          alice,
          async () => {
            await darkPool.createPoolSigned(
              tokenAId,
              tokenBId,
              UInt64.from(1),
              UInt64.from(1)
            );
            // TODO: figure out why this is needed
            await darkPool.whitelistUser(alice, poolKey);
          },
          {
            nonce: 1,
          }
        );
        await tx.sign();
        await tx.send();
        await appChain.produceBlock();
        const { proof, stateRoot } = await generateProof(alice, order);

        // Act
        tx = await appChain.transaction(
          alice,
          async () => {
            await darkPool.setStateRoot(stateRoot);
            await darkPool.submitOrder(proof);
          },
          {
            nonce: 2,
          }
        );
        await tx.sign();
        await tx.send();
        const block = await appChain.produceBlock();

        // Assert
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        const submittedOrder =
          await appChain.query.runtime.DarkPool.buyOrderBook.get(
            UInt64.from(1)
          );
        expect(submittedOrder).toEqual(order);

        const userOrderCount =
          await appChain.query.runtime.DarkPool.userOrderCounter.get(alice);
        expect(userOrderCount).toEqual(UInt64.from(1));

        const firstOrderId =
          await appChain.query.runtime.DarkPool.firstBuyOrderId.get();
        expect(firstOrderId).toEqual(UInt64.from(1));

        const lastOrderId =
          await appChain.query.runtime.DarkPool.lastBuyOrderId.get();
        expect(lastOrderId).toEqual(UInt64.from(1));
      },
      DEFAULT_TIMEOUT
    );

    it(
      "should fail when user is not whitelisted",
      async () => {
        // Setup
        const appChain = await startAppChain();
        appChain.setSigner(alicePrivateKey);
        const darkPool = appChain.runtime.resolve("DarkPool");
        const order = new Order({
          user: alice,
          amountIn: UInt64.from(100),
          amountOut: UInt64.from(50),
          tokenIn: tokenAId,
          tokenOut: tokenBId,
          minBlockHeight: UInt64.from(0),
          maxBlockHeight: UInt64.from(100),
        });
        const { proof, stateRoot } = await generateProof(alice, order);

        // Act & Assert
        const tx = await appChain.transaction(alice, async () => {
          await darkPool.setStateRoot(stateRoot);
          await darkPool.submitOrder(proof);
        });
        await tx.sign();
        await tx.send();

        const block = await appChain.produceBlock();
        const transaction = block?.transactions[0];
        expect(transaction?.status.toBoolean()).toBe(false);
        expect(transaction?.statusMessage).toBe(
          "User is not whitelisted for this pool"
        );
      },
      DEFAULT_TIMEOUT
    );
  });

  describe("getOrder", () => {
    it(
      "should return the correct order",
      async () => {
        // Setup
        const order = new Order({
          user: alice,
          amountIn: UInt64.from(100),
          amountOut: UInt64.from(50),
          tokenIn: tokenAId,
          tokenOut: tokenBId,
          minBlockHeight: UInt64.from(0),
          maxBlockHeight: UInt64.from(100),
        });
        const appChain = await startAppChain();
        appChain.setSigner(alicePrivateKey);
        const darkPool = appChain.runtime.resolve("DarkPool");

        // Drip to user & create pool
        await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity);
        await appChain.produceBlock();

        let tx = await appChain.transaction(
          alice,
          async () => {
            await darkPool.createPoolSigned(
              tokenAId,
              tokenBId,
              UInt64.from(1),
              UInt64.from(1)
            );
            await darkPool.whitelistUser(alice, poolKey);
          },
          {
            nonce: 1,
          }
        );
        await tx.sign();
        await tx.send();
        await appChain.produceBlock();
        const { proof, stateRoot } = await generateProof(alice, order);

        tx = await appChain.transaction(
          alice,
          async () => {
            await darkPool.setStateRoot(stateRoot);
            await darkPool.submitOrder(proof);
          },
          {
            nonce: 2,
          }
        );
        await tx.sign();
        await tx.send();
        await appChain.produceBlock();

        // Act
        const retrievedOrder =
          await appChain.query.runtime.DarkPool.buyOrderBook.get(
            UInt64.from(1)
          );

        // Assert
        expect(retrievedOrder).toEqual(order);
      },
      DEFAULT_TIMEOUT
    );

    it(
      "should return undefined for non-existent order",
      async () => {
        // Act
        const appChain = await startAppChain();
        const retrievedOrder =
          await appChain.query.runtime.DarkPool.buyOrderBook.get(
            UInt64.from(999)
          );

        // Assert
        expect(retrievedOrder).toBeUndefined();
      },
      DEFAULT_TIMEOUT
    );
  });

  describe("whitelistUser", () => {
    it(
      "should whitelist a user for a pool",
      async () => {
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
      },
      DEFAULT_TIMEOUT
    );
  });

  describe("dewhitelistUser", () => {
    it(
      "should dewhitelist a user for a pool",
      async () => {
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
      },
      DEFAULT_TIMEOUT
    );
  });

  describe("removeOrder", () => {
    // TODO: failing test
    it(
      "should remove an existing order",
      async () => {
        // Setup
        const appChain = await startAppChain();
        appChain.setSigner(alicePrivateKey);
        const darkPool = appChain.runtime.resolve("DarkPool");
        const order = new Order({
          user: alice,
          amountIn: UInt64.from(100),
          amountOut: UInt64.from(50),
          tokenIn: tokenAId,
          tokenOut: tokenBId,
          minBlockHeight: UInt64.from(0),
          maxBlockHeight: UInt64.from(100),
        });

        // Drip to user & create pool
        await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity);
        await appChain.produceBlock();
        await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity);
        await appChain.produceBlock();

        let tx = await appChain.transaction(
          alice,
          async () => {
            await darkPool.createPoolSigned(
              tokenAId,
              tokenBId,
              UInt64.from(1),
              UInt64.from(1)
            );
            await darkPool.whitelistUser(alice, poolKey);
          },
          {
            nonce: 2,
          }
        );
        await tx.sign();
        await tx.send();
        await appChain.produceBlock();
        const { proof, stateRoot } = await generateProof(alice, order);

        tx = await appChain.transaction(
          alice,
          async () => {
            await darkPool.setStateRoot(stateRoot);
            await darkPool.submitOrder(proof);
          },
          {
            nonce: 3,
          }
        );
        await tx.sign();
        await tx.send();
        await appChain.produceBlock();

        // Act
        tx = await appChain.transaction(
          alice,
          async () => {
            await darkPool.removeOrder(UInt64.from(1));
          },
          {
            nonce: 4,
          }
        );
        await tx.sign();
        await tx.send();
        const block = await appChain.produceBlock();

        // Assert
        console.log(block?.transactions[0]);
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        const removedOrder =
          await appChain.query.runtime.DarkPool.buyOrderBook.get(
            UInt64.from(1)
          );
        expect(removedOrder).toEqual(Order.empty());

        const userOrderCount =
          await appChain.query.runtime.DarkPool.userOrderCounter.get(alice);
        expect(userOrderCount).toEqual(UInt64.from(0));
      },
      DEFAULT_TIMEOUT
    );

    it(
      "should fail when trying to remove a non-existent order",
      async () => {
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
      },
      DEFAULT_TIMEOUT
    );
  });

  describe("matchOrders", () => {
    it.only("should match two orders", async () => {
      // Setup
      const appChain = await startAppChain();
      appChain.setSigner(alicePrivateKey);
      const darkPool = appChain.runtime.resolve("DarkPool");

      // Drip to user & create pool
      await drip(appChain, alicePrivateKey, tokenAId, tokenAInitialLiquidity, {
        nonce: 0,
      });
      await appChain.produceBlock();
      await drip(appChain, alicePrivateKey, tokenBId, tokenBInitialLiquidity, {
        nonce: 1,
      });
      await appChain.produceBlock();

      // Create pool
      let tx = await appChain.transaction(
        alice,
        async () => {
          await darkPool.createPoolSigned(
            tokenAId,
            tokenBId,
            UInt64.from(1),
            UInt64.from(1)
          );
          await darkPool.whitelistUser(alice, poolKey);
        },
        {
          nonce: 2,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      const order1 = new Order({
        user: alice,
        amountIn: UInt64.from(100),
        amountOut: UInt64.from(50),
        tokenIn: tokenAId,
        tokenOut: tokenBId,
        minBlockHeight: UInt64.from(0),
        maxBlockHeight: UInt64.from(100),
      });
      const order2 = new Order({
        user: alice,
        amountIn: UInt64.from(50),
        amountOut: UInt64.from(100),
        tokenIn: tokenBId,
        tokenOut: tokenAId,
        minBlockHeight: UInt64.from(0),
        maxBlockHeight: UInt64.from(100),
      });
      const { proof: proof1, stateRoot: stateRoot1 } = await generateProof(
        alice,
        order1
      );
      tx = await appChain.transaction(
        alice,
        async () => {
          await darkPool.setStateRoot(stateRoot1);
          await darkPool.submitOrder(proof1);
        },
        {
          nonce: 3,
        }
      );
      await tx.sign();
      await tx.send();

      const { proof: proof2, stateRoot: stateRoot2 } = await generateProof(
        alice,
        order2
      );
      tx = await appChain.transaction(
        alice,
        async () => {
          await darkPool.setStateRoot(stateRoot2);
          await darkPool.submitOrder(proof2);
        },
        {
          nonce: 4,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Act
      tx = await appChain.transaction(
        alice,
        async () => {
          await darkPool.matchOrders();
        },
        {
          nonce: 5,
        }
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();

      // Assert
      const orderBook1 = await appChain.query.runtime.DarkPool.buyOrderBook.get(
        UInt64.from(1)
      );
      const orderBook2 = await appChain.query.runtime.DarkPool.buyOrderBook.get(
        UInt64.from(2)
      );
      expect(orderBook1).toEqual(
        new Order({
          user: alice,
          amountIn: UInt64.from(50),
          amountOut: UInt64.from(100),
          tokenIn: tokenBId,
          tokenOut: tokenAId,
          minBlockHeight: UInt64.from(0),
          maxBlockHeight: UInt64.from(100),
        })
      );
      // Second order should be filled
      expect(orderBook2).toBeUndefined();

      // Check balances
      const aliceBalanceA = await appChain.query.runtime.Balances.balances.get({
        tokenId: tokenAId,
        address: alice,
      });
      expect(aliceBalanceA).toEqual(
        tokenAInitialLiquidity.sub(UInt64.from(50))
      );
      const aliceBalanceB = await appChain.query.runtime.Balances.balances.get({
        tokenId: tokenBId,
        address: alice,
      });
      expect(aliceBalanceB).toEqual(
        tokenBInitialLiquidity.sub(UInt64.from(50))
      );
    });
  });
});
