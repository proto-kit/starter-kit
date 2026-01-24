import { Processor } from "@proto-kit/processor";
import { Arguments } from "../../../start";
import { Startable } from "@proto-kit/common";
import { DefaultConfigs, DefaultModules } from "@proto-kit/stack";
import { databaseModule } from "../../processor";
import { handlers } from "../../processor/handlers";
import { resolvers } from "../../processor/api/resolvers";

const processor = Processor.from({
  Database: databaseModule,
  ...DefaultModules.processor(resolvers, handlers),
});

export default async (args: Arguments): Promise<Startable> => {
  processor.configurePartial({
    ...DefaultConfigs.processor({
      preset: "sovereign",
    }),
    Database: {},
  });
  return processor;
};
