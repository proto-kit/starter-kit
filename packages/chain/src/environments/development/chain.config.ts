import { AppChain } from "@proto-kit/sdk";
import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  DatabasePruneModule,
  PendingTransaction,
  Sequencer,
  sequencerModule,
} from "@proto-kit/sequencer";
import type { PrismaConnection } from "@proto-kit/persistance";
import {
  PrismaRedisDatabase,
  PrismaTransactionStorage,
  TransactionMapper,
} from "@proto-kit/persistance";
import runtime from "../../runtime";
import * as protocol from "../../protocol";
import {
  baseSequencerModules,
  baseSequencerModulesConfig,
  indexerSequencerModules,
  indexerSequencerModulesConfig,
  settlementSequencerModules,
  settlementSequencerModulesConfig,
} from "../../sequencer";
import { BullQueue } from "@proto-kit/deployment";
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
    modules: {
      ...protocol.modules,
      ...(process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true"
        ? protocol.settlementModules
        : {}),
    },
  }),
  Sequencer: Sequencer.from({
    modules: {
      // ordering of the modules matters due to dependency resolution
      Database: PrismaRedisDatabase,
      ...(process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true"
        ? settlementSequencerModules
        : {}),
      ...baseSequencerModules,
      ...indexerSequencerModules,
      TaskQueue: BullQueue,
      DatabasePruneModule,
    },
  }),
  modules: baseAppChainModules,
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
    Sequencer: {
      ...baseSequencerModulesConfig,
      ...indexerSequencerModulesConfig,
      ...(process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true"
        ? settlementSequencerModulesConfig
        : {}),
      DatabasePruneModule: {
        pruneOnStartup: args.pruneOnStartup,
      },
      TaskQueue: {
        redis: {
          host: process.env.REDIS_HOST!,
          port: Number(process.env.REDIS_PORT)!,
          password: process.env.REDIS_PASSWORD!,
        },
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
