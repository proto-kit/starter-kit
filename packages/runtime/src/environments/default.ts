import { Runtime } from "@proto-kit/module";
import { Balances } from "../modules/balances";
import { ModulesConfig } from "@proto-kit/common";
import * as Vanilla from "../modules/vanilla";
export * as Balances from "../modules/balances";
export const modules = {
  ...Vanilla.modules,
  Balances,
};

export const config: ModulesConfig<typeof modules> = {
  ...Vanilla.defaultConfig,
};

export default async () => {
  return { modules, config };
};
