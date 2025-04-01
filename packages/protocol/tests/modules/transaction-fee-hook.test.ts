import { jest } from "@jest/globals";
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
  Option,
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
  describe("out of circuit", () => {
    // TODO: a lot simplier test running TransactionFeeHook.beforeTransaction()
  });

  describe("in circuit", () => {
    let {
      protocol,
      start,
      getRuntimeVkAttestation,
      initializeVkService,
      compile,
      prove,
    } = setup({
      ...VanillaProtocolModules.mandatoryModules({}),
      TransactionFee: TransactionFeeHook,
    });

    let runtimeProof: Proof<void, MethodPublicOutput>;
    let runtime: ReturnType<typeof setupRuntime<typeof runtimeModules>>;
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

      const proof = await runtime.prove();

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
          feeRecipient: bobPublicKey.toBase58(),
          methods: {},
        },
      });

      await start();

      // restore context, since its cleared during protocol start
      runtime.context.setup(runtimeContextInput);

      await initializeVkService(runtime);
      await compile();

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

      const runtimeVerificationKeyAttestation =
        await getRuntimeVkAttestation(runtime);

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

      let feeRecipientBalance: Option<Balance> | undefined;
      const transactionFeeHook = protocol.resolve("TransactionFee");
      jest
        .spyOn(transactionFeeHook, "beforeTransaction")
        .mockImplementationOnce(async (executionData) => {
          await transactionFeeHook.beforeTransaction(executionData);
          feeRecipientBalance = await balances.balances.get(
            new BalancesKey({
              tokenId: TokenId.from(0),
              address: bobPublicKey,
            })
          );
        });

      await protocol.blockProver.proveTransaction(
        publicInput,
        DynamicRuntimeProof.fromProof(runtimeProof),
        executionData
      );

      runtime.stateServiceProvider.setCurrentStateService(runtime.stateService);
      const proof = await prove();
      Provable.log("proof", proof.publicInput, proof.publicOutput);

      expect(feeRecipientBalance?.value.toString()).toBe(
        UInt64.from(1).toString()
      );
    });
  });
});
