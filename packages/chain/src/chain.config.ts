import { LocalhostAppChain } from "@proto-kit/cli";
import runtime from "./runtime";
import { Runtime } from "@proto-kit/module";
import { VanillaProtocol } from "@proto-kit/protocol";

import {
  BlockProducerModule,
  InMemoryDatabase,
  LocalTaskQueue,
  LocalTaskWorkerModule,
  ManualBlockTrigger,
  NoopBaseLayer,
  PrivateMempool,
  Sequencer,
  SequencerModule,
  UnprovenProducerModule,
  sequencerModule,
} from "@proto-kit/sequencer";
import {
  BlockStorageResolver,
  GraphqlSequencerModule,
  GraphqlServer,
  MempoolResolver,
  MerkleWitnessResolver,
  NodeStatusResolver,
  QueryGraphqlModule,
  UnprovenBlockResolver,
} from "@proto-kit/api";

import {
  StateServiceQueryModule,
  BlockStorageNetworkStateModule,
} from "@proto-kit/sdk";

@sequencerModule()
class StartupScripts extends SequencerModule {
  constructor() {
    super();
  }
  async start(): Promise<void> {}
}

const appChain = LocalhostAppChain.from({
  runtime: Runtime.from(runtime),

  protocol: VanillaProtocol.from({}),

  sequencer: Sequencer.from({
    modules: {
      Database: InMemoryDatabase,
      Mempool: PrivateMempool,
      GraphqlServer,
      LocalTaskWorkerModule,
      BaseLayer: NoopBaseLayer,
      BlockProducerModule,
      UnprovenProducerModule,
      BlockTrigger: ManualBlockTrigger,
      TaskQueue: LocalTaskQueue,
      Graphql: GraphqlSequencerModule.from({
        modules: {
          MempoolResolver,
          QueryGraphqlModule,
          BlockStorageResolver,
          NodeStatusResolver,
          UnprovenBlockResolver,
          MerkleWitnessResolver,
        },
      }),
      StartupScripts: StartupScripts,
    },
  }),

  modules: {
    QueryTransportModule: StateServiceQueryModule,
    NetworkStateTransportModule: BlockStorageNetworkStateModule,
  },
});

appChain.configure({
  ...appChain.config,

  Protocol: {
    BlockProver: {},
    StateTransitionProver: {},
    AccountState: {},
    BlockHeight: {},
    LastStateRoot: {},
  },

  Sequencer: {
    Database: {},
    UnprovenProducerModule: {},
    StartupScripts: {},

    GraphqlServer: {
      port: 8080,
      host: "0.0.0.0",
      graphiql: true,
    },

    Graphql: {
      QueryGraphqlModule: {},
      MempoolResolver: {},
      BlockStorageResolver: {},
      NodeStatusResolver: {},
      MerkleWitnessResolver: {},
      UnprovenBlockResolver: {},
    },

    Mempool: {},
    BlockProducerModule: {},
    LocalTaskWorkerModule: {},
    BaseLayer: {},
    TaskQueue: {},
    BlockTrigger: {},
  },

  QueryTransportModule: {},
  NetworkStateTransportModule: {},
});

appChain.configure({
  ...appChain.config,

  Runtime: runtime.config,
});

export default appChain as any;
