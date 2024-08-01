import {
  VanillaGraphqlModules,
  GraphqlSequencerModule,
  GraphqlServer,
} from "@proto-kit/api";
import {
  PrivateMempool,
  SequencerModulesRecord,
  TimedBlockTrigger,
  BlockProducerModule,
} from "@proto-kit/sequencer";
import { ModulesConfig } from "@proto-kit/common";

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
  Mempool: PrivateMempool,
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
