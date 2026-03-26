import { OpenTelemetryServer } from "@proto-kit/api";
import { ModulesConfig } from "@proto-kit/common";
import {
  BridgingModule,
  ConstantFeeStrategy,
  InMemoryMinaSigner,
  MinaBaseLayer,
  SequencerModulesRecord,
  SettlementModule,
} from "@proto-kit/sequencer";
import { PrivateKey } from "o1js";
import { DevelopmentConfig } from "../environments/development/config";
import { SovereignConfig } from "../environments/sovereign/config";

export const baseSettlementSequencerModules = {
  BaseLayer: MinaBaseLayer,
  FeeStrategy: ConstantFeeStrategy,
  SettlementModule,
  SettlementSigner: InMemoryMinaSigner,
  BridgingModule,
} satisfies SequencerModulesRecord;

export const baseSettlementSequencerModulesConfig = {
  BaseLayer: {
    network: {
      type:
        (process.env.MINA_NETWORK as "local" | "lightnet" | "remote") ??
        "lightnet",
      graphql: `${process.env.MINA_NODE_GRAPHQL_HOST ?? "http://localhost"}:${process.env.MINA_NODE_GRAPHQL_PORT ?? 8083}/graphql`,
      archive: `${process.env.MINA_ARCHIVE_GRAPHQL_HOST ?? "http://localhost"}:${process.env.MINA_ARCHIVE_GRAPHQL_PORT ?? 8085}`,
      accountManager: `${process.env.MINA_ACCOUNT_MANAGER_HOST ?? "http://localhost"}:${process.env.MINA_ACCOUNT_MANAGER_PORT ?? 8084}`,
    },
  },
  SettlementModule: {
    addresses: {
      SettlementContract: PrivateKey.fromBase58(
        process.env.PROTOKIT_SETTLEMENT_CONTRACT_PRIVATE_KEY!
      ).toPublicKey(),
    },
  },
  BridgingModule: {
    addresses: {
      DispatchContract: PrivateKey.fromBase58(
        process.env.PROTOKIT_DISPATCHER_CONTRACT_PRIVATE_KEY!
      ).toPublicKey(),
    },
  },
  SettlementSigner: {
    feepayer: PrivateKey.fromBase58(
      process.env.PROTOKIT_SEQUENCER_PRIVATE_KEY!
    ),
    contractKeys: [
      PrivateKey.fromBase58(
        process.env.PROTOKIT_SETTLEMENT_CONTRACT_PRIVATE_KEY!
      ),
      PrivateKey.fromBase58(
        process.env.PROTOKIT_DISPATCHER_CONTRACT_PRIVATE_KEY!
      ),
      PrivateKey.fromBase58(
        process.env.PROTOKIT_MINA_BRIDGE_CONTRACT_PRIVATE_KEY!
      ),
    ],
  },
  FeeStrategy: {},
} satisfies ModulesConfig<typeof baseSettlementSequencerModules>;

export const metricsSequencerModules = {
  OpenTelemetryServer,
} satisfies SequencerModulesRecord;
export const createMetricsSequencerModulesConfig = (
  config: DevelopmentConfig | SovereignConfig
) =>
  ({
    OpenTelemetryServer: {
      metrics: {
        enabled: config.openTelemetry.metrics.enabled,
        prometheus: {
          host: process.env.OPEN_TELEMETRY_METRICS_HOST ?? "localhost",
          port: Number(process.env.OPEN_TELEMETRY_METRICS_PORT),
          appendTimestamp: true,
        },
        nodeScrapeInterval: config.openTelemetry.metrics.scrapingFrequency,
      },
      tracing: {
        enabled: config.openTelemetry.tracing.enabled,
        otlp: {
          url: process.env.OPEN_TELEMETRY_TRACING_URL,
        },
      },
    },
  }) satisfies ModulesConfig<typeof metricsSequencerModules>;
