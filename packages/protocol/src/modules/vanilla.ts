import { VanillaProtocolModules } from "@proto-kit/library";

/**
 * Vanilla protocol modules, including mandatory protocol modules,
 * and additional block and transaction hook modules
 */
export const modules = VanillaProtocolModules.with({});
export const defaultConfig = VanillaProtocolModules.defaultConfig();
