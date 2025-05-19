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
  MinaBaseLayer,
  SettlementModule,
  ConstantFeeStrategy,
  BatchProducerModule,
  SequencerStartupModule,
} from "@proto-kit/sequencer";
import { ModulesConfig } from "@proto-kit/common";
import { IndexerNotifier } from "@proto-kit/indexer";
import { PrivateKey, PublicKey } from "o1js";

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
    settlementInterval: Number(process.env.PROTOKIT_SETTLEMENT_INTERVAL!),
    settlementTokenConfig: {
      "0": {
        bridgingContractPrivateKey: PrivateKey.fromBase58(
          process.env.PROTOKIT_MINA_BRIDGE_CONTRACT_PRIVATE_KEY!
        ),
      },
    },
  },
} satisfies ModulesConfig<typeof baseSequencerModules>;

export const indexerSequencerModules = {
  IndexerNotifier: IndexerNotifier,
} satisfies SequencerModulesRecord;

export const indexerSequencerModulesConfig = {
  IndexerNotifier: {},
} satisfies ModulesConfig<typeof indexerSequencerModules>;

export const settlementSequencerModules = {
  BaseLayer: MinaBaseLayer,
  SettlementModule: SettlementModule,
  FeeStrategy: ConstantFeeStrategy,
  BatchProducerModule,
  SequencerStartupModule,
} satisfies SequencerModulesRecord;

export const settlementSequencerModulesConfig = {
  BaseLayer: {
    network: {
      type: "lightnet",
      graphql: `${process.env.MINA_NODE_GRAPHQL_HOST!}:${process.env.MINA_NODE_GRAPHQL_PORT!}/graphql`,
      archive: `${process.env.MINA_ARCHIVE_GRAPHQL_HOST!}:${process.env.MINA_ARCHIVE_GRAPHQL_PORT!}`,
      accountManager: `${process.env.MINA_ACCOUNT_MANAGER_HOST!}:${process.env.MINA_ACCOUNT_MANAGER_PORT!}`,
    },
  },
  SettlementModule: {
    feepayer: PrivateKey.fromBase58(
      process.env.PROTOKIT_SEQUENCER_PRIVATE_KEY!
    ),
    addresses: {
      settlement: PublicKey.fromBase58(
        process.env.PROTOKIT_SETTLEMENT_CONTRACT_PUBLIC_KEY!
      ),
      dispatch: PublicKey.fromBase58(
        process.env.PROTOKIT_DISPATCHER_CONTRACT_PUBLIC_KEY!
      ),
    },
    keys: {
      settlement: PrivateKey.fromBase58(
        process.env.PROTOKIT_SETTLEMENT_CONTRACT_PRIVATE_KEY!
      ),
      dispatch: PrivateKey.fromBase58(
        process.env.PROTOKIT_DISPATCHER_CONTRACT_PRIVATE_KEY!
      ),
      minaBridge: PrivateKey.fromBase58(
        process.env.PROTOKIT_MINA_BRIDGE_CONTRACT_PRIVATE_KEY!
      ),
    },
  },
  FeeStrategy: {},
  BatchProducerModule: {},
  SequencerStartupModule: {},
} satisfies ModulesConfig<typeof settlementSequencerModules>;
