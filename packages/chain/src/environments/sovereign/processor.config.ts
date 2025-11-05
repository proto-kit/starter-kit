import { Processor } from "@proto-kit/processor";
import { config, databaseModule, modules } from "../../processor";
import { Arguments } from "../../start";
import { Startable } from "@proto-kit/common";

export const processor = Processor.from({
    Database: databaseModule,
    ...modules,
});

export default async (args: Arguments): Promise<Startable> => {
    processor.configurePartial({
        ...config,
        Database: {},
    });
    return processor;
};
