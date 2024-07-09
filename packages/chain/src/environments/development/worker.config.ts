import { AppChain } from "@proto-kit/sdk";
import {
  SimpleSequencerModules,
  VanillaProtocolModules,
  VanillaRuntimeModules,
} from "@proto-kit/library";
import { BullQueue } from "@proto-kit/deployment";
import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { Sequencer } from "@proto-kit/sequencer";

import runtime from "../../runtime";
import protocol from "../../protocol";

export const worker = AppChain.from({
  Runtime: Runtime.from({
    modules: VanillaRuntimeModules.with(runtime.modules),
  }),
  Protocol: Protocol.from({
    modules: VanillaProtocolModules.with(protocol.modules),
  }),
  Sequencer: Sequencer.from({
    modules: SimpleSequencerModules.worker(BullQueue, {}),
  }),
  modules: {},
});

worker.configurePartial({
  Runtime: {
    ...VanillaRuntimeModules.defaultConfig(),
    ...runtime.config,
  },
  Protocol: {
    ...VanillaProtocolModules.defaultConfig(),
    ...protocol.config,
  },
  Sequencer: {
    ...SimpleSequencerModules.defaultWorkerConfig(),
    TaskQueue: {
      redis: {
        host: "redis",
        port: 6379,
        password: "password",
      },
    },
  },
});


export default worker;