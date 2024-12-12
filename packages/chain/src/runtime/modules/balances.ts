import {
  runtimeModule,
  state,
  runtimeMethod,
  runtimeMessage,
} from "@proto-kit/module";
import { Deposit, State, assert } from "@proto-kit/protocol";
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
  public async addBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ): Promise<void> {
    const circulatingSupply = await this.circulatingSupply.get();
    const newCirculatingSupply = Balance.from(circulatingSupply.value).add(
      amount
    );
    assert(
      newCirculatingSupply.lessThanOrEqual(this.config.totalSupply),
      "Circulating supply would be higher than total supply"
    );
    await this.circulatingSupply.set(newCirculatingSupply);
    await this.mint(tokenId, address, amount);
  }

  @runtimeMessage()
  public async deposit(deposit: Deposit) {
    const key = new BalancesKey({
      tokenId: TokenId.from(0),
      address: deposit.address,
    });
    const balance = await this.balances.get(key);
    await this.balances.set(
      key,
      balance.value.add(Balance.Unsafe.fromField(deposit.amount.value))
    );
  }
}
