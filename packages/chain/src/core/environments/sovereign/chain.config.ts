import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  AppChain,
  Sequencer,
  PrivateMempool,
  TimedBlockTrigger,
  SequencerCoreModule,
} from "@proto-kit/sequencer";
import { VanillaGraphqlModules, GraphqlSequencerModule } from "@proto-kit/api";
import { IndexerNotifier } from "@proto-kit/indexer";
import { PrismaRedisDatabase } from "@proto-kit/persistance";
import { BullQueue } from "@proto-kit/deployment";
import {
  BlockStorageNetworkStateModule,
  InMemoryTransactionSender,
  StateServiceQueryModule,
} from "@proto-kit/sdk";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";

import { Arguments } from "../../../start";
import { Startable } from "@proto-kit/common";
// import {
//   buildCustomTokenConfig,
//   buildSettlementTokenConfig,
// } from "@proto-kit/stack";
import {
  baseSettlementSequencerModules,
  baseSettlementSequencerModulesConfig,
  metricsSequencerModules,
  metricsSequencerModulesConfig,
} from "../../sequencer";

const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from({
    ...protocol.modules,
    ...protocol.settlementModules,
  }),
  Sequencer: Sequencer.from({
    // ordering of the modules matters due to dependency resolution
    ...metricsSequencerModules,
    Database: PrismaRedisDatabase,
    TaskQueue: BullQueue,
    Graphql: GraphqlSequencerModule.from(VanillaGraphqlModules.with({})),
    Mempool: PrivateMempool,
    BlockTrigger: TimedBlockTrigger,
    SequencerCoreModule,
    ...baseSettlementSequencerModules,
    IndexerNotifier,
  }),
  TransactionSender: InMemoryTransactionSender,
  QueryTransportModule: StateServiceQueryModule,
  NetworkStateTransportModule: BlockStorageNetworkStateModule,
});

export default async (args: Arguments): Promise<Startable> => {
  appChain.configure({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...protocol.settlementModulesConfig,
    },
    Sequencer: {
      ...metricsSequencerModulesConfig,
      Graphql: {
        ...VanillaGraphqlModules.defaultConfig(),
        containerConfig: {
          port: Number(process.env.PROTOKIT_GRAPHQL_PORT ?? 8080),
          host: process.env.PROTOKIT_GRAPHQL_HOST ?? "0.0.0.0",
          graphiql: true,
        },
      },
      Mempool: {},
      SequencerCoreModule: {
        BatchProducerModule: {},
        SequencerStartupModule: {},
        BlockProducerModule: {},
      },
      BlockTrigger: {
        blockInterval: 10000,
        produceEmptyBlocks: true,

        settlementInterval: 60000,
        settlementTokenConfig: {},
        // settlementTokenConfig: buildSettlementTokenConfig(
        //   process.env.PROTOKIT_MINA_BRIDGE_CONTRACT_PRIVATE_KEY!,
        //   buildCustomTokenConfig(
        //     process.env.PROTOKIT_CUSTOM_TOKEN_PRIVATE_KEY,
        //     process.env.PROTOKIT_CUSTOM_TOKEN_BRIDGE_PRIVATE_KEY
        //   )
        // ),
      },
      ...baseSettlementSequencerModulesConfig,
      IndexerNotifier: {},
      TaskQueue: {
        redis: {
          host: process.env.REDIS_HOST ?? "redis",
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD ?? "password",
          db: 1,
        },
      },
      Database: {
        redis: {
          host: process.env.REDIS_HOST ?? "redis",
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD ?? "password",
        },
        prisma: {
          connection: process.env.DATABASE_URL!,
        },
      },
    },
    QueryTransportModule: {},
    NetworkStateTransportModule: {},
    TransactionSender: {},
  });

  return appChain;
};
