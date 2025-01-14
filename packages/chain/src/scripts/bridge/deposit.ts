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

const settlementModule = appChain.sequencer.resolveOrFail(
  "SettlementModule",
  SettlementModule
);

const { settlement, dispatch } = settlementModule.getContracts();

const tokenId = Field(process.argv[2]);

const fromPrivateKey = PrivateKey.fromBase58(
  process.env[process.argv[3]] || process.argv[3]
);

const toPublicKey = PublicKey.fromBase58(
  process.env[process.argv[4]] || process.argv[4]!
);

const amount = Number(process.argv[5]) * 1e9;

const contractBalanceBefore = settlement.account.balance.get();

Provable.log("contractBalanceBefore", contractBalanceBefore);

Provable.log("debug", {
  fromPublicKey: fromPrivateKey.toPublicKey().toBase58(),
  toPublicKey,
  amount,
  tokenId,
});

const account = await fetchAccount({ publicKey: fromPrivateKey.toPublicKey() });
await fetchAccount({ publicKey: settlement.address });
await fetchAccount({ publicKey: dispatch.address });

console.log("existing noonce", {
  account: account.account?.publicKey.toBase58(),
  nonce: account.account?.nonce.toBigint(),
});

Provable.log("default", TokenId.default);

const tree = await TokenBridgeTree.buildTreeFromEvents(dispatch);
const index = tree.getIndex(tokenId);
// Provable.log("tree", tree);
Provable.log("index", { tokenId, index });
const witness = tree.getWitness(index);
const attestation = new TokenBridgeAttestation({
  index: Field(index),
  witness: tree.getWitness(index),
});

async function getLatestMempoolNonce(address: PublicKey) {
  interface PooledZkAppCommands {
    data: {
      pooledZkappCommands: {
        zkappCommand: {
          accountUpdates: {
            body: {
              publicKey: string;
              preconditions: {
                account: {
                  nonce: {
                    lower: string;
                    upper: string;
                  };
                };
              };
            };
          }[];
        };
      }[];
    };
  }
  const query = `
      query MyQuery {
        pooledZkappCommands {
          zkappCommand {
            accountUpdates {
              body {
                publicKey
                preconditions {
                  account {
                    nonce {
                      lower,
                      upper
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
  const response = await fetch("http://localhost:8083/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });

  const result = (await response.json()) as PooledZkAppCommands;

  let nonce = 0;
  result.data.pooledZkappCommands.forEach((zkappCommand) => {
    zkappCommand.zkappCommand.accountUpdates.forEach((au) => {
      if (au.body.publicKey === address.toBase58()) {
        const upperNonce = Number(
          au.body.preconditions.account.nonce.upper ?? 0
        );
        nonce = upperNonce > nonce ? upperNonce : nonce;
      }
    });
  });

  const account = await fetchAccount({ publicKey: address });
  const knownNonce = Number(account.account?.nonce.toString());
  const latestNonce = knownNonce > nonce ? knownNonce : nonce;
  Provable.log("Latest mempool nonce", {
    address,
    latestNonce,
  });

  return latestNonce;
}

console.log("forging transaction");
const tx = await Mina.transaction(
  {
    sender: fromPrivateKey.toPublicKey(),
    fee: 0.1 * 1e9,
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

    // const nonce = await getLatestMempoolNonce(dispatch.address);
    // extract the nonce from pending zk app commands and commit to it here for signed settlements
    // dispatch.self.body.preconditions.account.nonce.value = {
    //   lower: UInt32.from(nonce),
    //   upper: UInt32.from(nonce),
    // };
  }
);

// TODO: remove if NONE authorization isnt used (outside of lightnet)
tx.transaction.accountUpdates.forEach((au) => {
  console.log("au", au);
  if (
    [
      process.env.PROTOKIT_SETTLEMENT_CONTRACT_PUBLIC_KEY,
      process.env.PROTOKIT_DISPATCHER_CONTRACT_PUBLIC_KEY,
    ].includes(au.body.publicKey.toBase58())
  ) {
    Authorization.setLazyNone(au);
  }
});

// settlementModule.signTransaction(tx, [fromPrivateKey]);
tx.sign([fromPrivateKey]);

// console.log("proving");
// await tx.prove();

console.log("tx pretty", tx.toPretty());

console.log("sending");
const sentTx = await tx.send();
const includedTx = await sentTx.wait();

console.log("Deposit transaction included in a block:");
console.log(includedTx.toPretty());
