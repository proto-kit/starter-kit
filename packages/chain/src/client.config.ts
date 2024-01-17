import { ClientAppChain } from "@proto-kit/sdk";
import runtime from "./runtime";
import { UInt64 } from "o1js";

const appChain = ClientAppChain.fromRuntime(runtime);

appChain.configure({
  Runtime: {
    Balances: {
      totalSupply: UInt64.from(10_000),
    },
  },
});

export const client = appChain;
