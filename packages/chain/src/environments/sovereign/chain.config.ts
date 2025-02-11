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
  indexerSequencerModules,
  indexerSequencerModulesConfig,
} from "../../sequencer";
import { BullQueue, Startable } from "@proto-kit/deployment";
import { Arguments } from "../../start";
import {
  baseAppChainModules,
  baseAppChainModulesConfig,
} from "../../app-chain";
import {OpenTelemetryServer} from "@proto-kit/api";

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
      ...indexerSequencerModules,
      TaskQueue: BullQueue,
      DatabasePruneModule,
      OpenTelemetryServer: OpenTelemetryServer
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
      ...indexerSequencerModulesConfig,
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
      OpenTelemetryServer: {
        metrics: {
          enabled: Boolean(process.env.OPEN_TELEMETRY_METRICS_ENABLED ?? false),
          prometheus: { host: undefined,
            port: Number(process.env.OPEN_TELEMETRY_METRICS_PORT),
            endpoint: process.env.OPEN_TELEMETRY_METRICS_ENDPOINT,
            prefix: "",
            appendTimestamp: true},
          nodeScrapeInterval: Number(process.env.OPEN_TELEMETRY_METRICS_SCRAPING_FREQUENCY ?? 10),
        },
        tracing: {
          enabled: Boolean(process.env.OPEN_TELEMETRY_TRACING_ENABLED ?? false),
          otlp: {
            url: process.env.OPEN_TELEMETRY_TRACING_URL,
          },
        },
      },
    },
    ...baseAppChainModulesConfig,
  });

  return appChain;
};
