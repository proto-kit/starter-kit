import { Runtime } from "@proto-kit/module";
import { Protocol, ProtocolConstants } from "@proto-kit/protocol";
import {
  Sequencer,
  AppChain,
  WorkerModule,
  VanillaTaskWorkerModules,
  SettlementProvingTask,
  SettlementCompileTask,
  WorkerRegistrationTask,
  StateTransitionReductionTask,
  StateTransitionTask,
  RuntimeProvingTask,
  TransactionProvingTask,
  TransactionReductionTask,
  BlockReductionTask,
  NewBlockTask,
} from "@proto-kit/sequencer";
import { BullQueue } from "@proto-kit/deployment";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";
import { Arguments } from "../../../start";

import { ModulesConfig, Startable } from "@proto-kit/common";

const variants = {
  default: VanillaTaskWorkerModules.allTasks(),
  l2: VanillaTaskWorkerModules.withoutSettlement(),
  l1: {
    SettlementProvingTask,
    SettlementCompileTask,
    WorkerRegistrationTask,
  },
  transaction: {
    RuntimeProvingTask,
    TransactionProvingTask,
    TransactionReductionTask,
    WorkerRegistrationTask,
  },
  st: {
    StateTransitionTask,
    StateTransitionReductionTask,
    WorkerRegistrationTask,
  },
  block: {
    BlockReductionTask,
    NewBlockTask,
    WorkerRegistrationTask,
  },
};

const variantConfigs = {
  default: VanillaTaskWorkerModules.defaultConfig(),
  l2: VanillaTaskWorkerModules.defaultConfig(),
  l1: {
    SettlementProvingTask: {},
    SettlementCompileTask: {},
    WorkerRegistrationTask: {},
  } satisfies ModulesConfig<(typeof variants)["l1"]>,
  transaction: {
    RuntimeProvingTask: {},
    TransactionProvingTask: {},
    TransactionReductionTask: {},
    WorkerRegistrationTask: {},
  },
  st: {
    StateTransitionTask: {},
    StateTransitionReductionTask: {},
    WorkerRegistrationTask: {},
  },
  block: {
    BlockReductionTask: {},
    NewBlockTask: {},
    WorkerRegistrationTask: {},
  },
};

const variant = process.env.PROTOKIT_WORKER_VARIANT ?? "default";

function validateVariant(
  variant: string
): asserts variant is keyof typeof variants {
  if (!(variant in variants)) {
    throw new Error(`Worker variant ${variant} not found`);
  }
}
validateVariant(variant);

const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from({
    ...protocol.modules,
    ...protocol.settlementModules,
  }),
  Sequencer: Sequencer.from({
    TaskQueue: BullQueue,
    WorkerModule: WorkerModule.from(variants[variant]),
  }),
});

export default async (args: Arguments): Promise<Startable> => {
  ProtocolConstants.printAllConstants();

  appChain.configure({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...protocol.settlementModulesConfig,
    },
    Sequencer: {
      WorkerModule: VanillaTaskWorkerModules.defaultConfig(),
      TaskQueue: {
        redis: {
          host: process.env.REDIS_HOST ?? "redis",
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD ?? "password",
          db: 1,
        },
      },
    },
  });

  return appChain;
};
