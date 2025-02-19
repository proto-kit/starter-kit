import "reflect-metadata";
import { container } from "tsyringe";
import {
  InMemoryStateService,
  MethodIdResolver,
  MethodParameterEncoder,
  Runtime,
} from "@proto-kit/module";
import { Field, UInt64 as O1UInt64, Poseidon, Proof, PublicKey } from "o1js";
import {
  MethodPublicOutput,
  NetworkState,
  RuntimeMethodExecutionContext,
  RuntimeMethodExecutionDataStruct,
  RuntimeTransaction,
  StateServiceProvider,
} from "@proto-kit/protocol";
import { RuntimeModulesRecord } from "@proto-kit/module";
import { CompileRegistry } from "@proto-kit/common";

/**
 * Creates a runtime instance and provides utilities for testing.
 *
 * @param modules - The modules to be used in the runtime.
 * @param areProofsEnabled - Whether proofs are enabled.
 * @returns Testing utilities for runtime testing.
 */
export default function setup<RuntimeModules extends RuntimeModulesRecord>(
  modules: RuntimeModules,
  areProofsEnabled = false
) {
  if (process.env.PROOFS_ENABLED === "true") {
    console.log(
      "You're running with proofs enabled, please be patient this may take a while"
    );
  }

  // runtime from provided modules
  const ConcreteRuntime = Runtime.from({
    modules,
  });

  // create the runtime instance and configure its dependency container
  const runtime = new ConcreteRuntime();
  runtime.create(() => container);

  // register itself in the dependency container, so that runtime modules can access it
  runtime.dependencyContainer.register("Runtime", {
    useValue: runtime,
  });

  // compilation & proving
  runtime.dependencyContainer.register("AreProofsEnabled", {
    useValue: {
      areProofsEnabled,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setAreProofsEnabled: (areProofsEnabled: boolean) => {},
    },
  });

  /**
   * Compiles all the runtime circuits
   */
  async function compile() {
    const compileRegistry = container.resolve(CompileRegistry);
    console.time("compile");
    await runtime.compile(compileRegistry);
    console.timeEnd("compile");
  }

  // state service & state service provider setup
  const stateService = new InMemoryStateService();
  const stateServiceProvider = new StateServiceProvider();
  container.register("StateServiceProvider", {
    useValue: stateServiceProvider,
  });
  stateServiceProvider.setCurrentStateService(stateService);

  /**
   * Clears the state service
   */
  const clearState = () => {
    stateService.values = {};
  };

  // execution context setup
  const context = container.resolve(RuntimeMethodExecutionContext);

  /**
   * Clears the execution context
   */
  function clearContext() {
    context.setup(
      new RuntimeMethodExecutionDataStruct({
        transaction: RuntimeTransaction.fromTransaction({
          methodId: Field(0),
          argsHash: Field(0),
          nonce: O1UInt64.from(0),
          sender: PublicKey.empty(),
        }),
        networkState: NetworkState.empty(),
      })
    );
  }

  function getMethodId(moduleName: string, methodName: string) {
    return Field(
      runtime.dependencyContainer
        .resolve(MethodIdResolver)
        .getMethodId(moduleName, methodName)
    );
  }

  /**
   * Proves the current execution context with information captured during prior runtime method execution.
   * @returns The proof of the runtime method execution.
   */
  async function prove() {
    console.time("prove");
    const { moduleName, methodName, args } = context.current().result;
    // TODO: extract Appchain.transaction logic so it can be reused here
    context.input!.transaction.methodId = getMethodId(moduleName!, methodName!);
    context.input!.transaction.argsHash = Poseidon.hash(
      MethodParameterEncoder.fromMethod(
        runtime.resolve(moduleName as any),
        methodName!
      ).encode(args!).fields
    );

    const proof = (await context.result.prover!()) as unknown as Promise<
      Proof<undefined, MethodPublicOutput>
    >;
    console.timeEnd("prove");

    return proof;
  }

  return {
    runtime,
    stateService,
    stateServiceProvider,
    clearState,
    context,
    compile,
    getMethodId,
    prove,
    clearContext,
  };
}
