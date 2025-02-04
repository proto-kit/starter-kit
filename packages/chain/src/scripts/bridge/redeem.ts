// const { settlement, dispatch } = settlementModule.getContracts();

import {
  BridgingModule,
  InMemoryDatabase,
  LocalTaskQueue,
  Sequencer,
  SequencerModule,
  SettlementModule,
} from "@proto-kit/sequencer";
import {
  settlementSequencerModules,
  settlementSequencerModulesConfig,
} from "../../sequencer";
import { AppChain } from "@proto-kit/sdk";
import { Runtime } from "@proto-kit/module";
import runtime from "../../runtime";
import {
  Protocol,
  TokenBridgeAttestation,
  TokenBridgeTree,
} from "@proto-kit/protocol";
import * as protocol from "../../protocol";
import {
  AccountUpdate,
  fetchAccount,
  Field,
  Mina,
  PrivateKey,
  Provable,
  PublicKey,
  TokenId,
  UInt32,
  UInt64,
} from "o1js";
import { Authorization } from "../../../node_modules/o1js/dist/node/lib/mina/account-update";

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
        TaskQueue: LocalTaskQueue,
        ...settlementSequencerModules,
        SequencerStartupModule: Noop,
        OutgoingMessageQueue: Noop,
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
      TaskQueue: {},
      ...settlementSequencerModulesConfig,
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

  // TODO: remove if NONE authorization isnt used (outside of lightnet)
  tx.transaction.accountUpdates.forEach((au) => {
    if (
      [
        process.env.PROTOKIT_SETTLEMENT_CONTRACT_PUBLIC_KEY,
        process.env.PROTOKIT_DISPATCHER_CONTRACT_PUBLIC_KEY,
        process.env.PROTOKIT_MINA_BRIDGE_CONTRACT_PUBLIC_KEY,
      ].includes(au.body.publicKey.toBase58())
    ) {
      Authorization.setLazyNone(au);
    }
  });

  tx.sign([toPrivateKey]);

  console.log("Sending...");
  const sentTx = await tx.send();
  console.log("Waiting for inclusion...", sentTx.toPretty());
  const includedTx = await sentTx.wait();

  console.log("Redeem transaction included in a block:");
  console.log(includedTx.toPretty());
}
