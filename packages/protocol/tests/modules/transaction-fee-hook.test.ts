import "reflect-metadata";
import { container, inject, injectable } from "tsyringe";
import { TransactionFeeHook } from "../../src/modules/transaction-fee-hook";
import {
  MethodIdResolver,
  Runtime,
  RuntimeModulesRecord,
} from "@proto-kit/module";
import {
  Balances,
  UInt64,
  TokenId,
  VanillaProtocolModules,
  Balance,
  BalancesKey,
} from "@proto-kit/library";
import {
  Field,
  PrivateKey,
  Proof,
  PublicKey,
  UInt64 as O1JSUInt64,
  Provable,
  Signature,
  Poseidon,
} from "o1js";
import {
  AfterTransactionHookArguments,
  BeforeTransactionHookArguments,
  BlockProvable,
  BlockProver,
  BlockProverPublicInput,
  BlockProverSingleTransactionExecutionData,
  DynamicRuntimeProof,
  MethodPublicOutput,
  NetworkState,
  Protocol,
  ProvableTransactionHook,
  PublicKeyOption,
  RuntimeMethodExecutionContext,
  RuntimeMethodExecutionData,
  RuntimeTransaction,
  RuntimeVerificationKeyAttestation,
  RuntimeVerificationKeyRootService,
  SignedTransaction,
  UInt64Option,
} from "@proto-kit/protocol";

import {
  defaultConfig as runtimeDefaultConfig,
  modules as runtimeModules,
} from "@repo/runtime";
import setupRuntime from "@repo/runtime/tests/setup";
import { CompileRegistry, MAX_FIELD } from "@proto-kit/common";
import { VerificationKeyService } from "../../../../../framework/packages/sequencer/dist/protocol/runtime/RuntimeVerificationKeyService";

import setup from "../setup/transaction-hooks";

