import { ModulesConfig } from "@proto-kit/common";
import {
  BlockProducerModule,
  InMemoryDatabase,
  PrivateMempool,
  TimedBlockTrigger,
} from "@proto-kit/sequencer";
import { PrismaRedisDatabase } from "@proto-kit/persistance";
import * as api from "../modules/api";

export const modules = {
  Database: PrismaRedisDatabase,
  ...api.modules,
  Mempool: PrivateMempool,
  BlockProducerModule,
  BlockTrigger: TimedBlockTrigger,
};

export const config: ModulesConfig<typeof modules> = {
  ...api.config,
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
  Mempool: {},
  BlockProducerModule: {},
  BlockTrigger: {
    blockInterval: Number(process.env.PROTOKIT_BLOCK_INTERVAL),
  },
};

export default async () => {
  return { modules, config };
};
