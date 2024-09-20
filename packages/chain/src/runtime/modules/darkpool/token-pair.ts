import { TokenId } from "@proto-kit/library";
import { Provable, Struct } from "o1js";

/**
 * Represents a pair of tokens, ordered by their token ids.
 *
 * @author kaupangdx https://github.com/kaupangdx/kaupangdx-new
 * @author marcuspang https://github.com/marcuspang/ethglobal-singapore
 */
export class TokenPair extends Struct({
  tokenAId: TokenId,
  tokenBId: TokenId,
}) {
  public static from(tokenA: TokenId, tokenB: TokenId): TokenPair {
    // order tokenA & tokenB based on the TokenId values
    return Provable.if(
      tokenA.greaterThan(tokenB),
      TokenPair,
      new TokenPair({ tokenAId: tokenA, tokenBId: tokenB }),
      new TokenPair({ tokenAId: tokenB, tokenBId: tokenA })
    );
  }
}
