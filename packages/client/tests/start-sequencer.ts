import { AppChain, AppChainModulesRecord } from "@proto-kit/sdk";
import {
  MandatoryProtocolModulesRecord,
  Protocol,
  ProtocolModulesRecord,
} from "@proto-kit/protocol";
import { Sequencer, SequencerModulesRecord } from "@proto-kit/sequencer";
import { Runtime, RuntimeModulesRecord } from "@proto-kit/module";
import { importEnvironment } from "@repo/utils/src/import-environment";

const sequencer = await importEnvironment<SequencerModulesRecord>("sequencer");

const runtime = await importEnvironment<RuntimeModulesRecord>("runtime");

const protocol = await importEnvironment<
  ProtocolModulesRecord & MandatoryProtocolModulesRecord
>("protocol");

const appChain = await importEnvironment<AppChainModulesRecord>("app-chain");

const startable = AppChain.from({
  Runtime: Runtime.from({ modules: runtime.modules }),
  Protocol: Protocol.from({ modules: protocol.modules }),
  Sequencer: Sequencer.from({ modules: sequencer.modules }),
  modules: appChain.modules,
});

startable.configure({
  Runtime: runtime.config,
  Protocol: protocol.config,
  Sequencer: sequencer.config,
  ...appChain.config,
});

await startable.start();
