import { AppChain, AppChainModulesRecord } from "@proto-kit/sdk";
import { Runtime, RuntimeModulesRecord } from "@proto-kit/module";
import {
  MandatoryProtocolModulesRecord,
  Protocol,
  ProtocolModulesRecord,
} from "@proto-kit/protocol";
import { Sequencer, SequencerModulesRecord } from "@proto-kit/sequencer";
import {
  ArgsRecord,
  importEnvironment,
} from "@repo/utils/src/import-environment";

export default async function start(args: ArgsRecord) {
  const sequencer = await importEnvironment<SequencerModulesRecord>(
    "sequencer",
    args
  );

  const runtime = await importEnvironment<RuntimeModulesRecord>(
    "runtime",
    args
  );

  const protocol = await importEnvironment<
    ProtocolModulesRecord & MandatoryProtocolModulesRecord
  >("protocol");

  const appChain = await importEnvironment<AppChainModulesRecord>(
    "app-chain",
    args
  );

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
}
