import {
  DefaultGraphqlModules,
  GraphqlSequencerModule,
  GraphqlServer,
} from "@proto-kit/api";
import {
  SequencerModulesRecord,
  VanillaTaskWorkerModules,
} from "@proto-kit/sequencer";
import { ModulesConfig } from "@proto-kit/common";

// -- GraphQL Modules --
export const gqlSequencerModules = DefaultGraphqlModules.with({});

export const gqlSequencerModulesConfig =
  DefaultGraphqlModules.defaultConfig() satisfies ModulesConfig<
    typeof gqlSequencerModules
  >;

// -- API Sequencer Modules --
export const apiSequencerModules = {
  GraphqlServer,
  Graphql: GraphqlSequencerModule.from({
    modules: gqlSequencerModules,
  }),
} satisfies SequencerModulesRecord;

export const apiSequencerModulesConfig = {
  Graphql: gqlSequencerModulesConfig,
  GraphqlServer: {
    port: 8080,
    host: "0.0.0.0",
    graphiql: true,
  },
} satisfies ModulesConfig<typeof apiSequencerModules>;

// -- Proving task modules --
export const taskModules = VanillaTaskWorkerModules.allTasks();

export const taskModulesConfig =
  VanillaTaskWorkerModules.defaultConfig() satisfies ModulesConfig<
    typeof taskModules
  >;
