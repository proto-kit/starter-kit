import { Processor, DatabasePruneModule } from "@proto-kit/processor";
import { Startable } from "@proto-kit/deployment";
import { config, databaseModule, modules } from "../../processor";
import { Arguments } from "../../start";

export const processor = Processor.from({
  modules: {
    Database: databaseModule,
    DatabasePruneModule: DatabasePruneModule,
    ...modules,
  },
});

export default async (args: Arguments): Promise<Startable> => {
  processor.configurePartial({
    ...config,
    Database: {},
    DatabasePruneModule: {
      pruneOnStartup: args.pruneOnStartup,
    },
  });
  return processor;
};
