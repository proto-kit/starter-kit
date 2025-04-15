import { RuntimeModulesRecord } from "@proto-kit/module";
import { ClientAppChain, InMemorySigner } from "@proto-kit/sdk";
import { importEnvironment } from "@repo/utils/src/import-environment";

const runtime = await importEnvironment<RuntimeModulesRecord>("runtime");
const client = ClientAppChain.fromRuntime(runtime.modules, InMemorySigner);

client.configurePartial({
  Runtime: runtime.config,
  GraphqlClient: {
    url: `${process.env.PROTOKIT_GRAPHQL_PROTOCOL}://${process.env.PROTOKIT_GRAPHQL_HOST}:${process.env.PROTOKIT_GRAPHQL_PORT}${process.env.PROTOKIT_GRAPHQL_PATH}`,
  },
});

export default client;
