import { PrivateKey, Provable, PublicKey } from "o1js";

const numberOFKeysToGenerate = Number(process.argv[2]) || 1;
console.log(
  `Generated ${numberOFKeysToGenerate} keys for development purposes:`
);

for (let i = 0; i < numberOFKeysToGenerate; i++) {
  const privateKey = PrivateKey.random();
  const publicKey = privateKey.toPublicKey();

  console.log("Private key:", privateKey.toBase58());
  console.log("Public key:", publicKey.toBase58());
}
