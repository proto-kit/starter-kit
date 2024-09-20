import { Balance, Balances, BalancesKey, TokenId } from "@proto-kit/library";
import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey, UInt64 } from "o1js";
import { Faucet } from "../../src/runtime/modules/faucet";
import "reflect-metadata";

describe("faucet", () => {
  const alicePrivateKey = PrivateKey.random();
  const alice = alicePrivateKey.toPublicKey();
  const tokenId = TokenId.from(0);
  const balanceToDrip = Balance.from(1000);

  const appChain = TestingAppChain.fromRuntime({
    Faucet,
    Balances,
  });
  let faucet: Faucet;

  beforeAll(async () => {
    appChain.configurePartial({
      Runtime: {
        Faucet: {},
        Balances: {
          totalSupply: UInt64.from(10000),
        },
      },
    });
    await appChain.start();
    appChain.setSigner(alicePrivateKey);

    faucet = appChain.runtime.resolve("Faucet");
  });

  it("should drip tokens", async () => {
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
});
