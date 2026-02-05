import { BlockHandler, HandlersRecord } from "@proto-kit/processor";
import { PrismaClient } from "@prisma/client-processor";
import { appChain } from "./../utils/app-chain";
import { handleBalancesAddBalance } from "./transactions/add-balance";

const handleTransactions: BlockHandler<PrismaClient> = async (
  client,
  { block, result: blockResult }
) => {
  // iterate over all transactions
  for (const tx of block.transactions) {
    const methodId = tx.tx.methodId.toBigInt();

    const methodDescriptor =
      appChain.runtime.methodIdResolver.getMethodNameFromId(methodId);

    if (methodDescriptor === undefined) {
      throw new Error("Unable to retrieve the method descriptor");
    }

    const moduleName = methodDescriptor[0];
    const methodName = methodDescriptor[1];

    // eslint-disable-next-line sonarjs/no-small-switch, default-case
    switch (moduleName) {
      case "Balances":
        // eslint-disable-next-line max-len
        // eslint-disable-next-line sonarjs/no-small-switch, default-case, sonarjs/no-nested-switch
        switch (methodName) {
          case "addBalance":
            await handleBalancesAddBalance(client, block, tx);
            break;
        }
        break;
    }
  }
};

export const handlers: HandlersRecord<PrismaClient> = {
  onBlock: [handleTransactions],
};
