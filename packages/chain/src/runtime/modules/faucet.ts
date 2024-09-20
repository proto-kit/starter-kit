import { Balance, TokenId } from "@proto-kit/library";
import { RuntimeModule, runtimeMethod, runtimeModule } from "@proto-kit/module";
import { PublicKey } from "o1js";
import { inject } from "tsyringe";
import { Balances } from "./balances";

/**
 *
 * @author kaupangdx https://github.com/kaupangdx/kaupangdx-new
 * @author marcuspang https://github.com/marcuspang/ethglobal-singapore
 */
@runtimeModule()
export class Faucet extends RuntimeModule {
  public constructor(@inject("Balances") public balances: Balances) {
    super();
  }

  public async drip(tokenId: TokenId, address: PublicKey, amount: Balance) {
    await this.balances.mint(tokenId, address, amount);
  }

  @runtimeMethod()
  public async dripSigned(tokenId: TokenId, amount: Balance) {
    await this.drip(tokenId, this.transaction.sender.value, amount);
  }
}
