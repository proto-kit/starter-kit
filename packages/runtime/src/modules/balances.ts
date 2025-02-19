import { runtimeMethod, runtimeModule } from "@proto-kit/module";
import { TokenId, UInt64, Balances as BaseBalances } from "@proto-kit/library";
import { assert, State, state } from "@proto-kit/protocol";
import { PublicKey } from "o1js";

/**
 * Balances module implementation providing a multi-token ledger with
 * transfers, minting, and burning.
 * @extends BaseBalances
 */
@runtimeModule()
export class Balances extends BaseBalances {
  @state()
  public admin = State.from<PublicKey>(PublicKey);

  @runtimeMethod()
  public async setAdmin(admin: PublicKey) {
    const currentAdmin = await this.admin.get();
    const isAdmin = this.transaction.sender.value
      .equals(currentAdmin.value)
      .or(currentAdmin.isSome.not());

    assert(
      isAdmin,
      "Only the admin can set the admin, unless the admin has not been set yet"
    );

    await this.admin.set(admin);
  }

  @runtimeMethod()
  public async mint(tokenId: TokenId, address: PublicKey, amount: UInt64) {
    const admin = await this.admin.get();

    assert(
      this.transaction.sender.value.equals(admin.value),
      "Only the admin can mint"
    );

    await super.mint(tokenId, address, amount);
  }
}
