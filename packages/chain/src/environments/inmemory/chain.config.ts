import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { AppChain, InMemoryDatabase, Sequencer } from "@proto-kit/sequencer";
import runtime from "../../runtime";
import protocol from "../../protocol";
import { baseSequencerModules, baseSequencerModulesConfig } from "../../sequencer";
import { baseAppChainModules } from "../../app-chain";

export const appChain = AppChain.from({
    Runtime: Runtime.from(runtime.modules),
    Protocol: Protocol.from(protocol.modules),
    Sequencer: Sequencer.from({
        Database: InMemoryDatabase,
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
        },
        ...baseSequencerModulesConfig,
    });

    return appChain;
};
