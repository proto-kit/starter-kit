import { Environment } from "@proto-kit/deployment";
import inMemoryChain from "./chain.config";
import { client } from "../client.config";

const inMemoryEnvironment = Environment.from({
    sequencer: inMemoryChain,
    client
})

export default inMemoryEnvironment;