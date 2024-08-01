import { AppChain } from "@proto-kit/sdk";
import { Runtime } from "@proto-kit/module";
import { Protocol } from "@proto-kit/protocol";
import { InMemoryDatabase, Sequencer } from "@proto-kit/sequencer";
import runtime from "../../runtime";
import protocol from "../../protocol";
import {
  baseSequencerModules,
  baseSequencerModulesConfig,
} from "../../sequencer";
import { baseAppChainModules } from "../../app-chain";

export const appChain = AppChain.from({
  Runtime: Runtime.from({
    modules: runtime.modules,
  }),
  Protocol: Protocol.from({
    modules: protocol.modules,
  }),
  Sequencer: Sequencer.from({
    modules: {
      Database: InMemoryDatabase,
      ...baseSequencerModules,
    },
  }),
  modules: baseAppChainModules,
});

export default async () => {
  appChain.configurePartial({
    Runtime: runtime.config,
    Protocol: protocol.config,
    Sequencer: {
      ...baseSequencerModulesConfig,
      Database: {},
    },
    ...baseSequencerModulesConfig,
  });

  return appChain;
};
