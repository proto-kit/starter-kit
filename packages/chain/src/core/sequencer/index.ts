import {
  BridgingModule,
  ConstantFeeStrategy,
  InMemoryMinaSigner,
  MinaBaseLayer,
  SettlementModule,
} from "@proto-kit/sequencer";
import { PrivateKey } from "o1js";

export const baseSettlementSequencerModules = {
  BaseLayer: MinaBaseLayer,
  FeeStrategy: ConstantFeeStrategy,
  SettlementModule,
  SettlementSigner: InMemoryMinaSigner,
  BridgingModule,
};

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
};
