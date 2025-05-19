// const { settlement, dispatch } = settlementModule.getContracts();

import {
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
  const fromPrivateKey = PrivateKey.fromBase58(
    process.env[process.argv[4]] || process.argv[4]
  );
  const toPublicKey = PublicKey.fromBase58(
    process.env[process.argv[5]] || process.argv[5]!
  );
  const amount = Number(process.argv[6]) * 1e9;
  const fee = 0.1 * 1e9;

  Provable.log("Preparing to deposit", {
    tokenId,
    fromPrivateKey,
    toPublicKey,
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

  const settlementModule = appChain.sequencer.resolveOrFail(
    "SettlementModule",
    SettlementModule
  );

  const { settlement, dispatch } = settlementModule.getContracts();

  await fetchAccount({ publicKey: fromPrivateKey.toPublicKey() });
  await fetchAccount({ publicKey: settlement.address });
  await fetchAccount({ publicKey: dispatch.address });

  const tree = await TokenBridgeTree.buildTreeFromEvents(dispatch);
  const index = tree.getIndex(tokenId);
  const witness = tree.getWitness(index);
  const attestation = new TokenBridgeAttestation({
    index: Field(index),
    witness,
  });

  console.log("Forging transaction...");
  const tx = await Mina.transaction(
    {
      sender: fromPrivateKey.toPublicKey(),
      fee,
    },
    async () => {
      const au = AccountUpdate.createSigned(fromPrivateKey.toPublicKey());
      au.balance.subInPlace(UInt64.from(amount));

      await dispatch.deposit(
        UInt64.from(amount),
        tokenId,
        PublicKey.fromBase58(
          process.env.PROTOKIT_MINA_BRIDGE_CONTRACT_PUBLIC_KEY!
        ),
        attestation,
        toPublicKey
      );
    }
  );

  // TODO: remove if SIGNATURE authorization isnt used (outside of lightnet)
  tx.transaction.accountUpdates.forEach((au) => {
    if (
      [
        process.env.PROTOKIT_SETTLEMENT_CONTRACT_PUBLIC_KEY,
        process.env.PROTOKIT_DISPATCHER_CONTRACT_PUBLIC_KEY,
      ].includes(au.body.publicKey.toBase58())
    ) {
      Authorization.setLazySignature(au);
    }
  });

  tx.sign([fromPrivateKey, settlementModule.config.keys.dispatch]);

  console.log("Sending...");
  Provable.log("AUs", tx.toPretty());
  const sentTx = await tx.send();
  console.log("Waiting for inclusion...");
  const includedTx = await sentTx.wait();

  console.log("Deposit transaction included in a block:");
  console.log(includedTx.toPretty());
}
