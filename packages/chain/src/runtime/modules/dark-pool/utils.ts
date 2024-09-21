import type { UInt64 } from "@proto-kit/library";
import { Provable } from "o1js";

/**
 * Calculates the execution amounts for matching orders in a dark pool.
 *
 * This function determines how much of each order can be executed based on their ratios.
 * It handles three scenarios:
 * 1. The new order has a better ratio and can be fully executed.
 * 2. Both orders have the same ratio and can be matched exactly.
 * 3. The new order has a worse ratio and will be partially executed.
 *
 * @param existingOrderAmountIn The amount of tokens the existing order is selling.
 * @param existingOrderAmountOut The amount of tokens the existing order wants to buy.
 * @param newOrderAmountIn The amount of tokens the new order is selling.
 * @param newOrderAmountOut The amount of tokens the new order wants to buy.
 *
 * @returns A tuple containing:
 *          - executedAmountIn: The amount of tokens that will be taken from the new order.
 *          - executedAmountOut: The amount of tokens that will be given to the new order.
 *
 * Note: The function always tries to maximize the execution of the new order.
 *       If the new order has a worse ratio, it will still be fully executed if possible,
 *       and the existing order will be partially filled.
 */
export function calculateExecutionAmounts(
  existingOrderAmountIn: UInt64,
  existingOrderAmountOut: UInt64,
  newOrderAmountIn: UInt64,
  newOrderAmountOut: UInt64
): [UInt64, UInt64] {
  const existingRatio = existingOrderAmountOut.div(existingOrderAmountIn);
  const newRatio = newOrderAmountOut.div(newOrderAmountIn);

  let executedAmountIn: UInt64;
  let executedAmountOut: UInt64;

  if (newRatio.greaterThan(existingRatio)) {
    // The existing order can fully satisfy the new order
    executedAmountIn = newOrderAmountIn;
    executedAmountOut = executedAmountIn
      .mul(existingOrderAmountOut)
      .div(existingOrderAmountIn);
  } else if (newRatio.equals(existingRatio)) {
    // The orders match exactly
    executedAmountIn = Provable.if(
      existingOrderAmountIn.lessThan(newOrderAmountIn),
      existingOrderAmountIn as any,
      newOrderAmountIn
    );
    executedAmountOut = Provable.if(
      existingOrderAmountOut.lessThan(newOrderAmountOut),
      existingOrderAmountOut as any,
      newOrderAmountOut
    );
  } else {
    // The new order can only partially satisfy the existing order
    executedAmountIn = existingOrderAmountOut
      .mul(newOrderAmountIn)
      .div(newOrderAmountOut);
    executedAmountOut = existingOrderAmountOut;
  }

  return [executedAmountIn, executedAmountOut];
}
