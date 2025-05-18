import { ModulesConfig, ModulesRecord } from "@proto-kit/common";

export type ArgsRecord = Record<string, unknown | undefined>;
export type Environment<Modules extends ModulesRecord> = {
  modules: Modules;
  config: ModulesConfig<Modules>;
};
export type EnvironmentFactory<Modules extends ModulesRecord> = (
  args: Record<string, unknown | undefined>
) => Promise<Environment<Modules>>;

export async function importEnvironment<ModuleType extends ModulesRecord>(
  packageName: string,
  args: Record<string, unknown | undefined> = {},
  environment: string = process.env.PROTOKIT_ENV || "default"
): Promise<Environment<ModuleType>> {
  console.log("Importing environment", packageName, environment);

  try {
    const environmentFile = `@repo/${packageName}/src/environments/${environment}`;
    const environmentModule = await import(environmentFile);
    const environmentFactory = environmentModule.default;
    return environmentFactory(args);
  } catch {
    console.warn(
      `${packageName} environment "${environment}" not found, using "default" instead`
    );
    const defaultEnvironmentFile = `@repo/${packageName}/src/environments/default`;
    const defaultEnvironmentModule = await import(defaultEnvironmentFile);
    const defaultEnvironmentFactory = defaultEnvironmentModule.default;

    return defaultEnvironmentFactory(args);
  }
}
