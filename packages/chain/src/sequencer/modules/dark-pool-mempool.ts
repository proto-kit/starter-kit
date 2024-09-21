import { EventEmitter, log, noop } from "@proto-kit/common";
import { MethodParameterEncoder, type Runtime } from "@proto-kit/module";
import {
  PendingTransaction,
  sequencerModule,
  SequencerModule,
  type Mempool,
  type MempoolEvents,
  type TransactionStorage,
} from "@proto-kit/sequencer";
import { TransactionValidator } from "@proto-kit/sequencer/dist/mempool/verification/TransactionValidator";
import { Field, PrivateKey, PublicKey, Signature, UInt64 } from "o1js";
import "reflect-metadata";
import { inject } from "tsyringe";
import baseRuntime from "../../runtime";

@sequencerModule()
export class DarkPoolMempool extends SequencerModule implements Mempool {
  public readonly events = new EventEmitter<MempoolEvents>();

  public constructor(
    private readonly transactionValidator: TransactionValidator,
    @inject("TransactionStorage")
    private readonly transactionStorage: TransactionStorage,
    @inject("Runtime")
    private readonly runtime: Runtime<(typeof baseRuntime)["modules"]>
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
    // TODO: for each dark pool order creation, check if it can be matched with an existing order
    const darkPool = this.runtime.resolve("DarkPool");
    const submitOrderMethodId = this.runtime.methodIdResolver.getMethodId(
      "DarkPool",
      "submitOrder"
    );
    let hasSubmitOrder = false;
    txs.forEach(async (tx) => {
      if (tx.methodId.equals(submitOrderMethodId)) {
        hasSubmitOrder = true;
      }
    });
    if (hasSubmitOrder) {
      const encoder = MethodParameterEncoder.fromMethod(
        darkPool,
        "matchOrders"
      );
      const matchOrdersMethodId = this.runtime.methodIdResolver.getMethodId(
        "DarkPool",
        "matchOrders"
      );
      const { fields, auxiliary } = encoder.encode([]);

      console.log("Adding match order transaction...");
      txs.push(
        new PendingTransaction({
          methodId: Field.from(matchOrdersMethodId),
          nonce: (txs.at(-1)?.nonce ?? UInt64.from(0)).add(1),
          sender: PublicKey.empty(),
          signature: Signature.create(PrivateKey.random(), [Field(0)]),
          argsFields: fields,
          auxiliaryData: auxiliary,
          isMessage: false,
        })
      );
    }
    return txs;
  }

  public async start(): Promise<void> {
    noop();
  }
}
