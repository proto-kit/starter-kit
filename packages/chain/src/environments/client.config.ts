import { AuroSigner, ClientAppChain } from "@proto-kit/sdk";
import runtime from "../runtime";

const appChain = ClientAppChain.fromRuntime(runtime.modules, AuroSigner);

appChain.configurePartial({
  Runtime: runtime.config,
});

appChain.configurePartial({
  GraphqlClient: {
    url: process.env.NEXT_PUBLIC_PROTOKIT_URL || "http://127.0.0.1:8080/graphql",
  },
});

export const client = appChain;
