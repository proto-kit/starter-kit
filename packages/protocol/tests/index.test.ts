import "reflect-metadata";
import setup from "./setup/transaction-hooks";
import setupRuntime from "@repo/runtime/tests/setup";
import { modules, defaultConfig } from "../src";
import {
  modules as runtimeModules,
  defaultConfig as runtimeDefaultConfig,
} from "@repo/runtime/src/index";

describe("index", () => {
  const runtime = setupRuntime(runtimeModules);
  const { protocol, start, compile, initializeVkService } = setup(modules);

  beforeAll(async () => {
    runtime.runtime.configure(runtimeDefaultConfig);
    protocol.configure(defaultConfig);
    await start();
    console.log("compiling runtime");
    await runtime.compile();
  });

  it("should compile", async () => {
    await initializeVkService(runtime);
    console.log("compiling protocol");
    await expect(compile()).resolves.not.toThrow();
  });
});
