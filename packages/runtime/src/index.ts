import { Runtime, RuntimeModulesRecord } from "@proto-kit/module";
import { Balances } from "./modules/balances";
import { ModulesConfig } from "@proto-kit/common";
import * as Vanilla from "./modules/vanilla";
export * as Balances from "./modules/balances";

export const modules = {
  ...Vanilla.modules,
  Balances,
};

export const defaultConfig: ModulesConfig<typeof modules> = {
  ...Vanilla.defaultConfig,
};

export default Runtime.from({ modules, config: defaultConfig });
