import {
  AuroSigner,
  ClientAppChain,
  GraphqlBlockExplorerTransportModule,
  GraphqlClient,
  GraphqlNetworkStateTransportModule,
  GraphqlQueryTransportModule,
  GraphqlTransactionSender,
} from "@proto-kit/sdk";
import runtime from "../../runtime";
import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { Sequencer } from "@proto-kit/sequencer";
import { VanillaProtocolModules } from "@proto-kit/library";

const appChain = ClientAppChain.from({
  Runtime: Runtime.from(runtime.modules),
  Protocol: Protocol.from(VanillaProtocolModules.mandatoryModules({})),
  Sequencer: Sequencer.from({}),
  Signer: AuroSigner,
  GraphqlClient,
  QueryTransportModule: GraphqlQueryTransportModule,
  NetworkStateTransportModule: GraphqlNetworkStateTransportModule,
  BlockExplorerTransportModule: GraphqlBlockExplorerTransportModule,
  TransactionSender: GraphqlTransactionSender,
});

appChain.configure({
  Runtime: runtime.config,
  GraphqlClient: {
    url: process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL!,
  },
  Protocol: VanillaProtocolModules.defaultConfig(),
  Signer: {},
  Sequencer: {},
  QueryTransportModule: {},
  NetworkStateTransportModule: {},
  TransactionSender: {},
  BlockExplorerTransportModule: {},
});

export const client = appChain;
