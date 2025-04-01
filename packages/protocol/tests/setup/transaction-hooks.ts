/* eslint-disable @typescript-eslint/no-unused-expressions */
import { MethodIdResolver, RuntimeModulesRecord } from "@proto-kit/module";
import {
  CompileRegistry,
  ProvableMethodExecutionContext,
} from "@proto-kit/common";
import {
  Protocol,
  MandatoryProtocolModulesRecord,
  RuntimeVerificationKeyRootService,
  RuntimeMethodExecutionContext,
  BlockProverPublicInput,
  BlockProverPublicOutput,
} from "@proto-kit/protocol";
import { container } from "tsyringe";
import { VerificationKeyService } from "../../../../../framework/packages/sequencer/dist/protocol/runtime/RuntimeVerificationKeyService";
import { Runtime } from "@proto-kit/module";
import { Proof } from "o1js";

export default function setup<
  ProtocolModules extends MandatoryProtocolModulesRecord,
>(
  modules: ProtocolModules,
  areProofsEnabled = process.env.PROOFS_ENABLED === "true"
) {
  if (areProofsEnabled) {
    console.log(
      "You're running with proofs enabled, please be patient this may take a while"
    );
  }

  const ConcreteProtocol = Protocol.from({
    modules,
  });

  const protocol = new ConcreteProtocol();

  async function start() {
    protocol.create(() => container.createChildContainer());
    await protocol.start();

    protocol.dependencyContainer.register("Runtime", {
      useValue: container.resolve("Runtime"),
    });
  }

  async function initializeVkService<
    RuntimeModules extends RuntimeModulesRecord,
  >(runtime: {
    runtime: Runtime<RuntimeModules>;
    context: RuntimeMethodExecutionContext;
  }) {
    const compileRegistry = container.resolve(CompileRegistry);
    const vkService = protocol.dependencyContainer.resolve(
      VerificationKeyService
    );
    await vkService.initializeVKTree(compileRegistry.getAllArtifacts());

    const vkRootService = protocol.dependencyContainer.resolve(
      RuntimeVerificationKeyRootService
    );
    const root = vkService.getRoot();
    vkRootService.setRoot(root);
  }

  async function getRuntimeVkAttestation<
    RuntimeModules extends RuntimeModulesRecord,
  >(runtime: {
    runtime: Runtime<RuntimeModules>;
    context: RuntimeMethodExecutionContext;
  }) {
    await initializeVkService(runtime);
    const vkService = protocol.dependencyContainer.resolve(
      VerificationKeyService
    );

    const runtimeVerificationKeyAttestation = vkService.getAttestation(
      runtime.context.input!.transaction.methodId.toBigInt()
    );

    return runtimeVerificationKeyAttestation;
  }

  async function compile() {
    const compileRegistry = container.resolve(CompileRegistry);
    areProofsEnabled ? console.time("compile") : {};
    await protocol.blockProver.compile(compileRegistry);
    areProofsEnabled ? console.timeEnd("compile") : {};
  }

  async function prove() {
    const context = container.resolve(ProvableMethodExecutionContext);
    areProofsEnabled ? console.time("prove") : {};
    const proof = (await context.result.prover!()) as unknown as Promise<
      Proof<BlockProverPublicInput, BlockProverPublicOutput>
    >;
    areProofsEnabled ? console.timeEnd("prove") : {};
    return proof;
  }

  return {
    protocol,
    start,
    initializeVkService,
    getRuntimeVkAttestation,
    compile,
    prove,
  };
}
