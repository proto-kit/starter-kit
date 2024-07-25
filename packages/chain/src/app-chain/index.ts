import { ModulesConfig } from "@proto-kit/common";
import {
  AppChainModulesRecord,
  BlockStorageNetworkStateModule,
  InMemoryTransactionSender,
  StateServiceQueryModule,
} from "@proto-kit/sdk";

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
