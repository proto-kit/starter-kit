import {
  AppChain,
  BlockStorageNetworkStateModule,
  InMemoryTransactionSender,
  StateServiceQueryModule
} from "@proto-kit/sdk";
import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  DatabasePruneModule,
  InMemoryDatabase,
  LocalTaskQueue, LocalTaskWorkerModule,
  ManualBlockTrigger,
  NoopBaseLayer,
  Sequencer,
} from "@proto-kit/sequencer";
import { SimpleSequencerModules } from "@proto-kit/library";

import runtime from "../../runtime";
import protocol from "../../protocol";
import {
  apiSequencerModules,
  apiSequencerModulesConfig,
  taskModules,
  taskModulesConfig
} from "../../sequencer";

const appChain = AppChain.from({
  Runtime: Runtime.from({
    modules: runtime.modules,
  }),
  Protocol: Protocol.from({
    modules: protocol.modules,
  }),
  Sequencer: Sequencer.from({
    modules: SimpleSequencerModules.with(
        {
          // Queue type
          TaskQueue: LocalTaskQueue,
          // Database
          Database: InMemoryDatabase,

          BaseLayer: NoopBaseLayer,
          BlockTrigger: ManualBlockTrigger,
          DatabasePruneModule,
          LocalTaskWorkerModules: LocalTaskWorkerModule.from(
              taskModules,
          ),
          ...apiSequencerModules
        },
    ),
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

    TaskQueue: {},
    Database: {},
    BaseLayer: {},
    BlockTrigger: {}
  },
  NetworkStateTransportModule: {},
  QueryTransportModule: {},
  TransactionSender: {}
});

// TODO: remove temporary `as any` once `error TS2742` is resolved
export default appChain as any;
