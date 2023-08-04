import {
  RuntimeModule,
  State,
  runtimeModule,
  state,
  StateMap,
  runtimeMethod,
  assert,
} from "@proto-kit/module";
import { Provable, PublicKey, UInt64 } from "snarkyjs";

interface BalancesConfig {
  totalSupply: UInt64;
}

@runtimeModule()
export class Balances extends RuntimeModule<BalancesConfig> {
  @state() public balances = StateMap.from<PublicKey, UInt64>(
    PublicKey,
    UInt64
  );

  @state() public circulatingSupply = State.from<UInt64>(UInt64);

  @runtimeMethod()
  public setBalance(address: PublicKey, amount: UInt64) {
    const circulatingSupply = this.circulatingSupply.get();
    const newCirculatingSupply = circulatingSupply.value.add(amount);

    assert(
      newCirculatingSupply.lessThanOrEqual(this.config.totalSupply),
      "Circulating supply would be higher than total supply"
    );

    this.circulatingSupply.set(newCirculatingSupply);

    const currentBalance = this.balances.get(address);
    const newBalance = currentBalance.value.add(amount);

    this.balances.set(address, newBalance);
  }

  @runtimeMethod()
  public transfer(from: PublicKey, to: PublicKey, amount: UInt64) {
    const fromBalance = this.balances.get(from);
    const toBalance = this.balances.get(to);

    assert(
      fromBalance.value.greaterThanOrEqual(amount),
      "From balance is not sufficient"
    );

    const safeFromBalance = Provable.if(
      fromBalance.value.greaterThanOrEqual(amount),
      fromBalance.value,
      amount
    );

    const newFromBalance = safeFromBalance.sub(amount);
    const newToBalance = toBalance.value.add(amount);

    this.balances.set(from, newFromBalance);
    this.balances.set(to, newToBalance);
  }
}
