import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
  Sequencer,
  AppChain,
  WorkerModule,
  VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";
import { BullQueue } from "@proto-kit/deployment";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";
import { Arguments } from "../../../start";

import { log, Startable } from "@proto-kit/common";

const settlementEnabled = process.env.PROTOKIT_SETTLEMENT_ENABLED! === "true";

const appChain = AppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from({
    ...protocol.modules,
    ...(settlementEnabled ? protocol.settlementModules : {}),
  }),
  Sequencer: Sequencer.from({
    TaskQueue: BullQueue,
    WorkerModule: WorkerModule.from(
      VanillaTaskWorkerModules.allTasks()
    ),
    ...(!settlementEnabled
      ? {
          WorkerModule: WorkerModule.from(
            VanillaTaskWorkerModules.withoutSettlement()
          ),
        }
      : {}),
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

  log.setLevel("DEBUG");

  return appChain;
};
