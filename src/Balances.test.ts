import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey, UInt64 } from "snarkyjs";
import { Balances } from "./Balances";
import { log } from "@proto-kit/common";

log.disableAll();

describe("Balances", () => {
  it("should demonstrate how balances work", async () => {
    const totalSupply = UInt64.from(10_000);

    const appChain = TestingAppChain.fromRuntime({
      modules: {
        Balances,
      },
      config: {
        Balances: {
          totalSupply,
        },
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const balances = appChain.runtime.resolve("Balances");

    const tx1 = appChain.transaction(alice, () => {
      balances.setBalance(alice, UInt64.from(1000));
    });

    await tx1.sign();
    await tx1.send();

    const block1 = await appChain.produceBlock();

    const aliceBalance = await appChain.query.runtime.Balances.balances.get(
      alice
    );

    expect(block1?.txs[0].status, block1?.txs[0].statusMessage).toBe(true);
    expect(aliceBalance?.toBigInt()).toBe(1000n);
  });
});
