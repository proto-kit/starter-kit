import { Environment } from "@proto-kit/deployment";
import developmentChain from "./chain.config";
import worker from "./worker.config";
import { client } from "../client.config";

const developmentEnvironment = Environment.from({
    sequencer: developmentChain,
    worker,
    client
})

export default developmentEnvironment;