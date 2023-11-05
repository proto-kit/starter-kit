"use client";
import { useCallback, useEffect, useState } from "react";
import { client } from "chain";
import { Provable } from "o1js";
await client.start();

const useBlockHeightInterval = 1000;
function useBlockHeight() {
  const [blockHeight, setBlockHeight] = useState("0");

  const getBlockHeight = useCallback(async () => {
    const response = await fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `{
          network {
            block {
              height
            }
          }
        }`,
      }),
    });

    const body = await response.json();
    return body.data.network.block.height ?? "0";
  }, []);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const blockHeight = await getBlockHeight();
      setBlockHeight(blockHeight);
    }, useBlockHeightInterval);

    return () => clearInterval(intervalId);
  }, [getBlockHeight]);

  useEffect(() => {
    void (async () => {
      const blockHeight = await getBlockHeight();
      console.log("blockHeight", blockHeight);
      setBlockHeight(blockHeight);
    })();
  }, []);

  return blockHeight;
}

export default function BlockHeight({
  onBlockHeightChange,
}: {
  onBlockHeightChange: (blockheight: string) => void;
}) {
  const blockHeight = useBlockHeight();
  useEffect(() => {
    onBlockHeightChange(blockHeight);
  }, [blockHeight]);
  return <>Blockheight: {blockHeight}</>;
}
