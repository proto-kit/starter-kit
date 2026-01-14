import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  InMemoryDatabase,
  Sequencer,
  AppChain,
  LocalTaskQueue,
  LocalTaskWorkerModule,
  VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";
import runtime from "../../../runtime";
import protocol from "../../../protocol";
import {
  baseSequencerModules,
  baseSequencerModulesConfig,
} from "../../sequencer";
import { baseAppChainModules } from "../../app-chain";

export const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from(protocol.modules),
  Sequencer: Sequencer.from({
    Database: InMemoryDatabase,
    ...baseSequencerModules,
    TaskQueue: LocalTaskQueue,
    LocalTaskWorker: LocalTaskWorkerModule.from(
      process.env.PROTOKIT_SETTLEMENT_ENABLED === "true"
        ? VanillaTaskWorkerModules.withoutSettlement()
        : VanillaTaskWorkerModules.allTasks()
    ),
  }),
  ...baseAppChainModules,
});

export default async () => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: protocol.config,
    Sequencer: {
      ...baseSequencerModulesConfig,
      Database: {},
      TaskQueue: {},
      LocalTaskWorker: VanillaTaskWorkerModules.defaultConfig(),
    },
    ...baseSequencerModulesConfig,
  });

  return appChain;
};
