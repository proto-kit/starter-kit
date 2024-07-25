import { log } from "@proto-kit/common";
import { Startable } from "@proto-kit/deployment";
import { LogLevelDesc } from "loglevel";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export interface Arguments {
  appChain: string;
  pruneOnStartup: boolean;
  logLevel: LogLevelDesc;
}

export type AppChainFactory = (args: Arguments) => Promise<Startable>;

yargs(hideBin(process.argv))
  .command<Arguments>(
    "start [app-chain]",
    "Start the specified app-chain",
    (yargs) => {
      return yargs
        .env("PROTOKIT")
        .positional("appChain", {
          type: "string",
          demandOption: true,
        })
        .option("pruneOnStartup", {
          type: "boolean",
          default: false,
        })
        .option("logLevel", {
          type: "string",
          default: "info",
        });
    },
    async (args) => {
      log.setLevel(args.logLevel);

      const appChainFactory: AppChainFactory = (await import(args.appChain))
        .default;
      const appChain = await appChainFactory(args);

      await appChain.start();
    }
  )
  .parse();
