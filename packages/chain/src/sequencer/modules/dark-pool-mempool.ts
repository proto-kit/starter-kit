import { EventEmitter, log, noop } from "@proto-kit/common";
import {
  sequencerModule,
  SequencerModule,
  type Mempool,
  type MempoolEvents,
  type PendingTransaction,
  type TransactionStorage,
} from "@proto-kit/sequencer";
import type { TransactionValidator } from "@proto-kit/sequencer/dist/mempool/verification/TransactionValidator";
import { inject } from "tsyringe";

@sequencerModule()
export class DarkPoolMempool extends SequencerModule implements Mempool {
  public readonly events = new EventEmitter<MempoolEvents>();

  public constructor(
    private readonly transactionValidator: TransactionValidator,
    @inject("TransactionStorage")
    private readonly transactionStorage: TransactionStorage
  ) {
    super();
  }

  public async add(tx: PendingTransaction): Promise<boolean> {
    const [txValid, error] = this.transactionValidator.validateTx(tx);
    if (txValid) {
      const success = await this.transactionStorage.pushUserTransaction(tx);
      if (success) {
        this.events.emit("mempool-transaction-added", tx);
        log.info(
          `Transaction added to mempool: ${tx.hash().toString()} (${(await this.getTxs()).length} transactions in mempool)`
        );
      } else {
        log.error(
          `Transaction ${tx.hash().toString()} rejected: already exists in mempool`
        );
      }

      return success;
    }

    log.error(
      `Validation of tx ${tx.hash().toString()} failed:`,
      `${error ?? "unknown error"}`
    );

    throw new Error(
      `Validation of tx ${tx.hash().toString()} failed: ${error ?? "unknown error"}`
    );
  }

  public async getTxs(): Promise<PendingTransaction[]> {
    const txs = await this.transactionStorage.getPendingUserTransactions();
    txs.forEach((tx) => {
      console.log(tx.methodId);
    });
    return txs;
  }

  public async start(): Promise<void> {
    noop();
  }
}
