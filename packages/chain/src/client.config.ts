import { ClientAppChain } from "@proto-kit/sdk";
import runtime from "./runtime";

const appChain = ClientAppChain.fromRuntime(runtime.modules);

appChain.configurePartial({
  Runtime: runtime.config,
  GraphqlClient: {
    url:
      process.env.NEXT_PUBLIC_PROTOKIT_URL || "http://localhost:8080/graphql",
  },
});

export const client = appChain;
