import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { Sequencer, AppChain } from "@proto-kit/sequencer";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";
import { Arguments } from "../../../start";

import { log, Startable } from "@proto-kit/common";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";

const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from({
    ...protocol.modules,
    ...(process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true"
      ? protocol.settlementModules
      : {}),
  }),
  Sequencer: Sequencer.from({
    ...DefaultModules.worker(),
  }),
});

export default async (args: Arguments): Promise<Startable> => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...(process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true"
        ? protocol.settlementModulesConfig
        : {}),
    },
    Sequencer: DefaultConfigs.worker({
      preset: "development",
    }),
  });

  log.setLevel("DEBUG");

  return appChain;
};
