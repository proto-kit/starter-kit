import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useEffect, useState } from "react";

export interface ComputedTransactionJSON {
  argsFields: string[];
  argsJSON: string[];
  methodId: string;
  nonce: string;
  sender: string;
  signature: {
    r: string;
    s: string;
  };
}

export interface ComputedBlockJSON {
  txs?: {
    status: boolean;
    statusMessage?: string;
    tx: ComputedTransactionJSON;
  }[];
}

export interface ChainState {
  loading: boolean;
  block?: {
    height: string;
  } & ComputedBlockJSON;
  loadBlock: () => Promise<void>;
}

export interface BlockQueryResponse {
  data: {
    network: {
      unproven?: {
        block: {
          height: string;
        };
      };
    };
    block: ComputedBlockJSON;
  };
}

export const useChainStore = create<ChainState, [["zustand/immer", never]]>(
  immer((set) => ({
    loading: Boolean(false),
    async loadBlock() {
      set((state) => {
        state.loading = true;
      });

      const graphql = process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL;
      if (graphql === undefined) {
        throw new Error(
          "Environment variable NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL not set, can't execute graphql requests",
        );
      }

      const response = await fetch(graphql, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetBlock {
              block {
                txs {
                  tx {
                    argsFields
                    auxiliaryData
                    methodId
                    nonce
                    sender
                    signature {
                      r
                      s
                    }
                  }
                  status
                  statusMessage
                }
              }
              network {
                unproven {
                  block {
                    height
                  }
                }
              }
            }
          `,
        }),
      });

      const { data } = (await response.json()) as BlockQueryResponse;

      set((state) => {
        state.loading = false;
        state.block = data.network.unproven
          ? {
              height: data.network.unproven.block.height,
              ...data.block,
            }
          : undefined;
      });
    },
  })),
);

export const tickInterval = 1000;
export const usePollBlockHeight = () => {
  const [tick, setTick] = useState(0);
  const chain = useChainStore();

  useEffect(() => {
    chain.loadBlock();
  }, [tick]);

  useEffect(() => {
    const intervalId = setInterval(
      () => setTick((tick) => tick + 1),
      tickInterval,
    );

    setTick((tick) => tick + 1);

    return () => clearInterval(intervalId);
  }, []);
};
