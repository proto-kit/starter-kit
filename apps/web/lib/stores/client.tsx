import { client } from "chain";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type Client = typeof client;
export interface ClientState {
  loading: boolean;
  client?: Client;
  start: () => Promise<void>;
}

export const useClientStore = create<ClientState, [["zustand/immer", never]]>(
  immer((set) => ({
    loading: Boolean(false),
    async start() {
      set((state) => {
        state.loading = true;
      });

      await client.start();

      set((state) => {
        state.loading = false;
        state.client = client as any;
      });
    },
  })),
);
