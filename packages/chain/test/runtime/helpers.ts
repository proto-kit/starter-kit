import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey } from "o1js";
import { Faucet } from "../../src/runtime/modules/faucet";
import { TokenRegistry } from "../../src/runtime/modules/tokens";
import { XYK } from "../../src/runtime/modules/xyk";
import { Balances } from "../../src/runtime/modules/balances";

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
