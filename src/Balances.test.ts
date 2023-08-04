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

    const bobPrivateKey = PrivateKey.random();
    const bob = bobPrivateKey.toPublicKey();

    const tx2 = appChain.transaction(alice, () => {
      balances.transfer(alice, bob, UInt64.from(100));
    });

    await tx2.sign();
    await tx2.send();

    const block2 = await appChain.produceBlock();

    expect(block2?.txs[0].status, block2?.txs[0].statusMessage).toBe(true);

    const aliceBalance2 = await appChain.query.Balances.balances.get(alice);
    const bobBalance1 = await appChain.query.Balances.balances.get(bob);

    expect(aliceBalance2?.toBigInt()).toBe(900n);
    expect(bobBalance1?.toBigInt()).toBe(100n);
  });
});
