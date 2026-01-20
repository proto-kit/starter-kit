import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import runtime from "../../../runtime";
import protocol from "../../../protocol";
import { DefaultAppChain, DefaultAppChainConfig } from "@proto-kit/stack";

export const appChain = DefaultAppChain.inmemory(
  runtime.modules,
  protocol.modules
);

export default async () => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: protocol.config,
    ...DefaultAppChainConfig.inmemory(),
  });

  return appChain;
};
