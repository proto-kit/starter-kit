import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod,
} from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Field, Provable, PublicKey, Struct, UInt64 } from "o1js";

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
  public addBalance(address: PublicKey, amount: UInt64): void {
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
}
