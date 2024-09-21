import { Balance, BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey } from "o1js";
import "reflect-metadata";
import { Faucet } from "../../src/runtime/modules/faucet";
import {
  TokenIdId,
  TokenRegistry,
} from "../../src/runtime/modules/token-registry";
import { Balances } from "../../src/runtime/modules/balances";

describe("faucet", () => {
  const alicePrivateKey = PrivateKey.random();
  const alice = alicePrivateKey.toPublicKey();
  const tokenId = TokenId.from(0);
  const balanceToDrip = Balance.from(1000);

  it("should drip tokens", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Faucet,
      TokenRegistry,
      Balances,
    });
    appChain.configurePartial({
      Runtime: {
        Faucet: {},
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        TokenRegistry: {
          maxTokens: UInt64.from(100),
        },
      },
    });
    await appChain.start();
    appChain.setSigner(alicePrivateKey);

    const faucet = appChain.runtime.resolve("Faucet");
    const tx = await appChain.transaction(alice, async () => {
      await faucet.dripSigned(tokenId, balanceToDrip);
    });

    await tx.sign();
    await tx.send();

    await appChain.produceBlock();

    const key = new BalancesKey({
      tokenId,
      address: alice,
    });
    const balance = await appChain.query.runtime.Balances.balances.get(key);
    expect(balance?.toString()).toBe(balanceToDrip.toString());
  });

  it("should create and fetch 3 tokens with different token IDs", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
      TokenRegistry,
      Faucet,
    });
    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        TokenRegistry: {
          maxTokens: UInt64.from(100),
        },
        Faucet: {},
      },
    });
    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    const tokenId1 = TokenId.from(0);
    const tokenId2 = TokenId.from(1);
    const tokenId3 = TokenId.from(2);

    appChain.setSigner(alicePrivateKey);

    const faucet = appChain.runtime.resolve("Faucet");

    const tx = await appChain.transaction(alice, async () => {
      await faucet.dripSigned(tokenId1, Balance.from(1000));
      await faucet.dripSigned(tokenId2, Balance.from(2000));
      await faucet.dripSigned(tokenId3, Balance.from(3000));
    });
    await tx.sign();
    await tx.send();
    const block = await appChain.produceBlock();

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    // expect(
    //   await appChain.query.runtime.Balances.balances.get(
    //     BalancesKey.from(tokenId1, alice)
    //   )
    // ).toBe(Balance.from(1000));
    // expect(
    //   await appChain.query.runtime.Balances.balances.get(
    //     BalancesKey.from(tokenId2, alice)
    //   )
    // ).toBe(Balance.from(2000));
    // expect(
    //   await appChain.query.runtime.Balances.balances.get(
    //     BalancesKey.from(tokenId3, alice)
    //   )
    // ).toBe(Balance.from(3000));

    // Check tokenIds
    expect(
      await appChain.query.runtime.TokenRegistry.tokenIdIdToTokenId.get(
        TokenIdId.from(0)
      )
    ).toBe(tokenId1);
    expect(
      await appChain.query.runtime.TokenRegistry.tokenIdIdToTokenId.get(
        TokenIdId.from(1)
      )
    ).toBe(tokenId2);
    expect(
      await appChain.query.runtime.TokenRegistry.tokenIdIdToTokenId.get(
        TokenIdId.from(2)
      )
    ).toBe(tokenId3);
  });
});
