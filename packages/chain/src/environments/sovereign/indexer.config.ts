import { Indexer } from "@proto-kit/indexer";
import { config, modules } from "../../indexer";
import { Arguments } from "../../start";
import { Startable } from "@proto-kit/common";

export const indexer = Indexer.from(modules);

export default async (args: Arguments): Promise<Startable> => {
    indexer.configurePartial({
        ...config,
    });
    return indexer;
};
