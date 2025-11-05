import { Processor, DatabasePruneModule } from "@proto-kit/processor";
import { config, databaseModule, modules } from "../../processor";
import { Arguments } from "../../start";
import { Startable } from "@proto-kit/common";

export const processor = Processor.from({
    Database: databaseModule,
    DatabasePruneModule: DatabasePruneModule,
    ...modules,
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
