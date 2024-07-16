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
  DatabasePruneModule,
  InMemoryDatabase,
  LocalTaskQueue,
  LocalTaskWorkerModule,
  ManualBlockTrigger,
  MinaBaseLayer,
  Sequencer,
  TimedBlockTrigger,
  VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";

const appChain = AppChain.from({
  Runtime: Runtime.from({
    modules: VanillaRuntimeModules.with(runtime.modules),
  }),
  Protocol: Protocol.from({
    modules: VanillaProtocolModules.with(protocol.modules),
  }),
  Sequencer: Sequencer.from({
    // TODO DistributedSequencerModules
    modules: SimpleSequencerModules.with(
      {
        TaskQueue: LocalTaskQueue,
        Database: InMemoryDatabase,
        BaseLayer: MinaBaseLayer,
        BlockTrigger: ManualBlockTrigger,
        DatabasePruneModule,
        LocalTaskWorkerModules: LocalTaskWorkerModule.from(
          VanillaTaskWorkerModules.withoutSettlement(),
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
  Runtime: runtime.config,
  Protocol: protocol.config,
  Sequencer: {
    ...SimpleSequencerModules.defaultConfig(),
    TaskQueue: {},
    Database: {},
    BaseLayer: {
      network: {
        local: true,
      },
    },
    LocalTaskWorkerModules: {
      BlockBuildingTask: {},
      BlockProvingTask: {},
      BlockReductionTask: {},
      StateTransitionReductionTask: {},
      RuntimeProvingTask: {},
      StateTransitionTask: {},
    },
    BlockTrigger: {},
  },
});

// TODO: remove temporary `as any` once `error TS2742` is resolved
export default appChain as any;
