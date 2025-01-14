import { sleep } from "@proto-kit/common";
import { fetchLastBlock, Provable } from "o1js";

const maxAttempts = 24;
const delay = 5000;
const graphqlEndpoint = `${process.env.MINA_NODE_GRAPHQL_HOST!}:${process.env.MINA_NODE_GRAPHQL_PORT!}/graphql`;
let lastBlock;
let attempt = 0;

console.log(`Checking if network is ready...`);
while (!lastBlock) {
  attempt++;
  if (attempt > maxAttempts) {
    throw new Error(
      `Network was still not ready after ${(delay / 1000) * (attempt - 1)}s`
    );
  }
  try {
    lastBlock = await fetchLastBlock(graphqlEndpoint);
  } catch (e) {}
  await sleep(delay);
}

Provable.log("Network is ready", lastBlock);
