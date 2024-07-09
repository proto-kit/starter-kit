import { Environment } from "../../../../../../framework/packages/deployment";
import serverChain from "./chain.config";
import { client } from "../client.config";

const serverEnv = Environment.from({
    sequencer: serverChain,
    client
})

export default serverEnv;