describe("TransactionFeeHook", () => {
  let { protocol, start, getRuntimeVkAttestation, compile } = setup({
    ...VanillaProtocolModules.mandatoryModules({}),
    TransactionFee: TransactionFeeHook,
  });

  let runtimeProof: Proof<void, MethodPublicOutput>;
  let blockProver: BlockProvable;
  let runtime: ReturnType<typeof setupRuntime<typeof runtimeModules>>;
  let runtimeVerificationKeyAttestation: RuntimeVerificationKeyAttestation;
  let runtimeContextInput: RuntimeMethodExecutionData;
  const alicePrivateKey = PrivateKey.random();
  const alicePublicKey = alicePrivateKey.toPublicKey();

  const bobPrivateKey = PrivateKey.random();
  const bobPublicKey = bobPrivateKey.toPublicKey();

  Provable.log("alicePublicKey", alicePublicKey.toBase58());
  Provable.log("bobPublicKey", bobPublicKey.toBase58());

  // TODO:
  // do this in a separate node.js process to avoid wasm32 memory issues
  // utilise runtime-proof.json and runtime-attestation.json to run protocol tests here too
  async function generateRuntimeProof(sender: PublicKey) {
    runtime = setupRuntime(runtimeModules);
    runtime.runtime.configure(runtimeDefaultConfig);

    // register runtime at the top level, so it can be used by the protocol
    container.register("Runtime", {
      useValue: runtime.runtime,
    });

    await runtime.compile();

    const balances = runtime.runtime.resolve("Balances");

    // ensure the state is not polluted from previous usage of the runtime
    runtime.clearState();

    // we need the sender to generate the transaction hash / commitment
    runtime.context.input!.transaction.sender =
      PublicKeyOption.fromSome(sender);

    // execution here should have status: false (failing), since we did not hydrate the runtime state on purpose
    // we can get a valid runtime proof either way, but the execution status will be false
    await balances.transferSigned(
      TokenId.from(0),
      alicePublicKey,
      bobPublicKey,
      UInt64.from(100)
    );

    runtime.clearState();

    Provable.log("proving runtime", runtime.context.input!.transaction);
    const proof = await runtime.prove();
    Provable.log("proved runtime", runtime.context.input!.transaction);

    // capture context from runtime execution
    runtimeContextInput = runtime.context.input!;
    return proof;
  }

  beforeAll(async () => {
    runtimeProof = await generateRuntimeProof(alicePublicKey);

    protocol.configure({
      StateTransitionProver: {},
      BlockProver: {},
      AccountState: {},
      BlockHeight: {},
      LastStateRoot: {},
      TransactionFee: {
        tokenId: 0n,
        baseFee: 1n,
        perWeightUnitFee: 0n,
        feeRecipient: alicePublicKey.toBase58(),
        methods: {},
      },
    });

    await start();

    // restore context, since its cleared during protocol start
    runtime.context.setup(runtimeContextInput);
    runtimeVerificationKeyAttestation = await getRuntimeVkAttestation(runtime);

    console.time("block prover compile");
    await compile();
    console.timeEnd("block prover compile");

    // restore context, since its cleared during block prover compile
    runtime.context.setup(runtimeContextInput);
  });

  it("should collect transaction fees and transfer them to the fee recipient", async () => {
    const balances = runtime.runtime.resolve("Balances");

    // assuming context is preserved since the last runtime execution
    // because the block prover needs to operate on the same data as the runtime did
    const runtimeMethodExecutionData: RuntimeMethodExecutionData =
      runtime.context.input!;

    const signature = Signature.create(
      alicePrivateKey,
      SignedTransaction.getSignatureData({
        methodId: runtime.context.input!.transaction.methodId,
        nonce: runtime.context.input!.transaction.nonce.value,
        argsHash: runtime.context.input!.transaction.argsHash,
      })
    );

    // set state to be able to pay the tx fees
    await runtime.stateService.set(
      balances.balances.getPath(
        new BalancesKey({
          tokenId: TokenId.from(0),
          address: alicePublicKey,
        })
      ),
      [UInt64.from(100000).value]
    );

    // why do i need an extra setCurrentStateService here? it crashes otherwise bcs it gets popped off the stack
    runtime.stateServiceProvider.setCurrentStateService(runtime.stateService);
    const publicInput = {
      ...BlockProverPublicInput.empty(),
      blockNumber: MAX_FIELD,
      networkStateHash: NetworkState.empty().hash(),
    };
    const executionData = {
      ...BlockProverSingleTransactionExecutionData.empty(),
      // TODO: runtime proof transaction hash should be the same data as here, otherwise it does not work
      transaction: {
        signature: signature,
        transaction: runtime.context.input!.transaction,
        // need to provide attestation for the runtime VK here
        verificationKeyAttestation: runtimeVerificationKeyAttestation,
      },
      networkState: runtimeMethodExecutionData.networkState,
    };

    Provable.log("executionData", executionData);
    const proof = await protocol.blockProver.proveTransaction(
      publicInput,
      DynamicRuntimeProof.fromProof(runtimeProof),
      executionData
    );
    console.log(proof);

    // runtime.clearContext();
    // runtime.clearState();
    // await runtime.stateService.set(
    //   balances.balances.getPath(
    //     new BalancesKey({
    //       tokenId: TokenId.from(0),
    //       address: alicePublicKey,
    //     })
    //   ),
    //   [UInt64.from(100000).value]
    // );
    // const runtimeMethodExecutionData: RuntimeMethodExecutionData = {
    //   transaction: new RuntimeTransaction({
    //     ...RuntimeTransaction.empty(),
    //     nonce: UInt64Option.fromSome(O1JSUInt64.from(0)),
    //     sender: PublicKeyOption.fromSome(alicePublicKey),
    //     methodId: Field(
    //       runtime.runtime.dependencyContainer
    //         .resolve(MethodIdResolver)
    //         .getMethodId("Balances", "transferSigned")
    //     ),
    //   }),
    //   networkState: NetworkState.empty(),
    // };
    // Provable.log("runtimeMethodExecutionData", runtimeMethodExecutionData);
    // const transaction = new RuntimeTransaction({
    //   ...runtimeMethodExecutionData.transaction,
    //   argsHash: Poseidon.hash([
    //     ...TokenId.from(0).toFields(),
    //     ...alicePublicKey.toFields(),
    //     ...bobPublicKey.toFields(),
    //     ...UInt64.from(100).value.toFields(),
    //   ]),
    // });
    // const signature = Signature.create(
    //   alicePrivateKey,
    //   SignedTransaction.getSignatureData({
    //     methodId: transaction.methodId,
    //     nonce: transaction.nonce.value,
    //     argsHash: transaction.argsHash,
    //   })
    // );
    // why do i need an extra setCurrentStateService here? it crashes otherwise bcs it gets popped off the stack
    // runtime.stateServiceProvider.setCurrentStateService(runtime.stateService);
    // const proof = await blockProver.proveTransaction(
    //   {
    //     ...BlockProverPublicInput.empty(),
    //     blockNumber: MAX_FIELD,
    //     networkStateHash: NetworkState.empty().hash(),
    //   },
    //   DynamicRuntimeProof.fromProof(runtimeProof),
    //   {
    //     ...BlockProverSingleTransactionExecutionData.empty(),
    //     // TODO: runtime proof transaction hash should be the same data as here, otherwise it does not work
    //     transaction: {
    //       ...RuntimeTransaction.empty(),
    //       signature: signature,
    //       transaction: transaction,
    //       // need to provide attestation for the runtime VK here
    //       verificationKeyAttestation: runtimeVerificationKeyAttestation,
    //     },
    //     networkState: runtimeMethodExecutionData.networkState,
    //   }
    // );
    // console.log(proof);
  });
});
