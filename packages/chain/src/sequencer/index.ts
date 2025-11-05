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
    SequencerStartupModule,
} from "@proto-kit/sequencer";
import { ModulesConfig } from "@proto-kit/common";
import { IndexerNotifier } from "@proto-kit/indexer";

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

export const baseSequencerModulesConfig = {
    ...apiSequencerModulesConfig,
    Mempool: {},
    BlockProducerModule: {},
    BlockTrigger: {
        blockInterval: Number(process.env.PROTOKIT_BLOCK_INTERVAL!),
        produceEmptyBlocks: true,
        settlementTokenConfig: {},
    },
    SequencerStartupModule: {},
} satisfies ModulesConfig<typeof baseSequencerModules>;

export const indexerSequencerModules = {
    IndexerNotifier: IndexerNotifier,
} satisfies SequencerModulesRecord;

export const indexerSequencerModulesConfig = {
    IndexerNotifier: {},
} satisfies ModulesConfig<typeof indexerSequencerModules>;
