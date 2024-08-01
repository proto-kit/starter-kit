import { AppChain } from "@proto-kit/sdk";
import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { DatabasePruneModule, Sequencer } from "@proto-kit/sequencer";
import { PrismaRedisDatabase } from "@proto-kit/persistance";
import runtime from "../../runtime";
import protocol from "../../protocol";
import {
  baseSequencerModules,
  baseSequencerModulesConfig,
} from "../../sequencer";
import { Startable } from "@proto-kit/deployment";
import { Arguments } from "../../start";
import {
  baseAppChainModules,
  baseAppChainModulesConfig,
} from "../../app-chain";

export const appChain = AppChain.from({
  Runtime: Runtime.from({
    modules: runtime.modules,
  }),
  Protocol: Protocol.from({
    modules: protocol.modules,
  }),
  Sequencer: Sequencer.from({
    modules: {
      // ordering of the modules matters due to dependency resolution
      Database: PrismaRedisDatabase,
      ...baseSequencerModules,
      DatabasePruneModule,
    },
  }),
  modules: baseAppChainModules,
});

export default async (args: Arguments): Promise<Startable> => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: protocol.config,
    Sequencer: {
      ...baseSequencerModulesConfig,
      DatabasePruneModule: {
        pruneOnStartup: args.pruneOnStartup,
      },
      Database: {
        redis: {
          host: process.env.REDIS_HOST!,
          port: Number(process.env.REDIS_PORT)!,
          password: process.env.REDIS_PASSWORD!,
        },
        prisma: {
          connection: process.env.DATABASE_URL!,
        },
      },
    },
    ...baseAppChainModulesConfig,
  });

  return appChain;
};
