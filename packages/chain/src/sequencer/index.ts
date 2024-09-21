import {
  GraphqlSequencerModule,
  GraphqlServer,
  VanillaGraphqlModules,
} from "@proto-kit/api";
import { ModulesConfig } from "@proto-kit/common";
import {
  BlockProducerModule,
  SequencerModulesRecord,
  TimedBlockTrigger,
} from "@proto-kit/sequencer";
import { DarkPoolMempool } from "./modules/dark-pool-mempool";

export const apiSequencerModules = {
  GraphqlServer,
  Graphql: GraphqlSequencerModule.from({
    modules: VanillaGraphqlModules.with({}),
  }),
} satisfies SequencerModulesRecord;

export const apiSequencerModulesConfig = {
  Graphql: VanillaGraphqlModules.defaultConfig(),
  GraphqlServer: {
    port: Number(process.env.PROTOKIT_GRAPHQL_PORT),
    host: process.env.PROTOKIT_GRAPHQL_HOST!,
    graphiql: Boolean(process.env.PROTOKIT_GRAPHIQL_ENABLED),
  },
} satisfies ModulesConfig<typeof apiSequencerModules>;

export const baseSequencerModules = {
  ...apiSequencerModules,
  Mempool: DarkPoolMempool,
  BlockProducerModule: BlockProducerModule,
  BlockTrigger: TimedBlockTrigger,
} satisfies SequencerModulesRecord;

export const baseSequencerModulesConfig = {
  ...apiSequencerModulesConfig,
  Mempool: {},
  BlockProducerModule: {},
  BlockTrigger: {
    blockInterval: Number(process.env.PROTOKIT_BLOCK_INTERVAL!),
    produceEmptyBlocks: true,
  },
} satisfies ModulesConfig<typeof baseSequencerModules>;
