import { Runtime } from "@proto-kit/module";
import { Protocol, TokenBridgeTree } from "@proto-kit/protocol";
import {
  ArchiveNode,
  MinaTransactionSender,
  ProvenSettlementPermissions,
  Sequencer,
  SettlementModule,
  SignedSettlementPermissions,
  AppChain,
} from "@proto-kit/sequencer";
import {
  AccountUpdate,
  Bool,
  fetchAccount,
  Field,
  Mina,
  PrivateKey,
  Provable,
  PublicKey,
  UInt64,
  UInt8,
} from "o1js";
import "reflect-metadata";
import { container } from "tsyringe";
import runtime from "../../../runtime";
import * as protocol from "../../../protocol";
import {
  scriptsSettlementSequencerModules,
  scriptsSettlementSequencerModulesConfig,
} from "../../sequencer";
import { PrismaRedisDatabase } from "@proto-kit/persistance";
import {
  FungibleToken,
  FungibleTokenAdmin,
  SetAdminEvent,
} from "mina-fungible-token";

export default async function () {
  const appChain = AppChain.from({
    Runtime: Runtime.from(runtime.modules),
    Protocol: Protocol.from({
      ...protocol.modules,
      ...protocol.settlementModules,
    }),
    Sequencer: Sequencer.from({
      Database: PrismaRedisDatabase,
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
      ...scriptsSettlementSequencerModulesConfig,
      Database: {
        redis: {
          host: process.env.REDIS_HOST!,
          port: Number(process.env.REDIS_PORT)!,
          password: process.env.REDIS_PASSWORD!,
        },
        prisma: {
          connection: process.env.DATABASE_URL!,
        },
      },
    } as any,
  });

  const chainContainer = container.createChildContainer();
  const proofsEnabled = process.env.PROTOKIT_PROOFS_ENABLED === "true";
  await appChain.start(proofsEnabled, chainContainer);

  const tokenSymbol = process.argv[3];
  const feepayerPrivateKey = PrivateKey.fromBase58(
    process.env[process.argv[4]] || process.argv[4]
  );
  const receiverPublicKey = PublicKey.fromBase58(
    process.env[process.argv[5]] || process.argv[5]!
  );
  const mintAmount =
    process.argv.length > 6 ? Number(process.argv[6]) * 1e9 : 0;
  const fee = 0.1 * 1e9;

  const settlementModule = appChain.sequencer.resolveOrFail(
    "SettlementModule",
    SettlementModule
  );

  const isSignedSettlement = settlementModule.utils.isSignedSettlement();

  const tokenOwnerKey = PrivateKey.fromBase58(
    process.env["PROTOKIT_CUSTOM_TOKEN_PRIVATE_KEY"] ??
      PrivateKey.random().toBase58()
  );
  const tokenAdminKey = PrivateKey.fromBase58(
    process.env["PROTOKIT_CUSTOM_TOKEN_ADMIN_PRIVATE_KEY"] ??
      PrivateKey.random().toBase58()
  );
  const tokenBridgeKey = PrivateKey.fromBase58(
    process.env["PROTOKIT_CUSTOM_TOKEN_BRIDGE_PRIVATE_KEY"] ??
      PrivateKey.random().toBase58()
  );

  await ArchiveNode.waitOnSync(appChain.sequencer.resolve("BaseLayer").config);

  async function deployTokenContracts() {
    const permissions = isSignedSettlement
      ? new SignedSettlementPermissions()
      : new ProvenSettlementPermissions();

    const tx = await Mina.transaction(
      {
        sender: feepayerPrivateKey.toPublicKey(),
        memo: "Deploy custom token",
        fee,
      },
      async () => {
        AccountUpdate.fundNewAccount(feepayerPrivateKey.toPublicKey(), 3);

        const admin = new FungibleTokenAdmin(tokenAdminKey.toPublicKey());
        await admin.deploy({
          adminPublicKey: feepayerPrivateKey.toPublicKey(),
        });
        admin.self.account.permissions.set(permissions.bridgeContractToken());

        const fungibleToken = new FungibleToken(tokenOwnerKey.toPublicKey());
        await fungibleToken.deploy({
          src: "",
          symbol: tokenSymbol,
          allowUpdates: false,
        });
        fungibleToken!.self.account.permissions.set(
          permissions.bridgeContractToken()
        );

        await fungibleToken.initialize(
          tokenAdminKey.toPublicKey(),
          UInt8.from(9),
          Bool(false)
        );
      }
    );
    console.log("Sending deploy transaction...");
    console.log(tx.toPretty());

    settlementModule.signTransaction(
      tx,
      [feepayerPrivateKey, tokenOwnerKey, tokenAdminKey],
      [tokenOwnerKey, tokenAdminKey]
    );

    await appChain.sequencer
      .resolveOrFail("TransactionSender", MinaTransactionSender)
      .proveAndSendTransaction(tx, "included");

    console.log("Deploy transaction included");
  }

  async function mint() {
    const tokenOwner = new FungibleToken(tokenOwnerKey.toPublicKey());
    await settlementModule.utils.fetchContractAccounts(
      {
        address: tokenOwner!.address,
        tokenId: tokenOwner!.tokenId,
      },
      {
        address: tokenOwner!.address,
        tokenId: tokenOwner!.deriveTokenId(),
      }
    );

    const tx = await Mina.transaction(
      {
        sender: feepayerPrivateKey.toPublicKey(),
        memo: "Mint custom token",
        fee,
      },
      async () => {
        AccountUpdate.fundNewAccount(feepayerPrivateKey.toPublicKey(), 1);

        await tokenOwner!.mint(receiverPublicKey, UInt64.from(mintAmount));
      }
    );
    settlementModule.utils.signTransaction(
      tx,
      [feepayerPrivateKey],
      [tokenOwnerKey, tokenAdminKey]
    );

    await appChain.sequencer
      .resolveOrFail("TransactionSender", MinaTransactionSender)
      .proveAndSendTransaction(tx, "included");
  }

  async function deployBridge() {
    const { settlement, dispatch } = settlementModule.getAddresses();
    await fetchAccount({
      publicKey: settlementModule.config.feepayer.toPublicKey(),
    });
    await fetchAccount({ publicKey: settlement });
    await fetchAccount({ publicKey: dispatch });

    const tokenOwner = new FungibleToken(tokenOwnerKey.toPublicKey());
    // SetAdminEvent.
    await settlementModule.deployTokenBridge(
      tokenOwner!,
      tokenOwnerKey,
      tokenBridgeKey,
      {}
    );
    console.log(
      `Token bridge address: ${tokenBridgeKey.toPublicKey().toBase58()} @ ${tokenOwner!.deriveTokenId().toString()}`
    );
  }

  await deployTokenContracts();
  await mint();
  await deployBridge();

  console.log(
    `Deployed custom token with id ${new FungibleToken(tokenOwnerKey.toPublicKey())!.deriveTokenId()}`
  );

  Provable.log("Deployed and initialized settlement contracts", {
    settlement: PrivateKey.fromBase58(
      process.env.PROTOKIT_SETTLEMENT_CONTRACT_PRIVATE_KEY!
    ).toPublicKey(),
    dispatcher: PrivateKey.fromBase58(
      process.env.PROTOKIT_DISPATCHER_CONTRACT_PRIVATE_KEY!
    ).toPublicKey(),
  });

  await appChain.close();
}
