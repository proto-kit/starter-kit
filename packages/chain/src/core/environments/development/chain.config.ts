import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";
import { Arguments } from "../../../start";
import { Startable } from "@proto-kit/common";
import { DefaultAppChain, DefaultAppChainConfig } from "@proto-kit/stack";

const settlementEnabled = process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true";

export const appChain = DefaultAppChain.development(
  runtime.modules,
  protocol.modules,
  { settlementEnabled }
);

export default async (args: Arguments): Promise<Startable> => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...(settlementEnabled ? protocol.settlementModulesConfig : {}),
    },
    ...DefaultAppChainConfig.development({
      settlementEnabled,
      overrideSequencerConfig: {
        DatabasePruneModule: {
          pruneOnStartup: args.pruneOnStartup,
        },
      },
    }),
  });

  return appChain;
};
