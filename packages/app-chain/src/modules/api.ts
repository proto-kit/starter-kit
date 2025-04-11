import {
  GraphqlSequencerModule,
  GraphqlServer,
  VanillaGraphqlModules,
} from "@proto-kit/api";
import { ModulesConfig } from "@proto-kit/common";

export const modules = {
  GraphqlServer,
  Graphql: GraphqlSequencerModule.from({
    modules: VanillaGraphqlModules.with({}),
  }),
};

export const config: ModulesConfig<typeof modules> = {
  GraphqlServer: {
    port: parseInt(process.env.PROTOKIT_GRAPHQL_PORT!),
    host: process.env.PROTOKIT_GRAPHQL_HOST!,
    graphiql: process.env.PROTOKIT_GRAPHQL_GRAPHIQL! === "true",
  },
  Graphql: VanillaGraphqlModules.defaultConfig(),
};
