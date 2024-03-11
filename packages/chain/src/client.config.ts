import { ClientAppChain } from "@proto-kit/sdk";
import runtime from "./runtime";

const appChain = ClientAppChain.fromRuntime(runtime);

appChain.configure({
  Runtime: runtime.config,
});

export const client = appChain;
