import {
  Database,
  TimedProcessorTrigger,
  BlockFetching,
  HandlersExecutor,
} from "@proto-kit/processor";
import { ModulesConfig } from "@proto-kit/common";
import { PrismaClient } from "@prisma/client-processor";
import { handlers } from "./handlers";

export const modules = {
  Database: Database.from(new PrismaClient()),
  HandlersExecutor: HandlersExecutor.from<PrismaClient, typeof handlers>(
    handlers
  ),
  BlockFetching,
  Trigger: TimedProcessorTrigger,
};

export const config: ModulesConfig<typeof modules> = {
  Database: {},
  HandlersExecutor: {},
  BlockFetching: {
    url: `http://${process.env.PROTOKIT_INDEXER_GRAPHQL_HOST!}:${process.env.PROTOKIT_INDEXER_GRAPHQL_PORT!}`,
  },
  Trigger: {
    interval: Number(process.env.PROTOKIT_BLOCK_INTERVAL!) + 500,
  },
};

export default {
  modules,
  config,
};
