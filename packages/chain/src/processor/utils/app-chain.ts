import { TestingAppChain } from "@proto-kit/sdk";
import {
  modules as runtimeModules,
  config as runtimeConfig,
} from "./../../runtime";

export const appChain = TestingAppChain.fromRuntime({
  ...runtimeModules,
});

appChain.configurePartial({
  Runtime: runtimeConfig,
});

await appChain.start();
