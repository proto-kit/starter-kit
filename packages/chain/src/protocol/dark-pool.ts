import { Runtime, RuntimeModulesRecord } from "@proto-kit/module";
import {
  BlockProverExecutionData,
  ProvableTransactionHook,
} from "@proto-kit/protocol";
import { Field } from "o1js";
import { inject } from "tsyringe";
import { DarkPool } from "../runtime/modules/dark-pool/index";
import "reflect-metadata";

export class DarkPoolStateModule extends ProvableTransactionHook {
  private darkPool: DarkPool;

  public constructor(
    @inject("Runtime") private readonly runtime: Runtime<RuntimeModulesRecord>
  ) {
    super();
    this.darkPool = runtime.resolveOrFail("DarkPool", DarkPool);
  }
  public async onTransaction({ transaction }: BlockProverExecutionData) {
    const submitOrderMethodId = this.runtime.methodIdResolver.getMethodId(
      "DarkPool",
      "submitOrder"
    );
    const isSubmitOrder = transaction.methodId
      .equals(Field.from(submitOrderMethodId))
      .toBoolean();
    // If the submit order tx has not been added to the mempool yet, or if it has been overwritten by a new submit order tx, create a match orders tx
    if (isSubmitOrder) {
      await this.darkPool.matchOrders();
    }
  }
}
