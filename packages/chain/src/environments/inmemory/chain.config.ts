import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import {
    AppChain,
    InMemoryDatabase,
    LocalTaskQueue,
    LocalTaskWorkerModule,
    Sequencer,
    VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";
import runtime from "../../runtime";
import protocol from "../../protocol";
import { baseSequencerModules, baseSequencerModulesConfig } from "../../sequencer";
import { baseAppChainModules } from "../../app-chain";

export const appChain = AppChain.from({
    Runtime: Runtime.from(runtime.modules),
    Protocol: Protocol.from(protocol.modules),
    Sequencer: Sequencer.from({
        Database: InMemoryDatabase,
        TaskQueue: LocalTaskQueue,
        LocalTaskWorkerModule: LocalTaskWorkerModule.from(
            VanillaTaskWorkerModules.withoutSettlement()
        ),
        ...baseSequencerModules,
    }),
    ...baseAppChainModules,
});

export default async () => {
    appChain.configurePartial({
        Runtime: runtime.config,
        Protocol: protocol.config,
        Sequencer: {
            ...baseSequencerModulesConfig,
            Database: {},
            TaskQueue: {
                simulatedDuration: 0,
            },
            LocalTaskWorkerModule: VanillaTaskWorkerModules.defaultConfig(),
        },
        ...baseSequencerModulesConfig,
    });

    return appChain;
};
