import { ModulesConfig } from "@proto-kit/common";
import { BullQueue } from "@proto-kit/deployment";
import {
  ConstantFeeStrategy,
  InMemoryDatabase,
  LocalTaskWorkerModule,
  MinaBaseLayer,
  SettlementModule,
  TaskWorkerModulesRecord,
  VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";
import { PrivateKey, PublicKey } from "o1js";
import {
  settlementSequencerModules,
  settlementSequencerModulesConfig,
} from "..";

export const taskModules = {
  ...VanillaTaskWorkerModules.allTasks(),
} satisfies TaskWorkerModulesRecord;

export const taskModulesConfig = {
  ...VanillaTaskWorkerModules.defaultConfig(),
} satisfies ModulesConfig<typeof taskModules>;

export const workerModules = {
  Database: InMemoryDatabase,
  BaseLayer: MinaBaseLayer,
  SettlementModule: SettlementModule,
  FeeStrategy: ConstantFeeStrategy,
  TaskQueue: BullQueue,
  LocalTaskWorkerModule: LocalTaskWorkerModule.from(taskModules),
};

export const workerModulesConfig = {
  Database: {},
  BaseLayer: settlementSequencerModulesConfig.BaseLayer,
  SettlementModule: settlementSequencerModulesConfig.SettlementModule,
  FeeStrategy: settlementSequencerModulesConfig.FeeStrategy,
  TaskQueue: {
    redis: {
      host: process.env.REDIS_HOST!,
      port: Number(process.env.REDIS_PORT)!,
      password: process.env.REDIS_PASSWORD!,
    },
  },
  LocalTaskWorkerModule: taskModulesConfig,
} satisfies ModulesConfig<typeof workerModules>;
