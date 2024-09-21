import { TokenId } from "@proto-kit/library";
import { PoolKey } from "../../../../src/runtime/modules/xyk/pool-key";
import { TokenPair } from "../../../../src/runtime/modules/xyk/token-pair";
import "reflect-metadata";

describe("pool-key", () => {
  it("should be derived deterministically from token pair", async () => {
    const tokenAId = TokenId.from(0);
    const tokenBId = TokenId.from(1);
    const tokenPair = TokenPair.from(tokenAId, tokenBId);
    const poolKeyA = PoolKey.fromTokenPair(tokenPair);
    const poolKeyB = PoolKey.fromTokenPair(tokenPair);
    expect(poolKeyA.toBase58()).toEqual(poolKeyB.toBase58());
  });

  it("should be same for same tokens but different order", async () => {
    const tokenAId = TokenId.from(0);
    const tokenBId = TokenId.from(1);
    const tokenPairA = TokenPair.from(tokenAId, tokenBId);
    const tokenPairB = TokenPair.from(tokenBId, tokenAId);
    const poolKeyA = PoolKey.fromTokenPair(tokenPairA);
    const poolKeyB = PoolKey.fromTokenPair(tokenPairB);
    expect(poolKeyA.toBase58()).toEqual(poolKeyB.toBase58());
  });

  it("should be different for different tokens", async () => {
    const tokenAId = TokenId.from(0);
    const tokenBId = TokenId.from(1);
    const tokenCId = TokenId.from(2);
    const tokenPairA = TokenPair.from(tokenAId, tokenBId);
    const tokenPairB = TokenPair.from(tokenAId, tokenCId);
    const poolKeyA = PoolKey.fromTokenPair(tokenPairA);
    const poolKeyB = PoolKey.fromTokenPair(tokenPairB);
    expect(poolKeyA.toBase58()).not.toEqual(poolKeyB.toBase58());
  });
});
