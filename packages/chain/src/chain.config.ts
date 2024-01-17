import { LocalhostAppChain } from "@proto-kit/cli";
import runtime from "./runtime";
import { UInt64 } from "o1js";

const appChain = LocalhostAppChain.fromRuntime(runtime);

appChain.configure({
  ...appChain.config,

  Runtime: {
    Balances: {
      totalSupply: UInt64.from(10_000),
    },
  },
});

export default appChain as any;
