import { Processor, DatabasePruneModule } from "@proto-kit/processor";
import { databaseModule } from "../../processor";
import { Arguments } from "../../../start";
import { Startable } from "@proto-kit/common";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";
import { resolvers } from "../../processor/api/resolvers";
import { handlers } from "../../processor/handlers";

export const processor = Processor.from(
  DefaultModules.processor(resolvers, handlers, {
    overrides: {
      Database: databaseModule,
      DatabasePruneModule,
    },
  })
);

export default async (args: Arguments): Promise<Startable> => {
  processor.configurePartial({
    ...DefaultConfigs.processor({
      preset: "development",
      overrides: {
        Database: {},
        DatabasePruneModule: {
          pruneOnStartup: args.pruneOnStartup,
        },
      },
    }),
  });
  return processor;
};
