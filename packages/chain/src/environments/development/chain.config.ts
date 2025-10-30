import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
    AppChain,
    DatabasePruneModule,
    LocalTaskWorkerModule,
    Sequencer,
    VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";
import { PrismaRedisDatabase } from "@proto-kit/persistance";
import runtime from "../../runtime";
import protocol from "../../protocol";
import {
    baseSequencerModules,
    baseSequencerModulesConfig,
    indexerSequencerModules,
    indexerSequencerModulesConfig,
    metricsSequencerModules,
    metricsSequencerModulesConfig,
} from "../../sequencer";
import { BullQueue } from "@proto-kit/deployment";
import { Arguments } from "../../start";
import { baseAppChainModules, baseAppChainModulesConfig } from "../../app-chain";
import { Startable } from "@proto-kit/common";

export const appChain = AppChain.from({
    Runtime: Runtime.from(runtime.modules),
    Protocol: Protocol.from(protocol.modules),
    Sequencer: Sequencer.from({
        // ordering of the modules matters due to dependency resolution
        Database: PrismaRedisDatabase,
        ...metricsSequencerModules,
        TaskQueue: BullQueue,
        LocalTaskWorkerModule: LocalTaskWorkerModule.from(
            VanillaTaskWorkerModules.withoutSettlement()
        ),
        ...baseSequencerModules,
        ...indexerSequencerModules,
        DatabasePruneModule,
    }),
    ...baseAppChainModules,
});

export default async (args: Arguments): Promise<Startable> => {
    appChain.configurePartial({
        Runtime: runtime.config,
        Protocol: protocol.config,
        Sequencer: {
            ...baseSequencerModulesConfig,
            ...indexerSequencerModulesConfig,
            ...metricsSequencerModulesConfig,
            DatabasePruneModule: {
                pruneOnStartup: args.pruneOnStartup,
            },
            TaskQueue: {
                redis: {
                    host: process.env.REDIS_HOST!,
                    port: Number(process.env.REDIS_PORT)!,
                    password: process.env.REDIS_PASSWORD!,
                },
            },
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
            LocalTaskWorkerModule: VanillaTaskWorkerModules.defaultConfig(),
        },
        ...baseAppChainModulesConfig,
    });

    return appChain;
};
