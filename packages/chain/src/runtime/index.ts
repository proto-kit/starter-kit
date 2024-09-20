import { Balance, UInt64, VanillaRuntimeModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";

import { Balances } from "./modules/balances";
import { TokenRegistry } from "./modules/tokens";
import { DarkPool } from "./modules/darkpool";
import { Faucet } from "./modules/faucet";

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
  },
  Faucet: {},
};

export default {
  modules,
  config,
};
