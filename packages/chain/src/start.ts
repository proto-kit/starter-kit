import { log } from "@proto-kit/common";
import { Startable } from "@proto-kit/deployment";
import { LogLevelDesc } from "loglevel";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export interface Arguments {
  component: string;
  pruneOnStartup: boolean;
  logLevel: LogLevelDesc;
}

export type StartableFactory = (args: Arguments) => Promise<Startable>;

yargs(hideBin(process.argv))
  .command<Arguments>(
    "start [component]",
    "Start the specified app-chain component",
    (yargs) => {
      return yargs
        .env("PROTOKIT")
        .positional("component", {
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

      // For windows support, we need to parse out environment variables used in the path
      let path = replaceEnvTemplates(args.component);

      const startableFactory: StartableFactory = (await import(path)).default;
      const startable = await startableFactory(args);

      await startable.start();
    }
  )
  .parse();

function replaceEnvTemplates(str: string) {
  let temp = str;

  const envRegex = /\$[A-Z1-9_]*/;

  let m;
  while ((m = envRegex.exec(temp)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === envRegex.lastIndex) {
      envRegex.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      const envVarName = match.slice(1);
      const envVarValue = process.env[envVarName];
      if (envVarValue === undefined) {
        throw new Error(
          `Substituted environment variable ${envVarName} not found`
        );
      }
      temp = temp.replace(match, envVarValue);
    });
  }
  return temp;
}
