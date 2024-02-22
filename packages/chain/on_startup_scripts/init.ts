import { PrivateKey, UInt64 } from "o1js";

import { client } from "../src";

// Exmaple of a script that interacts with the chain on startup

const init = async () => {
  const alicePrivateKey = PrivateKey.random();
  const alice = alicePrivateKey.toPublicKey();

  await client.start();

  const balances = client.runtime.resolve("Balances");

  const tx = await client.transaction(alice, () => {
    balances.addBalance(alice, UInt64.from(100));
  });

  tx.transaction!.nonce = UInt64.from(0);

  tx.transaction = tx.transaction?.sign(alicePrivateKey);

  await tx.send();
};

await init();
