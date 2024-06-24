import { log } from "@proto-kit/common";
import { startupEnvironment } from "@proto-kit/deployment";

import env from "./configurations";

log.setLevel("DEBUG")

await startupEnvironment(env);
