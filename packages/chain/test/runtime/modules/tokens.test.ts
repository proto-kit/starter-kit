import { TokenId, UInt64 } from "@proto-kit/library";
import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey } from "o1js";
import "reflect-metadata";
import { Balances } from "../../../src/runtime/modules/balances";
import {
  TokenIdId,
  TokenRegistry,
} from "../../../src/runtime/modules/token-registry";

describe("tokens", () => {
  it("should create and fetch 3 tokens with different token IDs", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
      TokenRegistry,
    });

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        TokenRegistry: {
          maxTokens: UInt64.from(100),
        },
      },
    });

    await appChain.start();
    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    const tokenIds = [TokenId.from(0), TokenId.from(1), TokenId.from(2)];

    appChain.setSigner(alicePrivateKey);

    const tokenRegistry = appChain.runtime.resolve("TokenRegistry");

    // Create 3 tokens
    for (const tokenId of tokenIds) {
      const tx = await appChain.transaction(alice, async () => {
        await tokenRegistry.addTokenId(tokenId);
      });

      await tx.sign();
      await tx.send();

      const block = await appChain.produceBlock();
      expect(block?.transactions[0].status.toBoolean()).toBe(true);
    }

    // Verify token existence in registry
    const lastTokenIdId =
      await appChain.query.runtime.TokenRegistry.lastTokenIdId.get();
    expect(lastTokenIdId).toEqual(UInt64.from(2));

    for (let i = TokenIdId.from(0); i.lessThan(lastTokenIdId!); i.add(1)) {
      const exists =
        await appChain.query.runtime.TokenRegistry.tokenIdToTokenIdId.get(i);
      expect(exists).toBeDefined();
    }
  });
});
