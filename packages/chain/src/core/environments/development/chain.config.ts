import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { AppChain, Sequencer } from "@proto-kit/sequencer";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";

import { Arguments } from "../../../start";
import { Startable } from "@proto-kit/common";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";

const settlementEnabled = process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true";

const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from({
    ...protocol.modules,
    ...(settlementEnabled ? protocol.settlementModules : {}),
  }),
  Sequencer: Sequencer.from({
    // ordering of the modules matters due to dependency resolution
    //...DefaultModules.metrics(),
    ...DefaultModules.prismaRedisDatabase(),
    ...DefaultModules.core({ settlementEnabled }),
    ...DefaultModules.redisTaskQueue(),
    ...DefaultModules.sequencerIndexer(),
  }),
  ...DefaultModules.appChainBase(),
});

export default async (args: Arguments): Promise<Startable> => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...(settlementEnabled ? protocol.settlementModulesConfig : {}),
    },
    Sequencer: {
      ...DefaultConfigs.core({ settlementEnabled, preset: "development" }),
      ...DefaultConfigs.sequencerIndexer(),
      //...DefaultConfigs.metrics({ preset: "development" }),
      ...DefaultConfigs.redisTaskQueue({
        preset: "development",
        overrides: {
          redisDb: 1,
        },
      }),
      ...DefaultConfigs.prismaRedisDatabase({
        preset: "development",
        overrides: {
          pruneOnStartup: args.pruneOnStartup,
        },
      }),
    },
    ...DefaultConfigs.appChainBase(),
  });

  return appChain;
};
