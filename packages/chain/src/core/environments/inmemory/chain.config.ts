import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  Sequencer,
  AppChain,
  InMemoryDatabase,
  PrivateMempool,
  TimedBlockTrigger,
  WorkerModule,
  VanillaTaskWorkerModules,
  LocalTaskQueue,
  LocalSequencerCoreModule,
} from "@proto-kit/sequencer";
import { VanillaGraphqlModules, GraphqlSequencerModule } from "@proto-kit/api";
import {
  BlockStorageNetworkStateModule,
  InMemoryTransactionSender,
  StateServiceQueryModule,
} from "@proto-kit/sdk";
import { Startable } from "@proto-kit/common";

import protocol from "../../../protocol";
import runtime from "../../../runtime";

const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from(protocol.modules),
  Sequencer: Sequencer.from({
    WorkerModule: WorkerModule.from(
      VanillaTaskWorkerModules.withoutSettlement()
    ),
    TaskQueue: LocalTaskQueue,
    Database: InMemoryDatabase,
    Graphql: GraphqlSequencerModule.from(VanillaGraphqlModules.with({})),
    Mempool: PrivateMempool,
    BlockTrigger: TimedBlockTrigger,
    LocalSequencerCoreModule,
  }),
  TransactionSender: InMemoryTransactionSender,
  QueryTransportModule: StateServiceQueryModule,
  NetworkStateTransportModule: BlockStorageNetworkStateModule,
});

export default async (): Promise<Startable> => {
  appChain.configure({
    Runtime: runtime.config,
    Protocol: protocol.config,
    Sequencer: {
      Graphql: {
        ...VanillaGraphqlModules.defaultConfig(),
        containerConfig: {
          port: Number(process.env.PROTOKIT_GRAPHQL_PORT),
          host: process.env.PROTOKIT_GRAPHQL_HOST ?? "localhost",
          graphiql: true,
        },
      },
      Mempool: {},
      LocalSequencerCoreModule: {
        SequencerStartupModule: {},
        BlockProducerModule: {},
      },
      BlockTrigger: {
        blockInterval: 5000,
        produceEmptyBlocks: true,
        settlementTokenConfig: {},
      },
      WorkerModule: VanillaTaskWorkerModules.defaultConfig(),
      Database: {},
      TaskQueue: {},
    },
    QueryTransportModule: {},
    NetworkStateTransportModule: {},
    TransactionSender: {},
  });

  return appChain;
};
