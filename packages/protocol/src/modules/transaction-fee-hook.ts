import {
  Balance,
  TransactionFeeHook as BaseTransactionFeeHook,
  TokenId,
  UInt64,
} from "@proto-kit/library";
import {
  BeforeTransactionHookArguments,
  PublicKeyOption,
} from "@proto-kit/protocol";
import { Provable, PublicKey } from "o1js";
import { injectable } from "tsyringe";

/**
 * Transaction hook that collects transaction fees and transfers them to the fee recipient.
 */
@injectable()
export class TransactionFeeHook extends BaseTransactionFeeHook {
  /**
   * Collects transaction fees and transfers them to the fee recipient.
   * @param executionData
   */
  public async beforeTransaction(
    executionData: BeforeTransactionHookArguments
  ): Promise<void> {
    Provable.log("beforeTransaction", executionData);
    await super.beforeTransaction(executionData);
  }

  public async transferFee(from: PublicKeyOption, fee: UInt64) {
    Provable.log("transferFee", from, fee);
    await this.balances.transfer(
      new TokenId(this.config.tokenId),
      from.value,
      PublicKey.fromBase58(this.config.feeRecipient),
      Balance.Unsafe.fromField(fee.value)
    );
  }

  public async afterTransaction(): Promise<void> {}
}
