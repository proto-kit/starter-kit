import { VanillaProtocolModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";
import { DarkPoolStateModule } from "./dark-pool";
import "reflect-metadata";

const modules = VanillaProtocolModules.with({});

const config: ModulesConfig<typeof modules> = {
  ...VanillaProtocolModules.defaultConfig(),
};

export default { modules, config };
