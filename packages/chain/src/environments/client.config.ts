import { AuroSigner, ClientAppChain } from "@proto-kit/sdk";
import runtime from "../runtime";

const appChain = ClientAppChain.fromRuntime(runtime.modules, AuroSigner);

appChain.configurePartial({
  Runtime: runtime.config,
});

appChain.configurePartial({});

export const client = appChain;
