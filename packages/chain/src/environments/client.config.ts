import { AuroSigner, ClientAppChain, GraphqlClient } from "@proto-kit/sdk";
import runtime from "../runtime";
import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { Sequencer } from "@proto-kit/sequencer";
import { VanillaProtocolModules } from "@proto-kit/library";

const appChain = ClientAppChain.from({
    Runtime: Runtime.from(runtime.modules),
    Protocol: Protocol.from(VanillaProtocolModules.mandatoryModules({})),
    Sequencer: Sequencer.from({}),
    Signer: AuroSigner,
    GraphqlClient,
});

appChain.configurePartial({
    Runtime: runtime.config,
});

appChain.configurePartial({
    GraphqlClient: {
        url: process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL,
    },
});

export const client = appChain;
