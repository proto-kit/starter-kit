import { ClientAppChain, InMemorySigner } from "@proto-kit/sdk";
import runtime from "../../runtime";
import { Field, PrivateKey, Provable } from "o1js";
import { UInt64 } from "@proto-kit/library";

const appChain = ClientAppChain.fromRuntime(runtime.modules, InMemorySigner);

appChain.configurePartial({
  Runtime: runtime.config,
  GraphqlClient: {
    url: process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL,
  },
});

await appChain.start();

const senderPrivateKey = PrivateKey.fromBase58(
  process.env[process.argv[3]] || process.argv[3]
);
const senderPublicKey = senderPrivateKey.toPublicKey();
const signer = appChain.resolve("Signer");
signer.config.signer = senderPrivateKey;

Provable.log("debug", {
  senderPrivateKey,
  senderPublicKey,
  amount: process.argv[4],
  tokenId: process.argv[2],
});

const withdrawals = appChain.runtime.resolve("Withdrawals");
const tx = await appChain.transaction(senderPublicKey, async () => {
  await withdrawals.withdraw(
    senderPublicKey,
    UInt64.from(Number(process.argv[4]) * 1e9),
    Field(process.argv[2]!)
  );
});

await tx.sign();
await tx.send();

console.log("withdrawal tx sent");
