import { ModulesConfig } from "@proto-kit/common";
import { BullQueue } from "@proto-kit/deployment";
import {
  LocalTaskWorkerModule,
  TaskWorkerModulesRecord,
  VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";

export const taskModules = {
  ...VanillaTaskWorkerModules.allTasks(),
} satisfies TaskWorkerModulesRecord;

export const taskModulesConfig = {
  ...VanillaTaskWorkerModules.defaultConfig(),
} satisfies ModulesConfig<typeof taskModules>;

export const workerModules = {
  TaskQueue: BullQueue,
  LocalTaskWorkerModule: LocalTaskWorkerModule.from(taskModules),
};

export const workerModulesConfig = {
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
