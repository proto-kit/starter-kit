import { ModulesConfig } from "@proto-kit/common";
import {
  BlockStorageNetworkStateModule,
  InMemoryTransactionSender,
  StateServiceQueryModule,
} from "@proto-kit/sdk";
import { AppChainModulesRecord } from "@proto-kit/sequencer";

export const baseAppChainModules = {
  TransactionSender: InMemoryTransactionSender,
  QueryTransportModule: StateServiceQueryModule,
  NetworkStateTransportModule: BlockStorageNetworkStateModule,
} satisfies AppChainModulesRecord;

export const baseAppChainModulesConfig = {
  QueryTransportModule: {},
  NetworkStateTransportModule: {},
  TransactionSender: {},
} satisfies ModulesConfig<typeof baseAppChainModules>;
