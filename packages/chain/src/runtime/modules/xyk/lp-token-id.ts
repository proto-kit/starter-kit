import { TokenId } from "@proto-kit/library";
import { Poseidon } from "o1js";
import { TokenPair } from "./token-pair";

/**
 * Represents an LP token ID, deriven from the underlying token pair.
 *
 * @author kaupangdx https://github.com/kaupangdx/kaupangdx-new
 * @author marcuspang https://github.com/marcuspang/ethglobal-singapore
 */
export class LPTokenId extends TokenId {
  public static fromTokenPair(tokenPair: TokenPair): TokenId {
    return TokenId.from(Poseidon.hash(TokenPair.toFields(tokenPair)));
  }
}
