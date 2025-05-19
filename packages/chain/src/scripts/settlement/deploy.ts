import { Runtime } from "@proto-kit/module";
import { Protocol, SettlementContractModule } from "@proto-kit/protocol";
import { AppChain } from "@proto-kit/sdk";
import {
  Sequencer,
  SequencerModule,
  SettlementModule,
} from "@proto-kit/sequencer";
import { PrivateKey, Provable, Transaction } from "o1js";
import "reflect-metadata";
import { container, injectable } from "tsyringe";
import runtime from "../../runtime";
import * as protocol from "../../protocol";
import {
  settlementSequencerModules,
  settlementSequencerModulesConfig,
} from "../../sequencer";
import { BullQueue } from "@proto-kit/deployment";
import { PrismaRedisDatabase } from "@proto-kit/persistance";
import { CompileRegistry } from "@proto-kit/common";

class Noop extends SequencerModule {
  public async start() {}
}

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
        Database: PrismaRedisDatabase,
        TaskQueue: BullQueue,
        ...settlementSequencerModules,
        SequencerStartupModule: Noop,
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
      Database: {
        redis: {
          host: process.env.REDIS_HOST!,
          port: Number(process.env.REDIS_PORT)!,
          password: process.env.REDIS_PASSWORD!,
        },
        prisma: {
          connection: process.env.DATABASE_URL!,
        },
      },
      TaskQueue: {
        redis: {
          host: process.env.REDIS_HOST!,
          port: Number(process.env.REDIS_PORT)!,
          password: process.env.REDIS_PASSWORD!,
        },
      },
      ...settlementSequencerModulesConfig,
    },
  });

  @injectable()
  class InlineMinaTransactionSender {
    public async proveAndSendTransaction(
      transaction: Transaction<false, true>
    ) {
      const result = await transaction.send();
      await result.wait();
    }
  }

  // TODO: split start & initialize into separate functions, so that we can use the appchain definition/container without starting
  appChain.create(() => container);

  console.log("start");
  await appChain.start();
  console.log("after start");

  const settlementModule = appChain.sequencer.resolveOrFail(
    "SettlementModule",
    SettlementModule
  );

  // stub the transaction sender to work inline, standard transaction sender works with the internal worker flows
  (settlementModule as any).transactionSender =
    new InlineMinaTransactionSender();

  const settlementContractModule = appChain.protocol.resolveOrFail(
    "SettlementContractModule",
    SettlementContractModule
  );
  // TODO: does not respect are proofs enabled, since it does not have access to it DI-wise
  const compileRegistry = container.resolve<CompileRegistry>(CompileRegistry);

  console.log("compile");
  // compile contracts for deployment
  const contracts = settlementContractModule.getContractClasses();
  for (const contractName in contracts) {
    const target = contracts[contractName];
    await compileRegistry.compile(target);
  }

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
