import { Environment, Environments } from "@proto-kit/deployment";
import developmentChain from "./environments/development/chain.config";
import localChain from "./environments/local/chain.config";
import serverChain from "./environments/server/chain.config";
import { client } from "./environments/client.config";
import { log } from "@proto-kit/common";
import worker from "./environments/local/worker.config";

const env = Environments.from({
    default: Environment.from({
        sequencer: developmentChain,
        client
    }),
    local: Environment.from({
        sequencer: localChain,
        worker,
        client
    }),
    server: Environment.from({
        sequencer: serverChain,
        client
    })
})

log.setLevel("INFO")

export default env;