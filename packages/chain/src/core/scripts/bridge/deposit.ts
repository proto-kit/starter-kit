import {
  BridgingModule,
  InMemoryDatabase,
  MinaTransactionSender,
  Sequencer,
  SettlementModule,
  AppChain,
} from "@proto-kit/sequencer";
import {
  scriptsSettlementSequencerModules,
  scriptsSettlementSequencerModulesConfig,
} from "../../sequencer";
import { Runtime } from "@proto-kit/module";
import runtime from "../../../runtime";
import { Protocol, TokenBridgeAttestation } from "@proto-kit/protocol";
import * as protocol from "../../../protocol";
import {
  AccountUpdate,
  fetchAccount,
  Field,
  Mina,
  PrivateKey,
  Provable,
  PublicKey,
  TokenId,
  UInt64,
} from "o1js";
import { FungibleToken } from "mina-fungible-token";

export default async function () {
  const tokenId = Field(process.argv[3]);
  const fromPrivateKey = PrivateKey.fromBase58(
    process.env[process.argv[4]] || process.argv[4]
  );
  const toPublicKey = PublicKey.fromBase58(
    process.env[process.argv[5]] || process.argv[5]!
  );
  const amount = Number(process.argv[6]) * 1e9;
  const fee = 0.1 * 1e9;

  const isCustomToken = tokenId.toBigInt() !== 1n;
  const tokenOwnerPrivateKey = isCustomToken
    ? PrivateKey.fromBase58(process.env["PROTOKIT_CUSTOM_TOKEN_PRIVATE_KEY"]!)
    : PrivateKey.random();
  const bridgeContractKey = isCustomToken
    ? PrivateKey.fromBase58(
        process.env.PROTOKIT_CUSTOM_TOKEN_BRIDGE_PRIVATE_KEY!
      )
    : PrivateKey.fromBase58(
        process.env.PROTOKIT_MINA_BRIDGE_CONTRACT_PRIVATE_KEY!
      );

  Provable.log("Preparing to deposit", {
    tokenId,
    fromPrivateKey,
    toPublicKey,
    amount,
    fee,
  });

  const appChain = AppChain.from({
    Runtime: Runtime.from(runtime.modules),
    Protocol: Protocol.from({
      ...protocol.modules,
      ...protocol.settlementModules,
    }),
    Sequencer: Sequencer.from({
      Database: InMemoryDatabase,
      ...scriptsSettlementSequencerModules,
    }),
  });

  appChain.configure({
    Runtime: runtime.config,
    Protocol: {
      ...protocol.config,
      ...protocol.settlementModulesConfig,
    },
    Sequencer: {
      Database: {},
      ...scriptsSettlementSequencerModulesConfig,
    },
  });

  const proofsEnabled = process.env.PROTOKIT_PROOFS_ENABLED === "true";
  await appChain.start(proofsEnabled);

  const settlementModule = appChain.sequencer.resolveOrFail(
    "SettlementModule",
    SettlementModule
  );

  const bridgingModule = appChain.sequencer.resolveOrFail(
    "BridgingModule",
    BridgingModule
  );

  const { settlement, dispatch } = settlementModule.getContracts();

  await fetchAccount({ publicKey: fromPrivateKey.toPublicKey() });
  await fetchAccount({ publicKey: settlement.address });
  await fetchAccount({ publicKey: dispatch.address });
  const bridgeAddress = await bridgingModule.getBridgeAddress(tokenId);
  await fetchAccount({ publicKey: bridgeAddress!, tokenId: tokenId });
  await fetchAccount({ publicKey: bridgeAddress!, tokenId: tokenId });

  const attestation =
    await bridgingModule.getDepositContractAttestation(tokenId);

  console.log("Forging transaction...");
  const tx = await Mina.transaction(
    {
      memo: "User deposit",
      sender: fromPrivateKey.toPublicKey(),
      fee,
    },
    async () => {
      const au = AccountUpdate.createSigned(
        fromPrivateKey.toPublicKey(),
        tokenId
      );
      au.balance.subInPlace(UInt64.from(amount));

      await dispatch.deposit(
        UInt64.from(amount),
        tokenId,
        bridgeContractKey.toPublicKey(),
        attestation,
        toPublicKey
      );

      if (isCustomToken) {
        await new FungibleToken(
          tokenOwnerPrivateKey.toPublicKey()
        )!.approveAccountUpdates([au, dispatch.self]);
      }
    }
  );
  console.log(tx.toPretty());

  settlementModule.signTransaction(
    tx,
    [fromPrivateKey],
    [tokenOwnerPrivateKey],
    [dispatch.address]
  );

  console.log("Sending...");
  console.log(tx.toPretty());

  const { hash } = await appChain.sequencer
    .resolveOrFail("TransactionSender", MinaTransactionSender)
    .proveAndSendTransaction(tx, "included");

  console.log(`Deposit transaction included in a block: ${hash}`);

  await appChain.close();
}
