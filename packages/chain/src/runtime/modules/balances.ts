import { runtimeModule, state, runtimeMethod } from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import {
  Balance,
  BalancesKey,
  Balances as BaseBalances,
  TokenId,
} from "@proto-kit/library";
import { Provable, PublicKey } from "o1js";

interface BalancesConfig {
  totalSupply: Balance;
}

@runtimeModule()
export class Balances extends BaseBalances<BalancesConfig> {
  @state() public totalSupply = StateMap.from<TokenId, Balance>(
    TokenId,
    Balance
  );

  @runtimeMethod()
  public async addBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ): Promise<void> {
    const key = BalancesKey.from(tokenId, address);
    const balance = await this.balances.get(key);
    const newBalance = Balance.from(balance.value).add(amount);
    assert(
      newBalance.lessThanOrEqual(this.config.totalSupply),
      "Circulating supply would be higher than total supply"
    );
    await this.totalSupply.set(tokenId, newBalance);
    await this.mint(tokenId, address, amount);
  }

  @runtimeMethod()
  public async removeBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ): Promise<void> {
    const key = BalancesKey.from(tokenId, address);
    const balance = await this.balances.get(key);
    assert(
      Balance.from(balance.value).greaterThanOrEqual(amount),
      "Insufficient balance"
    );
    const newBalance = Balance.from(balance.value).sub(amount);
    await this.totalSupply.set(tokenId, newBalance);
    await this.burn(tokenId, address, amount);
  }

  public getTokenSupply(tokenId: TokenId) {
    return this.totalSupply.get(tokenId);
  }
}
