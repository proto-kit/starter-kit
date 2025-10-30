import { Indexer } from "@proto-kit/indexer";
import { config, modules } from "../../indexer";
import { Arguments } from "../../start";
import { DatabasePruneModule } from "@proto-kit/sequencer";
import { Startable } from "@proto-kit/common";

export const indexer = Indexer.from({
    ...modules,
    DatabasePruneModule,
});

export default async (args: Arguments): Promise<Startable> => {
    indexer.configurePartial({
        ...config,
        DatabasePruneModule: {
            pruneOnStartup: args.pruneOnStartup,
        },
    });
    return indexer;
};
