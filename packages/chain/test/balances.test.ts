import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey, UInt64 } from "o1js";
import { Balances } from "../src/balances";
import { log } from "@proto-kit/common";

log.setLevel("ERROR");

describe("balances", () => {
  it("should demonstrate how balances work", async () => {
    const appChain = TestingAppChain.fromRuntime({
      modules: {
        Balances,
      },
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

    appChain.setSigner(alicePrivateKey);

    const balances = appChain.runtime.resolve("Balances");

    const tx1 = await appChain.transaction(alice, () => {
      balances.addBalance(alice, UInt64.from(1000));
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();

    const balance = await appChain.query.runtime.Balances.balances.get(alice);

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(balance?.toBigInt()).toBe(1000n);
  }, 1_000_000);
});
