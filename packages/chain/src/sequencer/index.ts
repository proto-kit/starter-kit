import {
    VanillaGraphqlModules,
    GraphqlSequencerModule,
    GraphqlServer,
    OpenTelemetryServer,
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
  LocalTaskQueue,
  LocalTaskWorkerModule,
  VanillaTaskWorkerModules,
  SettlementProvingTask,
} from "@proto-kit/sequencer";
import { ModulesConfig } from "@proto-kit/common";
import { IndexerNotifier } from "@proto-kit/indexer";
import { PrivateKey, TokenId } from "o1js";
import { FungibleToken } from "mina-fungible-token";

export const apiSequencerModules = {
    GraphqlServer,
    Graphql: GraphqlSequencerModule.from(VanillaGraphqlModules.with({})),
} satisfies SequencerModulesRecord;

export const apiSequencerModulesConfig = {
    Graphql: VanillaGraphqlModules.defaultConfig(),
    GraphqlServer: {
        port: Number(process.env.PROTOKIT_GRAPHQL_PORT),
        host: process.env.PROTOKIT_GRAPHQL_HOST!,
        graphiql: Boolean(process.env.PROTOKIT_GRAPHIQL_ENABLED),
    },
} satisfies ModulesConfig<typeof apiSequencerModules>;

export const metricsSequencerModules = {
    OpenTelemetryServer,
} satisfies SequencerModulesRecord;

export const metricsSequencerModulesConfig = {
    OpenTelemetryServer: {
        metrics: {
            enabled: Boolean(process.env.OPEN_TELEMETRY_METRICS_ENABLED ?? false),
            prometheus: {
                host: process.env.OPEN_TELEMETRY_METRICS_HOST ?? "localhost",
                port: Number(process.env.OPEN_TELEMETRY_METRICS_PORT),
                appendTimestamp: true,
            },
            nodeScrapeInterval: Number(process.env.OPEN_TELEMETRY_METRICS_SCRAPING_FREQUENCY ?? 10),
        },
        tracing: {
            enabled: Boolean(process.env.OPEN_TELEMETRY_TRACING_ENABLED ?? false),
            otlp: {
                url: process.env.OPEN_TELEMETRY_TRACING_URL,
            },
        },
    },
} satisfies ModulesConfig<typeof metricsSequencerModules>;

export const baseSequencerModules = {
  ...apiSequencerModules,
  Mempool: PrivateMempool,
  BlockProducerModule: BlockProducerModule,
  BlockTrigger: TimedBlockTrigger,
  SequencerStartupModule,
} satisfies SequencerModulesRecord;

console.log("settlement interval", {
  SETTLEMENT_ENABLED: process.env.PROTOKIT_SETTLEMENT_ENABLED,
  SETTLEMENT_INTERVAL: process.env.PROTOKIT_SETTLEMENT_INTERVAL,
});

const customTokenConfig = process.env.PROTOKIT_CUSTOM_TOKEN_PRIVATE_KEY ? {
  [TokenId.derive(PrivateKey.fromBase58(process.env.PROTOKIT_CUSTOM_TOKEN_PRIVATE_KEY).toPublicKey()).toString()]: {
    bridgingContractPrivateKey: PrivateKey.fromBase58(process.env.PROTOKIT_CUSTOM_TOKEN_BRIDGE_PRIVATE_KEY!),
    tokenOwner: FungibleToken,
    tokenOwnerPrivateKey: process.env.PROTOKIT_CUSTOM_TOKEN_PRIVATE_KEY
  }
} : {};

export const baseSequencerModulesConfig = {
  ...apiSequencerModulesConfig,
  Mempool: {},
  BlockProducerModule: {},
  BlockTrigger: {
    blockInterval: Number(process.env.PROTOKIT_BLOCK_INTERVAL!),
    produceEmptyBlocks: true,
    settlementInterval: Number(process.env.PROTOKIT_SETTLEMENT_INTERVAL!),
    settlementTokenConfig: {
      "1": {
        bridgingContractPrivateKey: PrivateKey.fromBase58(
          process.env.PROTOKIT_MINA_BRIDGE_CONTRACT_PRIVATE_KEY!
        ),
      },
      ...customTokenConfig
    },
  },
  SequencerStartupModule: {},
} satisfies ModulesConfig<typeof baseSequencerModules>;

export const indexerSequencerModules = {
    IndexerNotifier: IndexerNotifier,
} satisfies SequencerModulesRecord;

export const indexerSequencerModulesConfig = {
    IndexerNotifier: {},
} satisfies ModulesConfig<typeof indexerSequencerModules>;

const taskWorkerModule = LocalTaskWorkerModule.from({
  ...VanillaTaskWorkerModules.withoutSettlement(),
  SettlementProvingTask,
});

export const baseSettlementSequencerModules = {
  BaseLayer: MinaBaseLayer,
  FeeStrategy: ConstantFeeStrategy,
  BlockProducerModule,
  BatchProducerModule,
  SettlementModule: SettlementModule,
};

export const scriptsSettlementSequencerModules = {
  ...baseSettlementSequencerModules,
  Mempool: PrivateMempool,
  TaskQueue: LocalTaskQueue,

  LocalTaskWorkerModule: taskWorkerModule,
  SequencerStartupModule,
} satisfies SequencerModulesRecord;

export const baseSettlementSequencerModulesConfig = {
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
  BlockProducerModule: {},
  BatchProducerModule: {},
} satisfies ModulesConfig<typeof baseSettlementSequencerModules>;

export const scriptsSettlementSequencerModulesConfig = {
  ...baseSettlementSequencerModulesConfig,
  SequencerStartupModule: {},
  TaskQueue: {
    simulatedDuration: 0,
  },
  Mempool: {},
  LocalTaskWorkerModule: VanillaTaskWorkerModules.defaultConfig(),
} satisfies ModulesConfig<typeof scriptsSettlementSequencerModules>;
