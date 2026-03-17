import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  AppChain,
  BatchProducerModule,
  BridgingModule,
  ConstantFeeStrategy,
  InMemoryMinaSigner,
  MinaBaseLayer,
  Sequencer,
  SettlementModule,
} from "@proto-kit/sequencer";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";

import { Arguments } from "../../../start";
import { Startable } from "@proto-kit/common";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";
import { PrivateKey } from "o1js";

const settlementEnabled = process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true";

const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from({
    ...protocol.modules,
    ...(settlementEnabled ? protocol.settlementModules : {}),
  }),
  Sequencer: Sequencer.from({
    // ordering of the modules matters due to dependency resolution
    //...DefaultModules.metrics(),
    ...DefaultModules.prismaRedisDatabase(),
    ...DefaultModules.core({ settlementEnabled: false }),
    ...DefaultModules.redisTaskQueue(),
    ...DefaultModules.sequencerIndexer(),
    BaseLayer: MinaBaseLayer,
    FeeStrategy: ConstantFeeStrategy,
    BatchProducerModule,
    SettlementModule,
    SettlementSigner: InMemoryMinaSigner,
    BridgingModule,
  }),
  ...DefaultModules.appChainBase(),
});

export default async (args: Arguments): Promise<Startable> => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...(settlementEnabled ? protocol.settlementModulesConfig : {}),
    },
    Sequencer: {
      ...DefaultConfigs.core({
        settlementEnabled: false,
        preset: "development",
      }),
      ...DefaultConfigs.sequencerIndexer(),
      //...DefaultConfigs.metrics({ preset: "development" }),
      ...DefaultConfigs.redisTaskQueue({
        preset: "development",
        overrides: {
          redisDb: 1,
        },
      }),
      ...DefaultConfigs.prismaRedisDatabase({
        preset: "development",
        overrides: {
          pruneOnStartup: args.pruneOnStartup,
        },
      }),
      BaseLayer: {
        network: {
          type: process.env.MINA_NETWORK as any,
          graphql: process.env.MINA_NODE_GRAPHQL!,
          archive: process.env.MINA_ARCHIVE_GRAPHQL!,
          accountManager: process.env.MINA_ACCOUNT_MANAGER!,
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
      BatchProducerModule: {},
    },
    ...DefaultConfigs.appChainBase(),
  });

  return appChain;
};
