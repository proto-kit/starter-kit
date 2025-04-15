import "reflect-metadata";
import client from "@repo/client/src/in-memory";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Field, PrivateKey, Provable, PublicKey } from "o1js";
import { Balances } from "@repo/runtime/src/modules/balances";
import { TokenId, Balance } from "@proto-kit/library";
import { InclusionStatus } from "@proto-kit/api";
import waitForStatus from "@repo/utils/src/wait-for-status";

const argv = await yargs(hideBin(process.argv))
  .option("sender-private-key", {
    type: "string",
    describe: "Sender private key",
    demandOption: true,
  })
  .option("tokenId", {
    type: "string",
    describe: "Token ID to mint",
    demandOption: true,
  })
  .option("address", {
    type: "string",
    describe: "Address to mint to",
    demandOption: true,
  })
  .option("amount", {
    type: "string",
    describe: "Amount to mint",
    demandOption: true,
  })
  .parse();

await client.start();

const signer = PrivateKey.fromBase58(argv["sender-private-key"]!);
client.resolve("Signer").config.signer = signer;

const balances = client.runtime.resolve("Balances") as Balances;

const tx = await client.transaction(signer.toPublicKey(), async () => {
  await balances.mint(
    TokenId.fromValue(argv["tokenId"]!),
    PublicKey.fromBase58(argv["address"]!),
    Balance.Safe.fromField(Field(argv["amount"]!))
  );
});

await tx.sign();
await tx.send();

Provable.log("Transaction sent:", tx.transaction?.hash().toString());

await waitForStatus(
  tx.transaction!.hash().toString(),
  InclusionStatus.INCLUDED
);
