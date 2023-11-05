import { UInt64 } from "o1js";
import { Balances } from "./balances";

export default {
  modules: {
    Balances,
  },
  config: {
    Balances: {
      totalSupply: UInt64.from(100000),
    },
  },
};
