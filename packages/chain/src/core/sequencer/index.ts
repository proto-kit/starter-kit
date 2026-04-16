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
      graphql: process.env.MINA_NODE_GRAPHQL ?? "http://localhost:8083/graphql",
      archive:
        process.env.MINA_ARCHIVE_GRAPHQL ?? "http://localhost:8085/graphql",
      accountManager:
        process.env.MINA_ACCOUNT_MANAGER_URL ?? "http://localhost:8084",
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

export const metricsSequencerModulesConfig = {
  OpenTelemetryServer: {
    metrics: {
      enabled: true,
      prometheus: {
        host: process.env.OPEN_TELEMETRY_METRICS_HOST ?? "localhost",
        port: Number(process.env.OPEN_TELEMETRY_METRICS_PORT),
        appendTimestamp: true,
      },
      nodeScrapeInterval: 10,
    },
    tracing: {
      enabled: true,
      otlp: {
        url: process.env.OPEN_TELEMETRY_TRACING_URL,
      },
    },
  },
} satisfies ModulesConfig<typeof metricsSequencerModules>;
