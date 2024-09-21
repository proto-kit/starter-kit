import { TokenId } from "@proto-kit/library";
import { Bool, MerkleMap, Poseidon, PrivateKey, UInt64 } from "o1js";
import { Order } from "../../../../src/runtime/modules/dark-pool";
import { canSubmitOrderProgram } from "../../../../src/runtime/modules/dark-pool/can-submit-order";
import { PoolKey } from "../../../../src/runtime/modules/xyk/pool-key";
import { TokenPair } from "../../../../src/runtime/modules/xyk/token-pair";

describe("DarkPool can submit order", () => {
  const aliceKey = PrivateKey.random();
  const alice = aliceKey.toPublicKey();
  const tokenA = TokenId.from(1);
  const tokenB = TokenId.from(2);
  const poolKey = PoolKey.fromTokenPair(TokenPair.from(tokenA, tokenB));
  const order = new Order({
    user: alice,
    amountIn: UInt64.from(1000),
    amountOut: UInt64.from(900),
    isAtoB: Bool(true),
  });

  it("should submit order if in merkle tree", async () => {
    const map = new MerkleMap();
    const key = Poseidon.hash(alice.toFields());
    map.set(key, Bool(true).toField());

    const witness = map.getWitness(key);

    await canSubmitOrderProgram.compile();

    const proof = await canSubmitOrderProgram.canSubmitOrder(
      {
        poolKey: poolKey,
        stateRoot: map.getRoot(),
      },
      witness,
      order
    );

    expect(proof.publicOutput.canSubmit).toBe(true);
    expect(proof.publicOutput.poolKey.toBase58()).toEqual(poolKey.toBase58());
  });

  it("should not submit order if not in merkle tree", async () => {
    const map = new MerkleMap();
    const key = Poseidon.hash(alice.toFields());
    map.set(key, Bool(true).toField());

    const witness = map.getWitness(key);

    await canSubmitOrderProgram.compile();

    const proof = await canSubmitOrderProgram.canSubmitOrder(
      {
        poolKey,
        stateRoot: map.getRoot(),
      },
      witness,
      order
    );

    expect(proof.publicOutput.canSubmit).toBe(false);
    expect(proof.publicOutput.poolKey.toBase58()).toEqual(poolKey.toBase58());
  });
});
