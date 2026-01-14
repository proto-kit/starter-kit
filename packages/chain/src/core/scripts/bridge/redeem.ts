import {
  BridgingModule,
  InMemoryDatabase,
  MinaTransactionSender,
  Sequencer,
  SequencerModule,
  SettlementModule,
  AppChain,
} from "@proto-kit/sequencer";
import {
  scriptsSettlementSequencerModules,
  scriptsSettlementSequencerModulesConfig,
} from "../../sequencer";
import { Runtime } from "@proto-kit/module";
import runtime from "../../../runtime";
import { Protocol } from "@proto-kit/protocol";
import * as protocol from "../../../protocol";
import {
  AccountUpdate,
  fetchAccount,
  Field,
  Mina,
  PrivateKey,
  Provable,
  UInt64,
} from "o1js";
import { FungibleToken } from "mina-fungible-token";

export default async function () {
  const tokenId = Field(process.argv[3]);
  const toPrivateKey = PrivateKey.fromBase58(
    process.env[process.argv[4]] || process.argv[4]
  );
  const amount = Number(process.argv[5]) * 1e9;
  const fee = 0.1 * 1e9;

  const isCustomToken = tokenId.toBigInt() !== 1n;
  const tokenOwnerPrivateKey = isCustomToken
    ? PrivateKey.fromBase58(process.env["PROTOKIT_CUSTOM_TOKEN_PRIVATE_KEY"]!)
    : PrivateKey.random();

  Provable.log("Preparing to redeem", {
    tokenId,
    to: toPrivateKey.toPublicKey(),
    amount,
    fee,
  });

  const appChain = AppChain.from({
    Runtime: Runtime.from(runtime.modules),
    Protocol: Protocol.from({
      ...protocol.modules,
      ...protocol.settlementModules,
    }),
    Sequencer: Sequencer.from({
      Database: InMemoryDatabase,
      ...scriptsSettlementSequencerModules,
    }),
  });

  appChain.configure({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...protocol.settlementModulesConfig,
    },
    Sequencer: {
      Database: {},
      ...scriptsSettlementSequencerModulesConfig,
    },
  });

  const proofsEnabled = process.env.PROTOKIT_PROOFS_ENABLED === "true";
  await appChain.start(proofsEnabled);

  const bridgingModule = appChain.sequencer.resolveOrFail(
    "BridgingModule",
    BridgingModule
  );

  const bridgeContract = await bridgingModule.getBridgeContract(tokenId);

  const customAcc = await fetchAccount({
    publicKey: toPrivateKey.toPublicKey(),
    tokenId: bridgeContract.deriveTokenId(),
  });

  Provable.log("Custom account", customAcc.account?.balance);

  console.log("Forging transaction...");
  const tx = await Mina.transaction(
    {
      sender: toPrivateKey.toPublicKey(),
      fee,
    },
    async () => {
      const au = AccountUpdate.createSigned(
        toPrivateKey.toPublicKey(),
        tokenId
      );
      au.balance.addInPlace(UInt64.from(amount));

      await bridgeContract.redeem(au);

      if (isCustomToken) {
        await new FungibleToken(
          tokenOwnerPrivateKey.toPublicKey()
        )!.approveAccountUpdate(bridgeContract.self);
      }
    }
  );

  const settlementModule = appChain.sequencer.resolveOrFail(
    "SettlementModule",
    SettlementModule
  );

  settlementModule.signTransaction(tx, [toPrivateKey], [tokenOwnerPrivateKey]);

  console.log("Sending...");

  const { hash } = await appChain.sequencer
    .resolveOrFail("TransactionSender", MinaTransactionSender)
    .proveAndSendTransaction(tx, "included");

  console.log(`Redeem transaction included in a block: ${hash}`);
  console.log(tx.toPretty());

  await appChain.close();
}
