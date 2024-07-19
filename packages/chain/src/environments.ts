import { Environments } from "@proto-kit/deployment";

import developmentEnvironment from "./environments/development";
import inMemoryEnvironment from "./environments/inmemory";

const env = Environments.from({
  // alias default -> inmemory
  default: inMemoryEnvironment,
  inmemory: inMemoryEnvironment,
  development: developmentEnvironment,
});

export default env;
