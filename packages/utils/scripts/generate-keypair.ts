import { Provable, PrivateKey } from "o1js";

const privateKey = PrivateKey.random();

Provable.log("Generated keypair:", {
  privateKey: privateKey.toBase58(),
  publicKey: privateKey.toPublicKey().toBase58(),
});
