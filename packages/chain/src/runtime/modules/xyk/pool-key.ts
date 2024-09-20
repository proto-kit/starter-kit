import { Group, Poseidon, PublicKey } from "o1js";
import { TokenPair } from "./token-pair";

/**
 * Represents a public key corresponding to a pool, based on tokenA & tokenB in the pool.
 *
 * @author kaupangdx https://github.com/kaupangdx/kaupangdx-new
 * @author marcuspang https://github.com/marcuspang/ethglobal-singapore
 */
export class PoolKey extends PublicKey {
  /**
   * Creates a PoolKey from the provided token pair, by
   * converting the token pair's hash to a public key via a common group element.
   */
  public static fromTokenPair(tokenPair: TokenPair): PoolKey {
    const group = Poseidon.hashToGroup(TokenPair.toFields(tokenPair));
    const key = PoolKey.fromGroup(group);
    return key;
  }
}
