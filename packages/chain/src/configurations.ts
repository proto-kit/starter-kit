import { Environments } from "@proto-kit/deployment";
import { log } from "@proto-kit/common";

import developmentEnvironment from "./environments/development";
import inMemoryEnvironment from "./environments/inmemory";
// import serverEnvironment from "./environments/server";

const env = Environments.from({
    // alias default -> inmemory
    default: inMemoryEnvironment,
    inmemory: inMemoryEnvironment,
    development: developmentEnvironment,
    // server: serverEnvironment
})

log.setLevel("INFO")

export default env;