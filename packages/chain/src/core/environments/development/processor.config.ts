import { DatabasePruneModule, Processor } from "@proto-kit/processor";
import { databaseModule } from "../../processor";
import { Arguments } from "../../../start";
import { Startable } from "@proto-kit/common";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";
import { resolvers } from "../../processor/api/resolvers";
import { handlers } from "../../processor/handlers";

const processor = Processor.from({
  Database: databaseModule,
  DatabasePruneModule: DatabasePruneModule,
  ...DefaultModules.processor(resolvers, handlers),
});

export default async (args: Arguments): Promise<Startable> => {
  processor.configurePartial({
    ...DefaultConfigs.processor({
      preset: "development",
    }),
    Database: {},
    DatabasePruneModule: {
      pruneOnStartup: args.pruneOnStartup,
    },
  });
  return processor;
};
