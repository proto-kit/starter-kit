import { ClientAppChain, InMemorySigner } from "@proto-kit/sdk";
import runtime from "../../../runtime";
import { Field, PrivateKey, Provable } from "o1js";
import { UInt64 } from "@proto-kit/library";
import protocol from "../../../protocol";
import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";

export default async function () {
  const tokenId = Field(process.argv[3]!);
  const amount = UInt64.from(Number(process.argv[5]) * 1e9);
  const appChain = ClientAppChain.fromRemoteEndpoint(
    Runtime.from(runtime.modules),
    Protocol.from({ ...protocol.modules, ...protocol.settlementModules }),
    InMemorySigner
  );

  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...protocol.settlementModulesConfig,
    },
    GraphqlClient: {
      url: process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL,
    },
  });

  await appChain.start();

  const senderPrivateKey = PrivateKey.fromBase58(
    process.env[process.argv[4]] || process.argv[4]
  );
  const senderPublicKey = senderPrivateKey.toPublicKey();
  const signer = appChain.resolve("Signer");
  signer.config.signer = senderPrivateKey;

  Provable.log("debug", {
    senderPrivateKey,
    senderPublicKey,
    amount,
    tokenId,
  });

  const withdrawals = appChain.runtime.resolve("Withdrawals");
  const tx = await appChain.transaction(senderPublicKey, async () => {
    await withdrawals.withdraw(senderPublicKey, amount, tokenId);
  });

  await tx.sign();
  await tx.send();

  console.log("withdrawal tx sent");

  await appChain.close();
}
