import "reflect-metadata";
import { InclusionStatus } from "@proto-kit/api";
import client from "@repo/client/src/in-memory";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { PrivateKey, Provable } from "o1js";
import { Balances } from "@repo/runtime/src/modules/balances";
import waitForStatus from "@repo/utils/src/wait-for-status";

const argv = await yargs(hideBin(process.argv))
  .option("admin-private-key", {
    type: "string",
    describe: "The admin to set",
    demandOption: true,
  })
  .parse();

await client.start();

const signer = PrivateKey.fromBase58(argv["admin-private-key"]!);
client.resolve("Signer").config.signer = signer;

const balances = client.runtime.resolve("Balances") as Balances;

const tx = await client.transaction(signer.toPublicKey(), async () => {
  await balances.setAdmin(signer.toPublicKey());
});

await tx.sign();
await tx.send();

Provable.log("Transaction sent:", tx.transaction?.hash().toString());

await waitForStatus(
  tx.transaction!.hash().toString(),
  InclusionStatus.INCLUDED
);
