import runtime from "../../runtime";
import protocol from "../../protocol";
import {
  AppChain,
  BlockStorageNetworkStateModule,
  StateServiceQueryModule,
} from "@proto-kit/sdk";
import {
  SimpleSequencerModules,
  VanillaProtocolModules,
  VanillaRuntimeModules,
} from "@proto-kit/library";
import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  InMemoryDatabase,
  LocalTaskQueue,
  LocalTaskWorkerModule,
  ManualBlockTrigger,
  MinaBaseLayer,
  Sequencer,
  VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";
import { log } from "@proto-kit/common";

const appChain = AppChain.from({
  Runtime: Runtime.from({
    modules: VanillaRuntimeModules.with(runtime.modules),
  }),
  Protocol: Protocol.from({
    modules: VanillaProtocolModules.with(protocol.modules),
  }),
  Sequencer: Sequencer.from({
    modules: SimpleSequencerModules.with(
      // Queue type
      LocalTaskQueue,
      // BullQueue,

      // Database
      InMemoryDatabase,
      // PrismaRedisDatabase,

      // Settlement Layer
      MinaBaseLayer,

      // Block Trigger type
      ManualBlockTrigger,

      {
        LocalTaskWorkerModules: LocalTaskWorkerModule.from(
          VanillaTaskWorkerModules.allTasks(),
        ),
      },
    ),
  }),
  modules: {
    QueryTransportModule: StateServiceQueryModule,
    NetworkStateTransportModule: BlockStorageNetworkStateModule,
  },
});

appChain.configurePartial({
  Sequencer: {
    ...SimpleSequencerModules.defaultConfig(),
    TaskQueue: {},
    Database: {
      redis: {
        host: "localhost",
        port: 6379,
        password: "password",
      },
      prisma: {
        connection: {
          host: "localhost",
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
    LocalTaskWorkerModules: VanillaTaskWorkerModules.defaultConfig(),
    BlockTrigger: {
      blockInterval: 5000,
      settlementInterval: 150000,
    },
  },
});

appChain.configurePartial({
  Runtime: {
    ...VanillaRuntimeModules.defaultConfig(),
    ...runtime.config,
  },
  Protocol: {
    ...VanillaProtocolModules.defaultConfig(),
    ...protocol.config,
  },
});

log.setLevel("INFO");

// TODO: remove temporary `as any` once `error TS2742` is resolved
export default appChain as any;
