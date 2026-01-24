import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { Sequencer, AppChain } from "@proto-kit/sequencer";
import { Startable } from "@proto-kit/common";

import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";
import protocol from "../../../protocol";
import runtime from "../../../runtime";

const settlementEnabled = process.env.PROTOKIT_SETTLEMENT_ENABLED === "true";

const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from(protocol.modules),
  Sequencer: Sequencer.from({
    ...DefaultModules.inMemoryDatabase(),
    ...DefaultModules.core({
      settlementEnabled,
    }),
    ...DefaultModules.localTaskQueue(),
  }),
  ...DefaultModules.appChainBase(),
});
export default async (): Promise<Startable> => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: protocol.config,
    Sequencer: {
      ...DefaultConfigs.core({
        settlementEnabled,
      }),
      ...DefaultConfigs.inMemoryDatabase(),
      ...DefaultConfigs.localTaskQueue(),
    },
    ...DefaultConfigs.appChainBase(),
  });

  return appChain;
};
