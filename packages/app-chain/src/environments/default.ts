import { ModulesConfig } from "@proto-kit/common";
import {
  InMemoryTransactionSender,
  StateServiceQueryModule,
  BlockStorageNetworkStateModule,
} from "@proto-kit/sdk";

export const modules = {
  TransactionSender: InMemoryTransactionSender,
  QueryTransportModule: StateServiceQueryModule,
  NetworkStateTransportModule: BlockStorageNetworkStateModule,
};

export const config: ModulesConfig<typeof modules> = {
  TransactionSender: {},
  QueryTransportModule: {},
  NetworkStateTransportModule: {},
};

export default async () => {
  return { modules, config };
};
