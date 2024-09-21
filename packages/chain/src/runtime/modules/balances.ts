import {
  Balance,
  BalancesKey,
  Balances as BaseBalances,
  TokenId,
} from "@proto-kit/library";
import { runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { Bool, PublicKey } from "o1js";
import { inject } from "tsyringe";
import { TokenRegistry } from "./tokens";

interface BalancesConfig {
  totalSupply: Balance;
}

@runtimeModule()
export class Balances extends BaseBalances<BalancesConfig> {
  @state() public totalSupply = StateMap.from<TokenId, Balance>(
    TokenId,
    Balance
  );

  public constructor(
    @inject("TokenRegistry") public tokenRegistry: TokenRegistry
  ) {
    super();
  }

  @runtimeMethod()
  public async addBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ): Promise<void> {
    // Check if current tokenId is already in registry
    const tokenIdId = await this.tokenRegistry.tokenIdToTokenIdId.get(tokenId);
    // If not, add it
    if (tokenIdId.isSome.equals(Bool(false))) {
      await this.tokenRegistry.addTokenId(tokenId);
    }
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
