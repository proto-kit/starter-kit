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
import { Protocol } from "@proto-kit/protocol";
import * as protocol from "../../protocol";
import {
  AccountUpdate,
  fetchAccount,
  Mina,
  PrivateKey,
  Provable,
  PublicKey,
  UInt64,
} from "o1js";

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

const settlementModule = appChain.sequencer.resolveOrFail(
  "SettlementModule",
  SettlementModule
);

const { settlement, dispatch } = settlementModule.getContracts();

const fromPrivateKey = PrivateKey.fromBase58(
  process.env[process.argv[2]] || process.argv[2]
);

const amount = process.argv[2] ?? 100 * 1e9;

const contractBalanceBefore = settlement.account.balance.get();

Provable.log("contractBalanceBefore", contractBalanceBefore);

Provable.log("debug", {
  fromPrivateKey: fromPrivateKey.toPublicKey().toBase58(),
});

const account = await fetchAccount({ publicKey: fromPrivateKey.toPublicKey() });
await fetchAccount({ publicKey: settlement.address });
await fetchAccount({ publicKey: dispatch.address });

console.log("existing noonce", {
  account: account.account?.publicKey.toBase58(),
  nonce: account.account?.nonce.toBigint(),
});

const tx = await Mina.transaction(
  {
    sender: fromPrivateKey.toPublicKey(),
    fee: 0.01 * 1e9,
  },
  async () => {
    const au = AccountUpdate.createSigned(fromPrivateKey.toPublicKey());
    au.balance.subInPlace(UInt64.from(amount));
    // await dispatch.deposit(UInt64.from(amount));
  }
);

settlementModule.signTransaction(tx, [fromPrivateKey]);

await tx.prove();

const sentTx = await tx.send();
const includedTx = await sentTx.wait();

console.log("Deposit transaction included in a block:");
console.log(includedTx.toPretty());
