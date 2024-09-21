import { toast } from "@/components/ui/use-toast";
import { isPendingTransaction } from "@/lib/utils";
import { Balance, TokenId } from "@proto-kit/library";
import { PendingTransaction } from "@proto-kit/sequencer";
import { useMutation } from "@tanstack/react-query";
import type { TokenIdPath } from "chain/dist/runtime/modules/xyk";
import { PoolKey } from "chain/dist/runtime/modules/xyk/pool-key";
import { TokenPair } from "chain/dist/runtime/modules/xyk/token-pair";
import { PublicKey } from "o1js";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Client, useClientStore } from "./client";
import { useWalletStore } from "./wallet";

export interface PoolsState {
  loading: boolean;
  pools: Record<
    string,
    {
      tokenIn: string;
      tokenOut: string;
    }
  >;
  createPool: (
    client: Client,
    sender: PublicKey,
    tokenAId: TokenId,
    tokenBId: TokenId,
    tokenAAmount: Balance,
    tokenBAmount: Balance,
  ) => Promise<PendingTransaction>;
  addLiquidity: (
    client: Client,
    sender: PublicKey,
    tokenAId: TokenId,
    tokenBId: TokenId,
    tokenAAmount: Balance,
    tokenBAmountLimit: Balance,
  ) => Promise<PendingTransaction>;
  removeLiquidity: (
    client: Client,
    sender: PublicKey,
    tokenAId: TokenId,
    tokenBId: TokenId,
    lpTokenAmount: Balance,
    tokenAAmountLimit: Balance,
    tokenBAmountLimit: Balance,
  ) => Promise<PendingTransaction>;
  sellPath: (
    client: Client,
    sender: PublicKey,
    path: TokenIdPath,
    amountIn: Balance,
    amountOutMinLimit: Balance,
  ) => Promise<PendingTransaction>;
  whitelistAddress: (
    client: Client,
    sender: PublicKey,
    poolKey: PoolKey,
    address: PublicKey,
  ) => Promise<PendingTransaction>;
}

export const usePoolsStore = create<PoolsState>()(
  persist(
    (set, get) => ({
      loading: false,
      pools: {},
      async createPool(
        client,
        sender,
        tokenAId,
        tokenBId,
        tokenAAmount,
        tokenBAmount,
      ) {
        const DarkPool = client.runtime.resolve("DarkPool");

        const tx = await client.transaction(sender, async () => {
          await DarkPool.createPoolSigned(
            tokenAId,
            tokenBId,
            tokenAAmount,
            tokenBAmount,
          );
        });

        await tx.sign();
        await tx.send();

        // TODO: optimistic update pools
        const poolKey = PoolKey.fromTokenPair(
          TokenPair.from(tokenAId, tokenBId),
        );
        set((state) => {
          state.pools[poolKey.toBase58()] = {
            tokenIn: tokenAId.toString(),
            tokenOut: tokenBId.toString(),
          };
          return state;
        });

        isPendingTransaction(tx.transaction);
        return tx.transaction;
      },
      async addLiquidity(
        client,
        sender,
        tokenAId,
        tokenBId,
        tokenAAmount,
        tokenBAmountLimit,
      ) {
        const DarkPool = client.runtime.resolve("DarkPool");

        const tx = await client.transaction(sender, async () => {
          await DarkPool.addLiquiditySigned(
            tokenAId,
            tokenBId,
            tokenAAmount,
            tokenBAmountLimit,
          );
        });

        await tx.sign();
        await tx.send();

        isPendingTransaction(tx.transaction);
        return tx.transaction;
      },
      async removeLiquidity(
        client,
        sender,
        tokenAId,
        tokenBId,
        lpTokenAmount,
        tokenAAmountLimit,
        tokenBAmountLimit,
      ) {
        const DarkPool = client.runtime.resolve("DarkPool");

        const tx = await client.transaction(sender, async () => {
          await DarkPool.removeLiquiditySigned(
            tokenAId,
            tokenBId,
            lpTokenAmount,
            tokenAAmountLimit,
            tokenBAmountLimit,
          );
        });

        await tx.sign();
        await tx.send();

        isPendingTransaction(tx.transaction);
        return tx.transaction;
      },
      async sellPath(client, sender, path, amountIn, amountOutMinLimit) {
        const DarkPool = client.runtime.resolve("DarkPool");

        const tx = await client.transaction(sender, async () => {
          await DarkPool.sellPathSigned(path, amountIn, amountOutMinLimit);
        });

        await tx.sign();
        await tx.send();

        isPendingTransaction(tx.transaction);
        return tx.transaction;
      },
      async whitelistAddress(client, sender, poolKey, address) {
        const DarkPool = client.runtime.resolve("DarkPool");

        const tx = await client.transaction(sender, async () => {
          await DarkPool.whitelistUser(address, poolKey);
        });

        await tx.sign();
        await tx.send();

        isPendingTransaction(tx.transaction);
        return tx.transaction;
      },
    }),
    {
      name: "pools",
    },
  ),
);

