import "reflect-metadata";
import { modules } from "../../src/index";
import { TokenId, BalancesKey, UInt64 } from "@proto-kit/library";
import { PrivateKey, PublicKey } from "o1js";
import setup from "../setup";
import { PublicKeyOption } from "@proto-kit/protocol";

const proofsEnabled = process.env.PROOFS_ENABLED === "true";

describe("balances", () => {
  const {
    runtime,
    stateService,
    context,
    clearState,
    compile,
    prove,
    clearContext,
  } = setup(modules, proofsEnabled);

  let balances: InstanceType<(typeof modules)["Balances"]>;

  // test data
  const alice = PrivateKey.random().toPublicKey();
  const bob = PrivateKey.random().toPublicKey();
  const tokenId = TokenId.from(0);
  const amount = UInt64.from(1000);

  beforeAll(async () => {
    runtime.configure({
      Balances: {},
    });

    balances = runtime.resolve("Balances");

    // compile the runtime circuits
    await compile();
  });

  describe("transferSigned", () => {
    // function to reset the pre-transaction state & context
    function clearAndHydrate() {
      clearContext();
      clearState();

      // setup the runtime context
      context.input!.transaction.sender = PublicKeyOption.fromSome(alice);

      // hydrate the state
      stateService.set(
        balances.balances.getPath(
          new BalancesKey({
            tokenId,
            address: alice,
          })
        ),
        [amount.value]
      );
    }

    beforeEach(() => {
      clearAndHydrate();
    });

    it("should transfer tokens from alice to bob", async () => {
      // execute the runtime method
      await balances.transferSigned(tokenId, alice, bob, amount);

      const aliceBalance = await balances.balances.get(
        new BalancesKey({ tokenId, address: alice })
      );
      const bobBalance = await balances.balances.get(
        new BalancesKey({ tokenId, address: bob })
      );

      // expect a certain execution result
      expect(context.result.status.toBoolean()).toBe(true);
      expect(context.result.statusMessage).toBeUndefined();

      // expect state to reflect successful transfer
      expect(aliceBalance.value.toString()).toBe("0");
      expect(bobBalance.value.toString()).toBe(amount.value.toString());

      clearAndHydrate();

      // generate the proof
      const proof = await prove();

      expect(proof.publicOutput.status.toBoolean()).toBe(true);
    });

    it("should not transfer tokens from alice to bob due to insufficient balance", async () => {
      await balances.transferSigned(
        tokenId,
        alice,
        bob,
        amount.add(UInt64.from(1))
      );

      expect(context.result.status.toBoolean()).toBe(false);
      expect(context.result.statusMessage).toBe("From balance is insufficient");

      /**
       * No point in inspecting the state here, since it would have been rolled back due to the failed execution.
       * Since no state service rollback is performed based on runtime execution result,
       * the state will have all the runtime state changes applied.
       */

      const proof = await prove();

      expect(proof.publicOutput.status.toBoolean()).toBe(false);
    });
  });

  describe("setAdmin", () => {
    describe("when the admin is not set", () => {
      function clearAndHydrate() {
        clearContext();
        clearState();

        context.input!.transaction.sender = PublicKeyOption.fromSome(alice);
      }

      beforeEach(() => {
        clearAndHydrate();
      });

      it("should set the admin", async () => {
        await balances.setAdmin(alice);

        const admin = await balances.admin.get();

        expect(context.result.status.toBoolean()).toBe(true);
        expect(context.result.statusMessage).toBeUndefined();
        expect(admin.value.toBase58()).toBe(alice.toBase58());

        clearAndHydrate();

        const proof = await prove();

        expect(proof.publicOutput.status.toBoolean()).toBe(true);
      });
    });

    describe("when the admin is set", () => {
      function clearAndHydrate(sender: PublicKey) {
        clearContext();
        clearState();

        context.input!.transaction.sender = PublicKeyOption.fromSome(sender);

        stateService.set(
          balances.admin.path!,
          PublicKeyOption.fromSome(bob).value.toFields()
        );
      }

      describe("when the sender is not the admin", () => {
        beforeEach(() => {
          clearAndHydrate(alice);
        });

        it("should not set the admin", async () => {
          await balances.setAdmin(alice);

          expect(context.result.status.toBoolean()).toBe(false);
          expect(context.result.statusMessage).toBe(
            "Only the admin can set the admin, unless the admin has not been set yet"
          );

          clearAndHydrate(alice);

          const proof = await prove();

          expect(proof.publicOutput.status.toBoolean()).toBe(false);
        });
      });

      describe("when the sender is the admin", () => {
        beforeEach(() => {
          clearAndHydrate(bob);
        });

        it("should set the admin", async () => {
          await balances.setAdmin(alice);

          const admin = await balances.admin.get();

          expect(context.result.status.toBoolean()).toBe(true);
          expect(context.result.statusMessage).toBeUndefined();
          expect(admin.value.toBase58()).toBe(alice.toBase58());

          clearAndHydrate(bob);

          const proof = await prove();

          expect(proof.publicOutput.status.toBoolean()).toBe(true);
        });
      });
    });
  });

  describe("mint", () => {
    // function to reset the pre-mint state & context
    function clearAndHydrate(sender: PublicKey) {
      clearContext();
      clearState();

      // setup the runtime context
      context.input!.transaction.sender = PublicKeyOption.fromSome(sender);

      // set the admin address
      stateService.set(
        balances.admin.path!,
        PublicKeyOption.fromSome(alice).value.toFields() // Set Alice as the admin
      );
    }

    describe("when the sender is the admin", () => {
      beforeEach(() => {
        clearAndHydrate(alice);
      });

      it("should mint tokens to alice", async () => {
        await balances.mint(tokenId, alice, amount);

        const aliceBalance = await balances.balances.get(
          new BalancesKey({ tokenId, address: alice })
        );

        expect(context.result.status.toBoolean()).toBe(true);
        expect(context.result.statusMessage).toBeUndefined();
        expect(aliceBalance.value.toString()).toBe(amount.value.toString());

        clearAndHydrate(alice);

        const proof = await prove();

        expect(proof.publicOutput.status.toBoolean()).toBe(true);
      });
    });

    describe("when the sender is not the admin", () => {
      beforeEach(() => {
        clearAndHydrate(bob);
      });

      it("should not mint tokens to alice", async () => {
        await balances.mint(tokenId, bob, amount);

        expect(context.result.status.toBoolean()).toBe(false);
        expect(context.result.statusMessage).toBe("Only the admin can mint");

        clearAndHydrate(bob);

        const proof = await prove();

        expect(proof.publicOutput.status.toBoolean()).toBe(false);
      });
    });
  });
});
