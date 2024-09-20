import { Balance, TokenId } from "@proto-kit/library";
import { PrivateKey } from "o1js";

export async function drip(
  appChain: any,
  senderPrivateKey: PrivateKey,
  tokenId: TokenId,
  amount: Balance,
  options?: { nonce: number }
) {
  const faucet = appChain.runtime.resolve("Faucet");
  appChain.setSigner(senderPrivateKey);

  const tx = await appChain.transaction(
    senderPrivateKey.toPublicKey(),
    async () => {
      await faucet.dripSigned(tokenId, amount);
    },
    options
  );

  await tx.sign();
  await tx.send();

  return tx;
}
