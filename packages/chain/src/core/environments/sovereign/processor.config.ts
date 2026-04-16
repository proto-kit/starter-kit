import {
  Processor,
  TimedProcessorTrigger,
  BlockFetching,
  HandlersExecutor,
  ResolverFactoryGraphqlModule,
} from "@proto-kit/processor";
import { GraphqlSequencerModule } from "@proto-kit/api";
import { databaseModule } from "../../processor";
import { Arguments } from "../../../start";
import { Startable } from "@proto-kit/common";
import { resolvers } from "../../processor/api/resolvers";
import { handlers } from "../../processor/handlers";

const processor = Processor.from({
  Database: databaseModule,
  GraphqlSequencerModule: GraphqlSequencerModule.from({
    ResolverFactory: ResolverFactoryGraphqlModule.from(resolvers),
  }),
  HandlersExecutor: HandlersExecutor.from(handlers),
  BlockFetching,
  Trigger: TimedProcessorTrigger,
});

export default async (args: Arguments): Promise<Startable> => {
  processor.configurePartial({
    HandlersExecutor: {},
    BlockFetching: {
      url: `http://${process.env.PROTOKIT_PROCESSOR_INDEXER_GRAPHQL_HOST ?? "0.0.0.0"}:${process.env.PROTOKIT_INDEXER_GRAPHQL_PORT ?? 8081}`,
    },
    Trigger: {
      interval: 2000,
    },
    GraphqlSequencerModule: {
      ResolverFactory: {},
      containerConfig: {
        port: Number(process.env.PROTOKIT_PROCESSOR_GRAPHQL_PORT ?? 8082),
        host: process.env.PROTOKIT_PROCESSOR_GRAPHQL_HOST ?? "0.0.0.0",
        graphiql: true,
      },
    },
    Database: {},
  });
  return processor;
};
