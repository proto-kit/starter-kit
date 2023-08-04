import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey, UInt64 } from "snarkyjs";
import { Balances } from "./Balances";

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

    const aliceBalance1 = await appChain.query.Balances.balances.get(alice);

    expect(block1?.txs[0].status, block1?.txs[0].statusMessage).toBe(true);
    expect(aliceBalance1?.toBigInt()).toBe(1000n);
  });
});
