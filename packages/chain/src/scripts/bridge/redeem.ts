import {
  BridgingModule,
  InMemoryDatabase,
  MinaTransactionSender,
  Sequencer,
  SequencerModule,
  SettlementModule,
} from "@proto-kit/sequencer";
import {
  scriptsSettlementSequencerModules,
  scriptsSettlementSequencerModulesConfig,
} from "../../sequencer";
import { AppChain } from "@proto-kit/sdk";
import { Runtime } from "@proto-kit/module";
import runtime from "../../runtime";
import {
  Protocol,
} from "@proto-kit/protocol";
import * as protocol from "../../protocol";
import {
  AccountUpdate,
  fetchAccount,
  Field,
  Mina,
  PrivateKey,
  Provable,
  UInt64,
} from "o1js";

export default async function () {
  const tokenId = Field(process.argv[3]);
  const toPrivateKey = PrivateKey.fromBase58(
    process.env[process.argv[4]] || process.argv[4]
  );
  const amount = Number(process.argv[5]) * 1e9;
  const fee = 0.1 * 1e9;

  Provable.log("Preparing to redeem", {
    tokenId,
    to: toPrivateKey.toPublicKey(),
    amount,
    fee,
  });

  class Noop extends SequencerModule {
    public async start() {}
  }

  const appChain = AppChain.from({
    Runtime: Runtime.from({
      modules: runtime.modules,
    }),
    Protocol: Protocol.from({
      modules: {
        ...protocol.modules,
        ...protocol.settlementModules,
      },
    }),
    Sequencer: Sequencer.from({
      modules: {
        Database: InMemoryDatabase,
        ...scriptsSettlementSequencerModules,
      },
    }),
    modules: {},
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

  await appChain.start();

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
      const au = AccountUpdate.createSigned(toPrivateKey.toPublicKey());
      au.balance.addInPlace(UInt64.from(amount));

      await bridgeContract.redeem(au);
    }
  );

  const settlementModule = appChain.sequencer.resolveOrFail(
    "SettlementModule",
    SettlementModule
  );

  settlementModule.signTransaction(
    tx,
    [toPrivateKey],
  );

  console.log("Sending...");

  const { hash } = await appChain.sequencer
    .resolveOrFail("TransactionSender", MinaTransactionSender)
    .proveAndSendTransaction(tx, "included");

  console.log(`Redeem transaction included in a block: ${hash}`);
  console.log(tx.toPretty());
}
