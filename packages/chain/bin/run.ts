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
  produceEmptyBlocks: true,
  interval: 5_000,
};

setInterval(async () => {
  try {
    const txs = await mempool.getTxs();
    txs.forEach((tx) => {
      tx.toProtocolTransaction;
    });
    console.log("found txs", txs.length);
    if (txs.length > 0 || conf.produceEmptyBlocks) {
      const x = await trigger.produceUnproven();
      console.log("producing block #", x?.height.toString());
    }
  } catch (e) {
    console.error(e);
  }
}, conf.interval);
