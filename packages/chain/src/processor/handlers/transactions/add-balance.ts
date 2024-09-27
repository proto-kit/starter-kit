import { BlockHandler } from "@proto-kit/processor";
import { PrismaClient } from "@prisma/client-processor";
import { appChain } from "../../utils/app-chain";
import { MethodParameterEncoder } from "@proto-kit/module";
import { Block, TransactionExecutionResult } from "@proto-kit/sequencer";

export const handleBalancesAddBalance = async (
  client: Parameters<BlockHandler<PrismaClient>>[0],
  block: Block,
  tx: TransactionExecutionResult
) => {
  const module = appChain.runtime.resolve("Balances");

  const parameterDecoder = MethodParameterEncoder.fromMethod(
    module,
    "addBalance"
  );

  // @ts-expect-error
  const [tokenId, address, amount]: [TokenId, PublicKey, PublicKey, Balance] =
    await parameterDecoder.decode(tx.tx.argsFields, tx.tx.auxiliaryData);

  const currentAddressBalance = await client.balance.findFirst({
    orderBy: {
      height: "desc",
    },
    where: {
      address: address.toBase58(),
    },
  });

  console.log("currentAddressBalance", currentAddressBalance);

  const newFromBalance =
    (currentAddressBalance?.amount != null
      ? BigInt(currentAddressBalance.amount)
      : BigInt(0)) + amount.toBigInt();

  await client.balance.create({
    data: {
      address: address.toBase58(),
      height: Number(block.height.toString()),
      amount: newFromBalance > 0n ? newFromBalance.toString() : "0",
    },
  });
};
