import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  Sequencer,
  AppChain,
  LocalTaskWorkerModule,
  VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";
import { Arguments } from "../../../start";

import { log, Startable } from "@proto-kit/common";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";

const settlementEnabled = process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true";

const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from({
    ...protocol.modules,
    ...(settlementEnabled ? protocol.settlementModules : {}),
  }),
  Sequencer: Sequencer.from({
    ...DefaultModules.worker(),
    ...(!settlementEnabled
      ? {
          LocalTaskWorkerModule: LocalTaskWorkerModule.from(
            VanillaTaskWorkerModules.withoutSettlement()
          ),
        }
      : {}),
  }),
});

export default async (args: Arguments): Promise<Startable> => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...(settlementEnabled ? protocol.settlementModulesConfig : {}),
    },
    Sequencer: DefaultConfigs.worker({
      preset: "sovereign",
      overrides: {
        redisDb: 1,
      },
    }),
  });

  log.setLevel("DEBUG");

  return appChain;
};
