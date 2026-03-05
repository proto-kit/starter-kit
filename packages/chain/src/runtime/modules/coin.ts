import { runtimeMethod, RuntimeModule, runtimeModule } from "@proto-kit/module";
import { State, state } from "@proto-kit/protocol";
import { Balance } from "@proto-kit/library";

@runtimeModule()
export class Balances extends RuntimeModule {
  @state() public circulatingSupply = State.from<Balance>(Balance);

  @runtimeMethod()
  public async transfer() {

  }
}
