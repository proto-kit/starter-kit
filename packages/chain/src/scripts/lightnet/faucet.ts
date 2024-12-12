import {
  Account,
  AccountUpdate,
  fetchAccount,
  Lightnet,
  Mina,
  Provable,
  PublicKey,
} from "o1js";
import "reflect-metadata";

// configuration
const fee = 0.1 * 1e9;
const fundingAmount = 1000 * 1e9;

const net = Mina.Network({
  mina: `${process.env.MINA_NODE_GRAPHQL_HOST!}:${process.env.MINA_NODE_GRAPHQL_PORT!}/graphql`,
  archive: `${process.env.MINA_ARCHIVE_GRAPHQL_HOST!}:${process.env.MINA_ARCHIVE_GRAPHQL_PORT!}/graphql`,
  lightnetAccountManager: `${process.env.MINA_ACCOUNT_MANAGER_HOST!}:${process.env.MINA_ACCOUNT_MANAGER_PORT!}`,
});

Mina.setActiveInstance(net);

// get the source account from the account manager
const pair = await Lightnet.acquireKeyPair({
  isRegularAccount: true,
});

// which account to drip to
const keyArg = process.argv[2];

if (!keyArg) {
  throw new Error("No key provided");
}

const key = PublicKey.fromBase58(keyArg);

await fetchAccount({ publicKey: pair.publicKey });

Provable.log(
  `Dripping ${fundingAmount / 1e9} MINA from ${pair.publicKey.toBase58()} to ${key.toBase58()}`
);

const tx = await Mina.transaction(
  {
    sender: pair.publicKey,
    fee,
  },
  async () => {
    const account = await fetchAccount({ publicKey: key });
    // if the destination account does not exist yet, pay the creation fee for it
    if (account.error) {
      AccountUpdate.fundNewAccount(pair.publicKey);
    }

    AccountUpdate.createSigned(pair.publicKey).balance.subInPlace(
      fundingAmount
    );
    AccountUpdate.create(key).balance.addInPlace(fundingAmount);
  }
);

tx.sign([pair.privateKey]);

const sentTx = await tx.send();
await sentTx.wait();

Provable.log(
  `Funded account ${key.toBase58()} with ${fundingAmount / 1e9} MINA`
);

await Lightnet.releaseKeyPair({
  publicKey: pair.publicKey.toBase58(),
});
