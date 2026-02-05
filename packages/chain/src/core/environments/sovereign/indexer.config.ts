import { Indexer } from "@proto-kit/indexer";
import { Arguments } from "../../../start";
import { Startable } from "@proto-kit/common";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";

const indexer = Indexer.from({
  ...DefaultModules.indexer(),
});

export default async (args: Arguments): Promise<Startable> => {
  indexer.configurePartial({
    ...DefaultConfigs.indexer({
      preset: "sovereign",
      overrides: {
        redisDb: 1,
      },
    }),
  });
  return indexer;
};
