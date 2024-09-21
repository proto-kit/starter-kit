import { UInt64 } from "@proto-kit/library";
import { calculateExecutionAmounts } from "../../../../src/runtime/modules/dark-pool/utils";
import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";

describe("calculateExecutionAmounts", () => {
  const appChain = TestingAppChain.fromRuntime({});
  appChain.configurePartial({
    Runtime: {
      Balances: {
        totalSupply: UInt64.from(0),
      },
    },
  });

  beforeAll(async () => {
    await appChain.start();
  });

  it("should fully execute when new ratio is greater than existing ratio", () => {
    const existingOrderAmountIn = UInt64.from(100);
    const existingOrderAmountOut = UInt64.from(90);
    const newOrderAmountIn = UInt64.from(50);
    const newOrderAmountOut = UInt64.from(50);

    const [executedAmountIn, executedAmountOut] = calculateExecutionAmounts(
      existingOrderAmountIn,
      existingOrderAmountOut,
      newOrderAmountIn,
      newOrderAmountOut
    );

    expect(executedAmountIn.toString()).toBe("50");
    expect(executedAmountOut.toString()).toBe("45");
  });

  it("should fully execute when ratios are equal", () => {
    const existingOrderAmountIn = UInt64.from(100);
    const existingOrderAmountOut = UInt64.from(90);
    const newOrderAmountIn = UInt64.from(100);
    const newOrderAmountOut = UInt64.from(90);

    const [executedAmountIn, executedAmountOut] = calculateExecutionAmounts(
      existingOrderAmountIn,
      existingOrderAmountOut,
      newOrderAmountIn,
      newOrderAmountOut
    );

    expect(executedAmountIn.toString()).toBe("100");
    expect(executedAmountOut.toString()).toBe("90");
  });

  it("should partially execute when new ratio is less than existing ratio", () => {
    const existingOrderAmountIn = UInt64.from(100);
    const existingOrderAmountOut = UInt64.from(90);
    const newOrderAmountIn = UInt64.from(200);
    const newOrderAmountOut = UInt64.from(150);

    const [executedAmountIn, executedAmountOut] = calculateExecutionAmounts(
      existingOrderAmountIn,
      existingOrderAmountOut,
      newOrderAmountIn,
      newOrderAmountOut
    );

    expect(executedAmountIn.toString()).toBe("200");
    expect(executedAmountOut.toString()).toBe("180");
  });

  it("should handle edge case with very small amounts", () => {
    const existingOrderAmountIn = UInt64.from(10);
    const existingOrderAmountOut = UInt64.from(9);
    const newOrderAmountIn = UInt64.from(1);
    const newOrderAmountOut = UInt64.from(1);

    const [executedAmountIn, executedAmountOut] = calculateExecutionAmounts(
      existingOrderAmountIn,
      existingOrderAmountOut,
      newOrderAmountIn,
      newOrderAmountOut
    );

    expect(executedAmountIn.toString()).toBe("1");
    expect(executedAmountOut.toString()).toBe("0");
  });

  it("should handle edge case with very large amounts", () => {
    const existingOrderAmountIn = UInt64.from(1000000000);
    const existingOrderAmountOut = UInt64.from(900000000);
    const newOrderAmountIn = UInt64.from(2000000000);
    const newOrderAmountOut = UInt64.from(1500000000);

    const [executedAmountIn, executedAmountOut] = calculateExecutionAmounts(
      existingOrderAmountIn,
      existingOrderAmountOut,
      newOrderAmountIn,
      newOrderAmountOut
    );

    expect(executedAmountIn.toString()).toBe("2000000000");
    expect(executedAmountOut.toString()).toBe("1800000000");
  });

  it("should handle edge case when existing order is fully consumed", () => {
    const existingOrderAmountIn = UInt64.from(100);
    const existingOrderAmountOut = UInt64.from(90);
    const newOrderAmountIn = UInt64.from(1000);
    const newOrderAmountOut = UInt64.from(800);

    const [executedAmountIn, executedAmountOut] = calculateExecutionAmounts(
      existingOrderAmountIn,
      existingOrderAmountOut,
      newOrderAmountIn,
      newOrderAmountOut
    );

    expect(executedAmountIn.toString()).toBe("1000");
    expect(executedAmountOut.toString()).toBe("90");
  });

  it("should handle edge case when new order is fully consumed", () => {
    const existingOrderAmountIn = UInt64.from(1000);
    const existingOrderAmountOut = UInt64.from(900);
    const newOrderAmountIn = UInt64.from(10);
    const newOrderAmountOut = UInt64.from(10);

    const [executedAmountIn, executedAmountOut] = calculateExecutionAmounts(
      existingOrderAmountIn,
      existingOrderAmountOut,
      newOrderAmountIn,
      newOrderAmountOut
    );

    expect(executedAmountIn.toString()).toBe("10");
    expect(executedAmountOut.toString()).toBe("9");
  });

  it("should handle edge case when new order has worse ratio but smaller amount", () => {
    const existingOrderAmountIn = UInt64.from(100);
    const existingOrderAmountOut = UInt64.from(90);
    const newOrderAmountIn = UInt64.from(50);
    const newOrderAmountOut = UInt64.from(40);

    const [executedAmountIn, executedAmountOut] = calculateExecutionAmounts(
      existingOrderAmountIn,
      existingOrderAmountOut,
      newOrderAmountIn,
      newOrderAmountOut
    );

    expect(executedAmountIn.toString()).toBe("50");
    expect(executedAmountOut.toString()).toBe("45");
  });
});
