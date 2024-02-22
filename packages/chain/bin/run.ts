#!/usr/bin/env node --experimental-specifier-resolution=node --experimental-vm-modules --experimental-wasm-modules --experimental-wasm-threads

import { ManualBlockTrigger, PrivateMempool } from "@proto-kit/sequencer";
import appChain from "../src/chain.config";

await appChain.start();

const trigger: ManualBlockTrigger = appChain.sequencer.resolveOrFail(
  "BlockTrigger",
  ManualBlockTrigger,
);

const mempool: PrivateMempool = appChain.sequencer.resolveOrFail(
  "Mempool",
  PrivateMempool,
);

const conf = {
  interval: parseInt(process.env.BLOCK_INTERVAL || "") || 5000,
  produceEmptyBlocks:
    process.env.PRODUCE_EMPTY_BLOCKS === "true" ? true : false,
};

setInterval(async () => {
  try {
    const txs = await mempool.getTxs();
    txs.forEach((tx) => {
      tx.toProtocolTransaction;
    });
    if (txs.length) console.log("txs", txs.length);
    if (txs.length > 0 || conf.produceEmptyBlocks) {
      const x = await trigger.produceUnproven();
      console.log(`Block #${x?.height.toString()}`);
    }
  } catch (e) {
    console.error(e);
  }
}, conf.interval);
