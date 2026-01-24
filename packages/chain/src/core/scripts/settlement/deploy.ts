import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  InMemoryDatabase,
  Sequencer,
  SettlementModule,
  AppChain,
} from "@proto-kit/sequencer";
import { PrivateKey, Provable } from "o1js";
import "reflect-metadata";
import { container } from "tsyringe";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";

export default async function () {
  const appChain = AppChain.from({
    Runtime: Runtime.from(runtime.modules),
    Protocol: Protocol.from({
      ...protocol.modules,
      ...protocol.settlementModules,
    }),
    Sequencer: Sequencer.from({
      Database: InMemoryDatabase,
      ...DefaultModules.settlementScript(),
    }),
  });

  appChain.configure({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...protocol.settlementModulesConfig,
    },
    Sequencer: {
      ...DefaultConfigs.inMemoryDatabase(),
      ...DefaultConfigs.settlementScript({ preset: "development" }),
    } ,
  });

  const chainContainer = container.createChildContainer();
  const proofsEnabled = process.env.PROTOKIT_PROOFS_ENABLED === "true";
  await appChain.start(proofsEnabled, chainContainer);

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

  await appChain.close();
}
