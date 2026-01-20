import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { Sequencer, AppChain } from "@proto-kit/sequencer";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";
import { Arguments } from "../../../start";

import { log } from "@proto-kit/common";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";

export const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from({
    ...protocol.modules,
    ...(process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true"
      ? protocol.settlementModules
      : {}),
  }),
  Sequencer: Sequencer.from(DefaultModules.worker()),
});

export default async (args: Arguments) => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...(process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true"
        ? protocol.settlementModulesConfig
        : {}),
    },
    Sequencer: DefaultConfigs.worker({ preset: "sovereign" }),
  });

  log.setLevel("DEBUG");

  return appChain;
};
