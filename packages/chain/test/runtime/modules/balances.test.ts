import { Balance, BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey } from "o1js";
import "reflect-metadata";
import { Balances } from "../../../src/runtime/modules/balances";
import { TokenRegistry } from "../../../src/runtime/modules/tokens";

describe("balances", () => {
  it("should demonstrate how balances work", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
    });

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    const tokenId = TokenId.from(0);

    appChain.setSigner(alicePrivateKey);

    const balances = appChain.runtime.resolve("Balances");

    const tx1 = await appChain.transaction(alice, async () => {
      await balances.addBalance(tokenId, alice, UInt64.from(1000));
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();

    const key = new BalancesKey({ tokenId, address: alice });
    const balance = await appChain.query.runtime.Balances.balances.get(key);

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(balance?.toBigInt()).toBe(1000n);
  });

  it("should create and fetch 3 tokens with different token IDs", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
      TokenRegistry,
    });

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        TokenRegistry: {
          maxTokens: UInt64.from(100),
        },
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    const tokenId1 = TokenId.from(0);
    const tokenId2 = TokenId.from(1);
    const tokenId3 = TokenId.from(2);

    appChain.setSigner(alicePrivateKey);

    const balances = appChain.runtime.resolve("Balances");

    const tx1 = await appChain.transaction(alice, async () => {
      await balances.addBalance(tokenId1, alice, UInt64.from(1000));
      await balances.addBalance(tokenId2, alice, UInt64.from(2000));
      await balances.addBalance(tokenId3, alice, UInt64.from(3000));
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(
      await appChain.query.runtime.Balances.balances.get(
        new BalancesKey({ tokenId: tokenId1, address: alice })
      )
    ).toBe(Balance.from(1000));
    expect(
      await appChain.query.runtime.Balances.balances.get(
        new BalancesKey({ tokenId: tokenId2, address: alice })
      )
    ).toBe(Balance.from(2000));
    expect(
      await appChain.query.runtime.Balances.balances.get(
        new BalancesKey({ tokenId: tokenId3, address: alice })
      )
    ).toBe(Balance.from(3000));

    // Check tokenIds
    expect(
      await appChain.query.runtime.TokenRegistry.tokenIdToTokenIdId.get(
        tokenId1
      )
    ).toBe(UInt64.from(0));
    expect(
      await appChain.query.runtime.TokenRegistry.tokenIdToTokenIdId.get(
        tokenId2
      )
    ).toBe(UInt64.from(1));
    expect(
      await appChain.query.runtime.TokenRegistry.tokenIdToTokenIdId.get(
        tokenId3
      )
    ).toBe(UInt64.from(2));
  });
});
