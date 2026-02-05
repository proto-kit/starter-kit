import { VanillaProtocolModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";
import {
  ProtocolModulesRecord,
  SettlementContractModule,
} from "@proto-kit/protocol";

export const modules = VanillaProtocolModules.with({});

export const config: ModulesConfig<typeof modules> = {
  ...VanillaProtocolModules.defaultConfig(),
  TransactionFee: {
    ...VanillaProtocolModules.defaultConfig().TransactionFee,
    feeRecipient: process.env.PROTOKIT_TRANSACTION_FEE_RECIPIENT_PUBLIC_KEY!,
  },
} satisfies ModulesConfig<typeof modules>;

export const settlementModules = {
  SettlementContractModule: SettlementContractModule.from(
    SettlementContractModule.settlementAndBridging()
  ),
} satisfies ProtocolModulesRecord;

export const settlementModulesConfig = {
  SettlementContractModule: {
    BridgeContract: {},
    SettlementContract: {},
    DispatchContract: {
      incomingMessagesMethods: {
        deposit: "Balances.deposit",
      },
    },
  },
} satisfies ModulesConfig<typeof settlementModules>;

export default { modules, config, settlementModules, settlementModulesConfig };
