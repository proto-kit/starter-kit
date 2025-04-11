import { ModulesConfig } from "@proto-kit/common";
import {
  BlockProducerModule,
  InMemoryDatabase,
  PrivateMempool,
  TimedBlockTrigger,
} from "@proto-kit/sequencer";
import * as api from "./../modules/api";

export const modules = {
  Database: InMemoryDatabase,
  ...api.modules,
  Mempool: PrivateMempool,
  BlockProducerModule,
  BlockTrigger: TimedBlockTrigger,
};

export const config: ModulesConfig<typeof modules> = {
  ...api.config,
  Database: {},
  Mempool: {},
  BlockProducerModule: {},
  BlockTrigger: {
    blockInterval: Number(process.env.PROTOKIT_BLOCK_INTERVAL),
  },
};

export default async () => {
  return { modules, config };
};
