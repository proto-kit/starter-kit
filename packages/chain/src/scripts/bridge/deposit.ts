import {
  BridgingModule,
  InMemoryDatabase,
  MinaTransactionSender,
  Sequencer,
  SettlementModule,
} from "@proto-kit/sequencer";
import {
  scriptsSettlementSequencerModules,
  scriptsSettlementSequencerModulesConfig,
} from "../../sequencer";
import { AppChain } from "@proto-kit/sdk";
import { Runtime } from "@proto-kit/module";
import runtime from "../../runtime";
import {
  Protocol,
} from "@proto-kit/protocol";
import * as protocol from "../../protocol";
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

  Provable.log("Preparing to deposit", {
    tokenId,
    fromPrivateKey,
    toPublicKey,
    amount,
    fee,
  });

  const appChain = AppChain.from({
    Runtime: Runtime.from({
      modules: runtime.modules,
    }),
    Protocol: Protocol.from({
      modules: {
        ...protocol.modules,
        ...protocol.settlementModules,
      },
    }),
    Sequencer: Sequencer.from({
      modules: {
        Database: InMemoryDatabase,
        ...scriptsSettlementSequencerModules,
      },
    }),
    modules: {},
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

  await appChain.start();

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
  const bridgeAddress = await bridgingModule.getBridgeAddress(TokenId.default);
  await fetchAccount({ publicKey: bridgeAddress! });

  const attestation = await bridgingModule.getDepositContractAttestation(tokenId)

  console.log("Forging transaction...");
  const tx = await Mina.transaction(
    {
      sender: fromPrivateKey.toPublicKey(),
      fee,
    },
    async () => {
      const au = AccountUpdate.createSigned(fromPrivateKey.toPublicKey());
      au.balance.subInPlace(UInt64.from(amount));

      await dispatch.deposit(
        UInt64.from(amount),
        tokenId,
        PublicKey.fromBase58(
          process.env.PROTOKIT_MINA_BRIDGE_CONTRACT_PUBLIC_KEY!
        ),
        attestation,
        toPublicKey
      );
    }
  );

  settlementModule.signTransaction(
    tx,
    [fromPrivateKey],
    [],
    [dispatch.address]
  );

  console.log("Sending...");
  console.log(tx.toPretty());

  const { hash } = await appChain.sequencer
    .resolveOrFail("TransactionSender", MinaTransactionSender)
    .proveAndSendTransaction(tx, "included");

  console.log(`Deposit transaction included in a block: ${hash}`);
}
