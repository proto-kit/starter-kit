import {
  Indexer,
  IndexBlockTask,
  IndexBatchTask,
  IndexPendingTxTask,
  IndexSettlementTask,
  GeneratedResolverFactoryGraphqlModule,
} from "@proto-kit/indexer";
import { GraphqlSequencerModule, OpenTelemetryServer } from "@proto-kit/api";
import { WorkerModule } from "@proto-kit/sequencer";
import { PrismaRedisDatabase } from "@proto-kit/persistance";
import { BullQueue } from "@proto-kit/deployment";
import { Arguments } from "../../../start";
import { Startable } from "@proto-kit/common";

const indexer = Indexer.from({
  Database: PrismaRedisDatabase,
  TaskQueue: BullQueue,
  TaskWorker: WorkerModule.from({
    IndexBlockTask,
    IndexPendingTxTask,
    IndexBatchTask,
    IndexSettlementTask,
  }),
  Graphql: GraphqlSequencerModule.from({
    GeneratedResolverFactory: GeneratedResolverFactoryGraphqlModule,
  }),
  OpenTelemetryServer,
});

export default async (args: Arguments): Promise<Startable> => {
  indexer.configurePartial({
    Database: {
      redis: {
        host: process.env.REDIS_HOST ?? "redis",
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD ?? "password",
      },
      prisma: {
        connection: process.env.INDEXER_DATABASE_URL!,
      },
    },
    TaskQueue: {
      redis: {
        host: process.env.REDIS_HOST ?? "redis",
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD ?? "password",
        db: 1,
      },
    },
    TaskWorker: {
      IndexBlockTask: {},
      IndexBatchTask: {},
      IndexPendingTxTask: {},
      IndexSettlementTask: {},
    },
    Graphql: {
      GeneratedResolverFactory: {},
      containerConfig: {
        port: Number(process.env.PROTOKIT_INDEXER_GRAPHQL_PORT ?? 8081),
        host: process.env.PROTOKIT_INDEXER_GRAPHQL_HOST ?? "0.0.0.0",
        graphiql: true,
      },
    },
    OpenTelemetryServer: {
      tracing: {
        enabled: false,
      },
      metrics: {
        enabled: true,
        prometheus: {
          host: process.env.INDEXER_OPEN_TELEMETRY_METRICS_HOST ?? "localhost",
          port: Number(process.env.INDEXER_OPEN_TELEMETRY_METRICS_PORT),
          appendTimestamp: true,
        },
        nodeScrapeInterval: 10,
      },
    },
  });
  return indexer;
};
