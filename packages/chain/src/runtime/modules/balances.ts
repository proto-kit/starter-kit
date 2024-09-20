import { runtimeModule, state, runtimeMethod } from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { Balance, Balances as BaseBalances, TokenId } from "@proto-kit/library";
import { PublicKey } from "o1js";

interface BalancesConfig {
  totalSupply: Balance;
}

@runtimeModule()
export class Balances extends BaseBalances<BalancesConfig> {
  @state() public tokenSupply = StateMap.from<TokenId, Balance>(
    TokenId,
    Balance
  );

  @runtimeMethod()
  public async addBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ): Promise<void> {
    const tokenSupply = await this.tokenSupply.get(tokenId);
    const newTokenSupply = Balance.from(tokenSupply.value).add(amount);
    await this.tokenSupply.set(tokenId, newTokenSupply);
    assert(
      newTokenSupply.lessThanOrEqual(this.config.totalSupply),
      "Circulating supply would be higher than total supply"
    );
    await this.tokenSupply.set(tokenId, newTokenSupply);
    await this.mint(tokenId, address, amount);
  }

  @runtimeMethod()
  public async removeBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ): Promise<void> {
    const tokenSupply = await this.tokenSupply.get(tokenId);
    const newTokenSupply = Balance.from(tokenSupply.value).sub(amount);
    await this.tokenSupply.set(tokenId, newTokenSupply);
    await this.burn(tokenId, address, amount);
  }

  public getTokenSupply(tokenId: TokenId) {
    return this.tokenSupply.get(tokenId);
  }
}
