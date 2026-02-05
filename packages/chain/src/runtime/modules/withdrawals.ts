import { Withdrawals as BaseWithdrawals, UInt64 } from "@proto-kit/library";
import { runtimeMethod, runtimeModule } from "@proto-kit/module";
import { PublicKey, Field, Provable } from "o1js";

@runtimeModule()
export class Withdrawals extends BaseWithdrawals {
  @runtimeMethod()
  public async withdraw(
    address: PublicKey,
    amount: UInt64,
    tokenId: Field
  ): Promise<void> {
    const balance = await (this as any).balances.getBalance(tokenId, address);

    // TODO: address must be sender instead
    Provable.log("withdraw debug", {
      address,
      balance,
      amount,
    });
    await super.withdraw(address, amount, tokenId);
  }
}
