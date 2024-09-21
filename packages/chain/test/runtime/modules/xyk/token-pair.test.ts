import { TokenId } from "@proto-kit/library";
import { TokenPair } from "../../../../src/runtime/modules/xyk/token-pair";
import "reflect-metadata";

describe("token-pair", () => {
  it("should be same for same tokens but different order", async () => {
    const tokenAId = TokenId.from(0);
    const tokenBId = TokenId.from(1);
    const tokenPairA = TokenPair.from(tokenAId, tokenBId);
    const tokenPairB = TokenPair.from(tokenBId, tokenAId);
    expect(tokenPairA).toEqual(tokenPairB);
  });
});
