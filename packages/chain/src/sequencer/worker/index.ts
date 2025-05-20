import { ModulesConfig } from "@proto-kit/common";
import { BullQueue } from "@proto-kit/deployment";
import {
  ConstantFeeStrategy,
  LocalTaskWorkerModule,
  TaskWorkerModulesRecord,
  VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";
import {
  baseSettlementSequencerModulesConfig,
} from "..";

export const taskModules = {
  ...VanillaTaskWorkerModules.allTasks(),
} satisfies TaskWorkerModulesRecord;

export const taskModulesConfig = {
  ...VanillaTaskWorkerModules.defaultConfig(),
} satisfies ModulesConfig<typeof taskModules>;

export const workerModules = {
  FeeStrategy: ConstantFeeStrategy,
  TaskQueue: BullQueue,
  LocalTaskWorkerModule: LocalTaskWorkerModule.from(taskModules),
};

export const workerModulesConfig = {
  FeeStrategy: baseSettlementSequencerModulesConfig.FeeStrategy,
  TaskQueue: {
    redis: {
      host: process.env.REDIS_HOST!,
      port: Number(process.env.REDIS_PORT)!,
      password: process.env.REDIS_PASSWORD!,
      db: 1,
    },
  },
  LocalTaskWorkerModule: taskModulesConfig,
} satisfies ModulesConfig<typeof workerModules>;
