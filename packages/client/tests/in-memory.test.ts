import { Balance, BalancesKey } from "@proto-kit/library";
import client from "../src/in-memory";
import { ChildProcess, spawn } from "child_process";
import { sleep } from "@proto-kit/common";
import { Field, PrivateKey, TokenId } from "o1js";

const waitForAttempts = 30;
const waitForInterval = 1000;

async function waitForSequencer() {
  for (let i = 0; i < waitForAttempts; i++) {
    try {
      const data = await fetch(
        `${process.env.PROTOKIT_GRAPHQL_PROTOCOL}://${process.env.PROTOKIT_GRAPHQL_HOST}:${process.env.PROTOKIT_GRAPHQL_PORT}${process.env.PROTOKIT_GRAPHQL_PATH}`
      );
      if (data.status === 200) {
        console.log("Sequencer is running");
        return;
      }
    } catch (error) {
      if (i === waitForAttempts - 1) {
        throw new Error("Sequencer not running");
      }
    }
    await sleep(waitForInterval);
  }
}

describe("in-memory", () => {
  let sequencerProcess: ChildProcess;

  beforeAll(async () => {
    sequencerProcess = spawn(
      "node",
      [
        "--loader",
        "ts-node/esm",
        "--experimental-vm-modules",
        "--es-module-specifier-resolution=node",
        "--experimental-wasm-modules",
        "tests/start-sequencer.ts",
      ],
      {
        stdio: "pipe",
      }
    );

    sequencerProcess.stdout?.on("data", (data) => console.log(data.toString()));
    sequencerProcess.stderr?.on("data", (data) => console.log(data.toString()));

    await waitForSequencer();
  }, 600000);

  afterAll(async () => {
    sequencerProcess.kill();
  });

  it("should be able to create a client", async () => {
    await client.start();

    const balance = await client.query.runtime.Balances.balances.get(
      new BalancesKey({
        tokenId: TokenId.fromValue(0n),
        address: PrivateKey.random().toPublicKey(),
      })
    );

    const alicePrivateKey = PrivateKey.random();

    // set the signer
    client.resolve("Signer").config.signer = alicePrivateKey;

    const balances = client.runtime.resolve("Balances");
    const tx = await client.transaction(
      alicePrivateKey.toPublicKey(),
      async () => {
        balances.mint(
          TokenId.fromValue(0n),
          alicePrivateKey.toPublicKey(),
          Balance.Safe.fromField(Field(100))
        );
      }
    );

    await tx.sign();
    await tx.send();

    const hash = tx.transaction!.hash().toString();

    console.log("balance", balance?.toString());
    console.log("hash", hash);

    await sleep(3000);

    const status = await fetch(
      `${process.env.PROTOKIT_GRAPHQL_PROTOCOL}://${process.env.PROTOKIT_GRAPHQL_HOST}:${process.env.PROTOKIT_GRAPHQL_PORT}${process.env.PROTOKIT_GRAPHQL_PATH}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `{
            transactionState(hash: "${hash}") 
          }`,
        }),
      }
    );

    const {
      data: { transactionState },
    } = (await status.json()) as {
      data: { transactionState: string };
    };

    expect(balance).toBeUndefined();
    expect(transactionState).toBe("PENDING");
  }, 600000);
});
