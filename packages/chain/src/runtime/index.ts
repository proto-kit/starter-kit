import { Balance, VanillaRuntimeModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";

import { Balances } from "./modules/balances";
import { Withdrawals } from "./modules/withdrawals";

export const modules = VanillaRuntimeModules.with({
  Balances,
  Withdrawals,
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000 * 1e9),
  },
  Withdrawals: {},
};

export default {
  modules,
  config,
};
