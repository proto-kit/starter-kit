import { ClientAppChain } from "@proto-kit/sdk";
import runtime from "./runtime";

const appChain = ClientAppChain.fromRuntime(runtime.modules);

appChain.configurePartial({
  Runtime: runtime.config,
});

export const client = appChain;
