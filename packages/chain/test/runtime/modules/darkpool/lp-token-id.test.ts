import { TokenId } from "@proto-kit/library";
import "reflect-metadata";
import { LPTokenId } from "../../../../src/runtime/modules/darkpool/lp-token-id";
import { TokenPair } from "../../../../src/runtime/modules/darkpool/token-pair";

describe("lp-token-id", () => {
  it("should be derived deterministically from token pair", async () => {
    const tokenAId = TokenId.from(0);
    const tokenBId = TokenId.from(1);
    const tokenPair = TokenPair.from(tokenAId, tokenBId);
    const lpTokenIdA = LPTokenId.fromTokenPair(tokenPair);
    const lpTokenIdB = LPTokenId.fromTokenPair(tokenPair);
    expect(lpTokenIdA.value).toEqual(lpTokenIdB.value);
  });

  it("should be same for same tokens but different order", async () => {
    const tokenAId = TokenId.from(0);
    const tokenBId = TokenId.from(1);
    const tokenPairA = TokenPair.from(tokenAId, tokenBId);
    const tokenPairB = TokenPair.from(tokenBId, tokenAId);
    const lpTokenIdA = LPTokenId.fromTokenPair(tokenPairA);
    const lpTokenIdB = LPTokenId.fromTokenPair(tokenPairB);
    expect(lpTokenIdA.value).toEqual(lpTokenIdB.value);
  });

  it("should be different for different token pairs", async () => {
    const tokenAId = TokenId.from(0);
    const tokenBId = TokenId.from(1);
    const tokenCId = TokenId.from(2);
    const tokenPairA = TokenPair.from(tokenAId, tokenBId);
    const tokenPairB = TokenPair.from(tokenBId, tokenCId);
    const lpTokenIdA = LPTokenId.fromTokenPair(tokenPairA);
    const lpTokenIdB = LPTokenId.fromTokenPair(tokenPairB);
    expect(lpTokenIdA.value).not.toEqual(lpTokenIdB.value);
  });
});
