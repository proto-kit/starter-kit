import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  Sequencer,
  AppChain,
  LocalTaskWorkerModule,
  VanillaTaskWorkerModules,
  SettlementProvingTask,
  SettlementCompileTask,
} from "@proto-kit/sequencer";
import { BullQueue } from "@proto-kit/deployment";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";
import { Arguments } from "../../../start";

import { ModulesConfig, Startable } from "@proto-kit/common";
import { DefaultConfigs } from "@proto-kit/stack";

const settlementEnabled = process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true";

const variants = {
  default: VanillaTaskWorkerModules.allTasks(),
  l2: VanillaTaskWorkerModules.withoutSettlement(),
  l1: {
    SettlementProvingTask,
    SettlementCompileTask,
  },
};

const variantConfigs = {
  default: VanillaTaskWorkerModules.defaultConfig(),
  l2: VanillaTaskWorkerModules.defaultConfig(),
  l1: {
    SettlementProvingTask: {},
    SettlementCompileTask: {},
  } satisfies ModulesConfig<(typeof variants)["l1"]>,
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
    ...(settlementEnabled ? protocol.settlementModules : {}),
  }),
  Sequencer: Sequencer.from({
    TaskQueue: BullQueue,
    LocalTaskWorkerModule: LocalTaskWorkerModule.from(variants[variant]),
  }),
});

export default async (args: Arguments): Promise<Startable> => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...(settlementEnabled ? protocol.settlementModulesConfig : {}),
    },
    Sequencer: {
      ...DefaultConfigs.redisTaskQueue({
        preset: "sovereign",
        overrides: { redisDb: 1 },
      }),
      ...variantConfigs[variant],
    },
  });

  return appChain;
};
