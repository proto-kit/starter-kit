import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod,
} from "@proto-kit/module";
import { State, assert } from "@proto-kit/protocol";
import {
  Balance,
  BalancesKey,
  Balances as BaseBalances,
  TokenId,
} from "@proto-kit/library";
import { PublicKey } from "o1js";

interface BalancesConfig {
  totalSupply: Balance;
}

@runtimeModule()
export class Balances extends BaseBalances<BalancesConfig> {
  @state() public circulatingSupply = State.from<Balance>(Balance);

  @runtimeMethod()
  public addBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ): void {
    const circulatingSupply = this.circulatingSupply.get();
    const newCirculatingSupply = Balance.from(circulatingSupply.value).add(
      amount
    );
    assert(
      newCirculatingSupply.lessThanOrEqual(this.config.totalSupply),
      "Circulating supply would be higher than total supply"
    );
    this.circulatingSupply.set(newCirculatingSupply);
    const currentBalance = this.getBalance(tokenId, address);
    const newBalance = currentBalance.add(amount);
    this.setBalance(tokenId, address, newBalance);
  }
}
