import {
  AppChain,
  BlockStorageNetworkStateModule,
  InMemoryTransactionSender,
  StateServiceQueryModule,
} from "@proto-kit/sdk";
import { SimpleSequencerModules } from "@proto-kit/library";
import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  DatabasePruneModule,
  LocalTaskQueue,
  LocalTaskWorkerModule,
  ManualBlockTrigger,
  MinaBaseLayer,
  Sequencer, TimedBlockTrigger,
} from "@proto-kit/sequencer";
import { log } from "@proto-kit/common";
import { PrismaRedisDatabase } from "@proto-kit/persistance";

import runtime from "../../runtime";
import protocol from "../../protocol";
import {
  apiSequencerModules,
  apiSequencerModulesConfig,
  taskModules,
  taskModulesConfig,
} from "../../sequencer";

const appChain = AppChain.from({
  Runtime: Runtime.from({
    modules: runtime.modules,
  }),
  Protocol: Protocol.from({
    modules: protocol.modules,
  }),
  Sequencer: Sequencer.from({
    modules: SimpleSequencerModules.with({
      // Queue type
      TaskQueue: LocalTaskQueue,
      // BullQueue,

      // Database
      Database: PrismaRedisDatabase,

      // Settlement Layer
      BaseLayer: MinaBaseLayer,

      // Block Trigger type
      // BlockTrigger: ManualBlockTrigger,
      BlockTrigger: TimedBlockTrigger,

      DatabasePruneModule,

      LocalTaskWorkerModules: LocalTaskWorkerModule.from(taskModules),
      ...apiSequencerModules,
    }),
  }),
  modules: {
    TransactionSender: InMemoryTransactionSender,
    QueryTransportModule: StateServiceQueryModule,
    NetworkStateTransportModule: BlockStorageNetworkStateModule,
  },
});

appChain.configurePartial({
  Runtime: runtime.config,
  Protocol: protocol.config,
  Sequencer: {
    ...SimpleSequencerModules.defaultConfig(),
    ...apiSequencerModulesConfig,
    LocalTaskWorkerModules: taskModulesConfig,

    DatabasePruneModule: {
      pruneOnStartup: false,
    },
    TaskQueue: {},
    Database: {
      redis: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: process.env.REDIS_PORT ?? 6379,
        password: process.env.REDIS_PASSWORD ?? "password",
      },

      prisma: {
        connection: process.env.DATABASE_URL ?? {
          host: process.env.REDIS_PASSWORD ?? "localhost",
          port: 5432,
          username: "admin",
          password: "password",
          db: {
            name: "protokit",
          },
        },
      },
    },
    BaseLayer: {
      network: {
        local: true,
      },
    },
    BlockTrigger: {
      blockInterval: 5000,
      settlementInterval: 150000,
    },
  },
  QueryTransportModule: {},
  NetworkStateTransportModule: {},
  TransactionSender: {},
});

log.setLevel("INFO");

// TODO: remove temporary `as any` once `error TS2742` is resolved
export default appChain as any;
