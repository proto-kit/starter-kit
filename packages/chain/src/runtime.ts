import { UInt64 } from "o1js";
import { Balances } from "./balances";
import { runtimeModule } from "@proto-kit/module";

@runtimeModule()
export class CustomBalances extends Balances {}

export default {
  modules: {
    Balances,
    CustomBalances,
  },
  config: {
    Balances: {
      totalSupply: UInt64.from(10_000),
    },
    CustomBalances: {
      totalSupply: UInt64.from(10_000),
    },
  },
};
