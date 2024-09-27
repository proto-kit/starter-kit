import { Processor } from "@proto-kit/processor";
import { Startable } from "@proto-kit/deployment";
import { config, modules } from "../../processor";
import { Arguments } from "../../start";

export const processor = Processor.from({
  modules,
});

export default async (args: Arguments): Promise<Startable> => {
  processor.configurePartial({
    ...config,
    // DatabasePruneModule: {
    //   pruneOnStartup: args.pruneOnStartup,
    // },
  });
  return processor;
};
