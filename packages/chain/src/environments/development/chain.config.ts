import runtime from "../../runtime";
import protocol from "../../protocol";
import { LocalhostAppChainModules } from "@proto-kit/cli";
import { AppChain } from "@proto-kit/sdk";

const appChain = AppChain.from(
  LocalhostAppChainModules.from(runtime.modules, protocol.modules, {}, {})
);

appChain.configurePartial({
  ...LocalhostAppChainModules.defaultConfig(),
  Runtime: {
    ...LocalhostAppChainModules.defaultConfig().Runtime,
    // Config for Balances clashes, therefore we have to also provide it here
    ...runtime.config,
  },
  Protocol: {
    ...LocalhostAppChainModules.defaultConfig().Protocol,
    ...protocol.config,
  },
});

appChain.configurePartial({
  Runtime: runtime.config,
  Protocol: protocol.config,
});

// TODO: remove temporary `as any` once `error TS2742` is resolved
export default appChain;