export const useCreatePool = () => {
  const client = useClientStore();
  const pools = usePoolsStore();
  const wallet = useWalletStore();

  return useMutation({
    mutationFn: async ({
      tokenAId,
      tokenBId,
      tokenAAmount,
      tokenBAmount,
    }: {
      tokenAId: TokenId;
      tokenBId: TokenId;
      tokenAAmount: Balance;
      tokenBAmount: Balance;
    }) => {
      if (!client.client || !wallet.wallet) return;

      const pendingTransaction = await pools.createPool(
        client.client,
        PublicKey.fromBase58(wallet.wallet),
        tokenAId,
        tokenBId,
        tokenAAmount,
        tokenBAmount,
      );

      wallet.addPendingTransaction(pendingTransaction);
      return pendingTransaction;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAddLiquidity = () => {
  const client = useClientStore();
  const pools = usePoolsStore();
  const wallet = useWalletStore();

  return useMutation({
    mutationFn: async ({
      tokenAId,
      tokenBId,
      tokenAAmount,
      tokenBAmountLimit,
    }: {
      tokenAId: TokenId;
      tokenBId: TokenId;
      tokenAAmount: Balance;
      tokenBAmountLimit: Balance;
    }) => {
      if (!client.client || !wallet.wallet) return;

      const pendingTransaction = await pools.addLiquidity(
        client.client,
        PublicKey.fromBase58(wallet.wallet),
        tokenAId,
        tokenBId,
        tokenAAmount,
        tokenBAmountLimit,
      );

      wallet.addPendingTransaction(pendingTransaction);
      return pendingTransaction;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveLiquidity = () => {
  const client = useClientStore();
  const pools = usePoolsStore();
  const wallet = useWalletStore();

  return useMutation({
    mutationFn: async ({
      tokenAId,
      tokenBId,
      lpTokenAmount,
      tokenAAmountLimit,
      tokenBAmountLimit,
    }: {
      tokenAId: TokenId;
      tokenBId: TokenId;
      lpTokenAmount: Balance;
      tokenAAmountLimit: Balance;
      tokenBAmountLimit: Balance;
    }) => {
      if (!client.client || !wallet.wallet) return;

      const pendingTransaction = await pools.removeLiquidity(
        client.client,
        PublicKey.fromBase58(wallet.wallet),
        tokenAId,
        tokenBId,
        lpTokenAmount,
        tokenAAmountLimit,
        tokenBAmountLimit,
      );

      wallet.addPendingTransaction(pendingTransaction);
      return pendingTransaction;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useSellPath = () => {
  const client = useClientStore();
  const pools = usePoolsStore();
  const wallet = useWalletStore();

  return useMutation({
    mutationFn: async ({
      path,
      amountIn,
      amountOutMinLimit,
    }: {
      path: TokenIdPath;
      amountIn: Balance;
      amountOutMinLimit: Balance;
    }) => {
      if (!client.client || !wallet.wallet) return;

      const pendingTransaction = await pools.sellPath(
        client.client,
        PublicKey.fromBase58(wallet.wallet),
        path,
        amountIn,
        amountOutMinLimit,
      );

      wallet.addPendingTransaction(pendingTransaction);
      return pendingTransaction;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useWhitelistAddress = () => {
  const client = useClientStore();
  const pools = usePoolsStore();
  const wallet = useWalletStore();

  return useMutation({
    mutationFn: async ({
      poolKey,
      address,
    }: {
      poolKey: PoolKey;
      address: PublicKey;
    }) => {
      if (!client.client || !wallet.wallet) return;

      const pendingTransaction = await pools.whitelistAddress(
        client.client,
        PublicKey.fromBase58(wallet.wallet),
        poolKey,
        address,
      );

      wallet.addPendingTransaction(pendingTransaction);
      return pendingTransaction;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
