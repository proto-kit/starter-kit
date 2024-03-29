import { LocalhostAppChain } from "@proto-kit/cli";
import runtime from "./runtime";

const appChain = LocalhostAppChain.fromRuntime(runtime.modules);

appChain.configure({
  ...appChain.config,
  Runtime: runtime.config,
});

// TODO: remove temporary `as any` once `error TS2742` is resolved
export default appChain as any;
