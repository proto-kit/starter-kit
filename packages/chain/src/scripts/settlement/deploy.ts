import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { AppChain } from "@proto-kit/sdk";
import {
  InMemoryDatabase,
  Sequencer,
  SequencerModule,
  SettlementModule,
} from "@proto-kit/sequencer";
import { PrivateKey, Provable } from "o1js";
import "reflect-metadata";
import { container } from "tsyringe";
import runtime from "../../runtime";
import * as protocol from "../../protocol";
import {
  scriptsSettlementSequencerModules,
  scriptsSettlementSequencerModulesConfig,
} from "../../sequencer";
import { PrismaRedisDatabase } from "@proto-kit/persistance";

export default async function () {
  const appChain = AppChain.from({
    Runtime: Runtime.from({
      modules: runtime.modules,
    }),
    Protocol: Protocol.from({
      modules: {
        ...protocol.modules,
        ...protocol.settlementModules,
      },
    }),
    Sequencer: Sequencer.from({
      modules: {
        Database: InMemoryDatabase,
        ...scriptsSettlementSequencerModules,
      },
    }),
    modules: {},
  });

  appChain.configure({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...protocol.settlementModulesConfig,
    },
    Sequencer: {
      ...scriptsSettlementSequencerModulesConfig,
      Database: {},
    },
  });

  const chainContainer = container.createChildContainer();
  console.log("start");
  await appChain.start(false, chainContainer);
  console.log("after start");

  const settlementModule = appChain.sequencer.resolveOrFail(
    "SettlementModule",
    SettlementModule
  );

  console.log("Deploying settlement contracts...");

  await settlementModule.deploy(
    PrivateKey.fromBase58(
      process.env.PROTOKIT_SETTLEMENT_CONTRACT_PRIVATE_KEY!
    ),
    PrivateKey.fromBase58(
      process.env.PROTOKIT_DISPATCHER_CONTRACT_PRIVATE_KEY!
    ),
    PrivateKey.fromBase58(
      process.env.PROTOKIT_MINA_BRIDGE_CONTRACT_PRIVATE_KEY!
    )
  );

  Provable.log("Deployed and initialized settlement contracts", {
    settlement: PrivateKey.fromBase58(
      process.env.PROTOKIT_SETTLEMENT_CONTRACT_PRIVATE_KEY!
    ).toPublicKey(),
    dispatcher: PrivateKey.fromBase58(
      process.env.PROTOKIT_DISPATCHER_CONTRACT_PRIVATE_KEY!
    ).toPublicKey(),
  });

  process.exit(0);
}
