import { Indexer } from "@proto-kit/indexer";
import { Arguments } from "../../../start";
import { DatabasePruneModule } from "@proto-kit/sequencer";
import { Startable } from "@proto-kit/common";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";

export const indexer = Indexer.from({
  ...DefaultModules.indexer({
    overrides: {
      DatabasePruneModule,
    },
  }),
});

export default async (args: Arguments): Promise<Startable> => {
  indexer.configurePartial({
    ...DefaultConfigs.indexer({
      preset: "development",
      overrides: {
        DatabasePruneModule: {
          pruneOnStartup: args.pruneOnStartup,
        },
      },
    }),
  });
  return indexer;
};