import { startupEnvironment } from "@proto-kit/deployment";

import env from "./configurations";

await startupEnvironment(env);
