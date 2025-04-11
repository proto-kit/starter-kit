import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import start from "../src";
import { ArgsRecord } from "@repo/utils/src/import-environment";
import { log } from "@proto-kit/common";
import { LogLevelDesc } from "loglevel";

await yargs(hideBin(process.argv))
  .command(
    "start",
    "Start the current component (sequencer, indexer, processor, ...)",
    (yargs) => {
      yargs
        .option("log-level", {
          describe: "The log level to use",
          type: "string",
          default: "info",
        })
        .positional("args", {
          describe: "Additional arguments",
          type: "string",
          array: true,
        })
        .parserConfiguration({
          "unknown-options-as-args": false, // Treat unknown options as named args
          "populate--": true,
          "strip-dashed": true, // Converts --my-arg to myArg
        });
    },
    async (argv) => {
      // set log level
      log.setLevel(argv.logLevel as LogLevelDesc);
      // start the component
      await start(argv as ArgsRecord);
    }
  )
  .strict(false)
  .parse();
