import {
  Database,
  TimedProcessorTrigger,
  BlockFetching,
  HandlersExecutor,
  ResolverFactoryGraphqlModule,
} from "@proto-kit/processor";
import { ModulesConfig } from "@proto-kit/common";
import { PrismaClient } from "@prisma/client-processor";
import { handlers } from "./handlers";
import { GraphqlSequencerModule, GraphqlServer } from "@proto-kit/api";

import { resolvers } from "./api/resolvers";

export const databaseModule = Database.from(new PrismaClient());

export const modules = {
  GraphqlServer,
  GraphqlSequencerModule: GraphqlSequencerModule.from({
    modules: {
      ResolverFactory: ResolverFactoryGraphqlModule.from(resolvers),
    },
  }),
  HandlersExecutor: HandlersExecutor.from<PrismaClient, typeof handlers>(
    handlers
  ),
  BlockFetching,
  Trigger: TimedProcessorTrigger,
};

export const config: ModulesConfig<typeof modules> = {
  HandlersExecutor: {},
  BlockFetching: {
    url: `http://${process.env.PROTOKIT_PROCESSOR_INDEXER_GRAPHQL_HOST!}:${process.env.PROTOKIT_INDEXER_GRAPHQL_PORT!}`,
  },
  Trigger: {
    interval: Number(process.env.PROTOKIT_BLOCK_INTERVAL!) + 500,
  },
  GraphqlServer: {
    host: process.env.PROTOKIT_PROCESSOR_GRAPHQL_HOST!,
    port: Number(process.env.PROTOKIT_PROCESSOR_GRAPHQL_PORT!),
    graphiql: Boolean(process.env.PROTOKIT_PROCESSOR_GRAPHIQL_ENABLED),
  },
  GraphqlSequencerModule: {
    ResolverFactory: {},
  },
};

export default {
  modules,
  config,
};
