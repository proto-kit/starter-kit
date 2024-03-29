import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey } from "o1js";
import { Balances } from "../src/balances";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";

log.setLevel("ERROR");

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

    const tx1 = await appChain.transaction(alice, () => {
      balances.addBalance(tokenId, alice, UInt64.from(1000));
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();

    const key = new BalancesKey({ tokenId, address: alice });
    const balance = await appChain.query.runtime.Balances.balances.get(key);

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(balance?.toBigInt()).toBe(1000n);
  }, 1_000_000);
});
