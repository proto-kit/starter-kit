import { TransactionFeeHook } from "./../modules/transaction-fee-hook";
import * as Vanilla from "./../modules/vanilla";
import { ModulesConfig } from "@proto-kit/common";
import { Protocol } from "@proto-kit/protocol";

export const modules = {
  ...Vanilla.modules,
  TransactionFee: TransactionFeeHook,
};

export const config: ModulesConfig<typeof modules> = {
  ...Vanilla.defaultConfig,
  TransactionFee: {
    tokenId: 0n,
    baseFee: 1n,
    perWeightUnitFee: 0n,
    // Configures who receives the transaction fees collected by the protocol
    feeRecipient: process.env.PROTOKIT_TRANSACTION_FEE_RECIPIENT!,
    methods: {},
  },
};

export default async () => {
  return { modules, config };
};
