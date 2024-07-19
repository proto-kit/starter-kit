import { Environment } from "@proto-kit/deployment";
import sequencer from "./chain.config";
import worker from "./worker.config";

const developmentEnvironment = Environment.from({
  sequencer,
  worker,
});

export default developmentEnvironment;
