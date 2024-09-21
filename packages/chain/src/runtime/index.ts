import { ModulesConfig } from "@proto-kit/common";
import { Balance, UInt64, VanillaRuntimeModules } from "@proto-kit/library";

import { Balances } from "./modules/balances";
import { DarkPool } from "./modules/dark-pool";
import { Faucet } from "./modules/faucet";
import { TokenRegistry } from "./modules/tokens";

export const modules = VanillaRuntimeModules.with({
  Balances,
  TokenRegistry,
  Faucet,
  DarkPool,
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  TokenRegistry: {
    maxTokens: UInt64.from(100),
  },
  DarkPool: {
    feeDivider: 1000n,
    fee: 3n,
    minimumLiquidity: Balance.from(1),
  },
  Faucet: {},
};

export default {
  modules,
  config,
};
