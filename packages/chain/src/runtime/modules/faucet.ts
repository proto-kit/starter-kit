import { Balance, TokenId } from "@proto-kit/library";
import { RuntimeModule, runtimeMethod, runtimeModule } from "@proto-kit/module";
import { Bool, Provable, PublicKey } from "o1js";
import { inject } from "tsyringe";
import { Balances } from "./balances";
import { TokenRegistry } from "./token-registry";
import "reflect-metadata";

/**
 *
 * @author kaupangdx https://github.com/kaupangdx/kaupangdx-new
 * @author marcuspang https://github.com/marcuspang/ethglobal-singapore
 */
@runtimeModule()
export class Faucet extends RuntimeModule {
  public constructor(
    @inject("Balances") public balances: Balances,
    @inject("TokenRegistry") public tokenRegistry: TokenRegistry
  ) {
    super();
  }

  public async drip(tokenId: TokenId, address: PublicKey, amount: Balance) {
    // Check if current tokenId is already in registry
    const tokenIdId = await this.tokenRegistry.tokenIdToTokenIdId.get(tokenId);
    // If not, add it
    if (tokenIdId.isSome.equals(Bool(false))) {
      await this.tokenRegistry.addTokenId(tokenId);
    }
    await this.balances.addBalance(tokenId, address, amount);
  }

  @runtimeMethod()
  public async dripSigned(tokenId: TokenId, amount: Balance) {
    await this.drip(tokenId, this.transaction.sender.value, amount);
  }
}
