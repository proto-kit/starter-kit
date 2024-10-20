import {
  GeneratedResolverFactoryGraphqlModule,
  IndexerModulesRecord,
} from "@proto-kit/indexer";
import { ModulesConfig } from "@proto-kit/common";
import { GraphqlSequencerModule, GraphqlServer } from "@proto-kit/api";
import { PrismaRedisDatabase } from "@proto-kit/persistance";
import { BullQueue } from "@proto-kit/deployment";
import {
  DatabasePruneModule,
  LocalTaskWorkerModule,
} from "@proto-kit/sequencer";
import { IndexBlockTask } from "@proto-kit/indexer";

export const modules = {
  Database: PrismaRedisDatabase,
  TaskQueue: BullQueue,
  TaskWorker: LocalTaskWorkerModule.from({
    IndexBlockTask: IndexBlockTask,
  }),
  GraphqlServer,
  Graphql: GraphqlSequencerModule.from({
    modules: {
      GeneratedResolverFactory: GeneratedResolverFactoryGraphqlModule,
    },
  }),
} satisfies IndexerModulesRecord;

export const config: ModulesConfig<typeof modules> = {
  Database: {
    redis: {
      host: process.env.REDIS_HOST!,
      port: Number(process.env.REDIS_PORT)!,
      password: process.env.REDIS_PASSWORD!,
    },
    prisma: {
      connection: process.env.INDEXER_DATABASE_URL!,
    },
  },
  TaskQueue: {
    redis: {
      host: process.env.REDIS_HOST!,
      port: Number(process.env.REDIS_PORT)!,
      password: process.env.REDIS_PASSWORD!,
    },
  },
  TaskWorker: {
    IndexBlockTask: {},
  },
  GraphqlServer: {
    port: Number(process.env.PROTOKIT_INDEXER_GRAPHQL_PORT),
    host: process.env.PROTOKIT_INDEXER_GRAPHQL_HOST!,
    graphiql: Boolean(process.env.PROTOKIT_INDEXER_GRAPHIQL_ENABLED),
  },
  Graphql: {
    GeneratedResolverFactory: {},
  },
};

export default {
  modules,
  config,
};
