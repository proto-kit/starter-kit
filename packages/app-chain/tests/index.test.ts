import { Provable } from "o1js";
import { modules, defaultConfig } from "../src/index";
import setup from "./setup";

describe("index", () => {
  const { compile, runtime } = setup(modules);

  beforeEach(async () => {
    runtime.configure(defaultConfig);
  });

  it("should compile", async () => {
    await expect(compile()).resolves.not.toThrow();

    let rows = 0;
    for (const zkProgram of runtime.zkProgrammable.zkProgram) {
      const allAnalyzedMethods = await zkProgram.analyzeMethods();
      for (const [, analyzedMethods] of Object.entries(allAnalyzedMethods)) {
        rows += analyzedMethods.rows;
      }
    }

    Provable.log("Total Runtime ZkProgram rows:", rows);
  });
});
