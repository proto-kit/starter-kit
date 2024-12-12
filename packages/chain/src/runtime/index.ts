import {
  Balance,
  VanillaRuntimeModules,
  Withdrawals,
} from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";

import { Balances } from "./modules/balances";

export const modules = VanillaRuntimeModules.with({
  Balances,
  Withdrawals,
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  Withdrawals: {},
};

export default {
  modules,
  config,
};
