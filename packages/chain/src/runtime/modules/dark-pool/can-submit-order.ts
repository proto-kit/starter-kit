import {
  Bool,
  Field,
  MerkleMapWitness,
  Poseidon,
  Struct,
  ZkProgram,
} from "o1js";
import { PoolKey } from "../xyk/pool-key";
import { Order } from ".";
import { assert } from "@proto-kit/protocol";

class CanSubmitOrderPublicInput extends Struct({
  poolKey: PoolKey,
  stateRoot: Field,
}) {}

class CanSubmitOrderPublicOutput extends Struct({
  poolKey: PoolKey,
  canSubmit: Bool,
  encryptedOrderField: Field,
}) {}

export async function canSubmitOrder(
  input: CanSubmitOrderPublicInput,
  witness: MerkleMapWitness,
  order: Order
) {
  const [computedRoot, key] = witness.computeRootAndKeyV2(Bool(true).toField());
  assert(input.stateRoot.equals(computedRoot));

  const userKey = Poseidon.hash(order.user.toFields());
  assert(userKey.equals(key));

  return new CanSubmitOrderPublicOutput({
    poolKey: input.poolKey,
    canSubmit: Bool(true),
    encryptedOrderField: order.hash(),
  });
}

export const canSubmitOrderProgram = ZkProgram({
  name: "canSubmitOrder",
  publicInput: CanSubmitOrderPublicInput,
  publicOutput: CanSubmitOrderPublicOutput,
  methods: {
    canSubmitOrder: {
      privateInputs: [MerkleMapWitness, Order],
      method: canSubmitOrder,
    },
  },
});

export class CanSubmitOrderProof extends ZkProgram.Proof(
  canSubmitOrderProgram
) {}
