"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useBalancesStore } from "@/lib/stores/balances";
import { useClientStore } from "@/lib/stores/client";
import { useWalletStore } from "@/lib/stores/wallet";
import { cn } from "@/lib/utils";
import { Balance, TokenId } from "@proto-kit/library";
import type { PendingTransaction } from "@proto-kit/sequencer";
import { useMutation } from "@tanstack/react-query";
import { Order } from "chain/dist/runtime/modules/dark-pool";
import { PoolKey } from "chain/dist/runtime/modules/xyk/pool-key";
import { TokenPair } from "chain/dist/runtime/modules/xyk/token-pair";
import { ChevronDownIcon, RefreshCwIcon, SettingsIcon } from "lucide-react";
import { Bool, PublicKey } from "o1js";
import { useState } from "react";
import "reflect-metadata";

export default function Home() {
  const [inToken, setInToken] = useState<TokenId>(TokenId.from(0));
  const [inTokenAmount, setInTokenAmount] = useState<number>(0);
  const [outToken, setOutToken] = useState<TokenId>(TokenId.from(1));
  const [outTokenAmount, setOutTokenAmount] = useState<number>(0);
  const [selectedPool, setSelectedPool] = useState<PoolKey>(
    PoolKey.fromTokenPair(TokenPair.from(inToken, outToken)),
  );
  const [slippage, setSlippage] = useState<number>(0.5); // in %

  const client = useClientStore();
  const balances = useBalancesStore();
  const wallet = useWalletStore();
  const { toast } = useToast();

  const inTokenBalance = balances.balances[inToken.toString()];
  const outTokenBalance = balances.balances[outToken.toString()];

  const { mutate: submitOrder, isPending: isSubmitOrderPending } = useMutation({
    mutationFn: async () => {
      if (!client.client || !wallet.wallet) return;

      const DarkPool = client.client!.runtime.resolve("DarkPool");

      const tx = await client.client.transaction(
        PublicKey.fromBase58(wallet.wallet),
        async () => {
          await DarkPool.submitOrder(
            new Order({
              amountIn: Balance.from(inTokenAmount),
              amountOut: Balance.from(outTokenAmount),
              tokenIn: inToken,
              tokenOut: outToken,
              user: PublicKey.fromBase58(wallet.wallet!),
            }),
            Bool(true),
          );
        },
      );
      await tx.sign();
      await tx.send();

      if (tx.transaction) {
        wallet.addPendingTransaction(tx.transaction as PendingTransaction);
      }
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onClick() {
    submitOrder();
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-6 rounded-xl border bg-background p-6 shadow-sm">
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Swap</h2>
          <div>
            <Button
              variant="ghost"
              size="icon"
              // onClick={refetchData}
              // disabled={isRefetching}
            >
              <RefreshCwIcon
                className={cn(
                  "h-5 w-5",
                  // isRefetching && "animate-spin repeat-infinite",
                )}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <SettingsIcon className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Slippage Tolerance</DropdownMenuItem>
                <DropdownMenuItem>Transaction Deadline</DropdownMenuItem>
                <DropdownMenuItem>Interface Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div>
          <Select
          // value={selectedPool}
          // onValueChange={(value) => setSelectedPool(value as Address)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a pool" />
            </SelectTrigger>
            <SelectContent>
              {/* {pools
                ?.filter((pool) => pool.status === "success")
                .map((pool) => (
                  <SelectItem key={pool.result} value={pool.result}>
                    {trimAddress(pool.result)}
                  </SelectItem>
                ))} */}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <p>ID: #{inToken.toString()}</p>
                {inTokenBalance !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    Balance: {inTokenBalance}
                  </span>
                )}
              </div>
            </div>
            <Input
              type="number"
              placeholder="0.0"
              className="w-24 text-right"
              value={inTokenAmount}
              onChange={(e) => {
                setInTokenAmount(parseFloat(e.target.value));
              }}
              // max={inTokenBalance !== undefined ? inTokenBalance.toString() : 0}
            />
          </div>
          <div className="text-center">
            {/* TODO: maybe let user switch tokens */}
            <Button variant="ghost" className="h-auto px-1 py-1" disabled>
              <ChevronDownIcon className={"h-4 w-4 transition-all"} />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <p>ID: #{outToken.toString()}</p>
                {outTokenBalance !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    Balance: {outTokenBalance}
                  </span>
                )}
              </div>
            </div>
            <Input
              type="number"
              placeholder="0.0"
              className="w-24 text-right"
              value={outTokenAmount}
              onChange={(e) => {
                setOutTokenAmount(parseFloat(e.target.value));
              }}
            />
          </div>
        </div>
        <Button
          className="w-full"
          onClick={onClick}
          disabled={
            isSubmitOrderPending || inTokenAmount === 0 || outTokenAmount === 0
          }
        >
          {inTokenAmount === 0 || outTokenAmount === 0
            ? "Enter Amounts"
            : isSubmitOrderPending
              ? "Submitting..."
              : "Submit Swap"}
        </Button>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            Price (#{inToken.toString()} = #{outToken.toString()})
          </span>
          <span>
            {inTokenAmount} ={" "}
            {isNaN(outTokenAmount / inTokenAmount)
              ? "0"
              : (outTokenAmount / inTokenAmount).toFixed(3)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Slippage Tolerance</span>
          <span>{slippage}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Minimum Received</span>
          <span>
            {/* {outTokenAmount * (1 - slippage / 100)} {outTokenSymbol} */}
          </span>
        </div>
      </div>
    </div>
  );
}
