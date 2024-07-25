import { AuroSigner, ClientAppChain } from "@proto-kit/sdk";
import runtime from "../runtime";

const appChain = ClientAppChain.fromRuntime(runtime.modules, AuroSigner);

appChain.configurePartial({
  Runtime: runtime.config,
});

appChain.configurePartial({
  GraphqlClient: {
    url: `http://${process.env.PROTOKIT_GRAPHQL_HOST}:${process.env.PROTOKIT_GRAPHQL_PORT}/graphql`,
  },
});

export const client = appChain;
