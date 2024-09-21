"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useBalancesStore } from "@/lib/stores/balances";
import { useClientStore } from "@/lib/stores/client";
import { usePoolsStore } from "@/lib/stores/pools";
import { useWalletStore } from "@/lib/stores/wallet";
import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import type { PendingTransaction } from "@proto-kit/sequencer";
import { useMutation } from "@tanstack/react-query";
import { Order } from "chain/dist/runtime/modules/dark-pool";
import { PoolKey } from "chain/dist/runtime/modules/xyk/pool-key";
import { TokenPair } from "chain/dist/runtime/modules/xyk/token-pair";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  PlusIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bool, PublicKey } from "o1js";
import { useState } from "react";
import "reflect-metadata";
import truncateMiddle from "truncate-middle";

export default function Home() {
  const searchParams = useSearchParams();
  const tokenA = searchParams.get("tokenA");
  const tokenB = searchParams.get("tokenB");

  const [inToken, setInToken] = useState(tokenA !== null ? +tokenA : 0);
  const [inTokenAmount, setInTokenAmount] = useState<number>(0);
  const [outToken, setOutToken] = useState(tokenB !== null ? +tokenB : 0);
  const [outTokenAmount, setOutTokenAmount] = useState<number>(0);
  const [selectedPool, setSelectedPool] = useState<string>(
    PoolKey.fromTokenPair(
      TokenPair.from(TokenId.from(inToken), TokenId.from(outToken)),
    ).toBase58(),
  );
  const [slippage, setSlippage] = useState<number>(0.5); // in %
  const [isBuy, setIsBuy] = useState<boolean>(true);
  const [blockDelays, setBlockDelays] = useState<number[]>([0, 10]);

  const client = useClientStore();
  const balances = useBalancesStore();
  const wallet = useWalletStore();
  const pools = usePoolsStore();
  const { toast } = useToast();

  const inTokenBalance = balances.balances[inToken.toString()] || "0";
  const outTokenBalance = balances.balances[outToken.toString()] || "0";

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
              tokenIn: TokenId.from(inToken),
              tokenOut: TokenId.from(outToken),
              user: PublicKey.fromBase58(wallet.wallet!),
              minBlockHeight: UInt64.from(0),
              maxBlockHeight: UInt64.from(100),
            }),
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

  function onSelectPool(pool: string) {
    setSelectedPool(pool);
    const { tokenIn, tokenOut } = pools.pools[pool];
    if (tokenIn && tokenOut) {
      setInToken(+tokenIn);
      setOutToken(+tokenOut);
    }
  }

  return (
    <div className="mx-auto mt-8 grid w-full max-w-md gap-6 rounded-xl border bg-background p-6 shadow-sm">
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Swap</h2>
          <div className="flex space-x-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="private">Private</Label>
              <Switch id="private" defaultChecked />
            </div>
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
        <div className="flex space-x-2">
          <Select value={selectedPool.toString()} onValueChange={onSelectPool}>
            <SelectTrigger>
              <SelectValue placeholder="Select a pool" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(pools.pools).map((pool) => (
                <SelectItem key={pool} value={pool}>
                  {truncateMiddle(pool, 10, 10, "...")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon">
            <Link href="/pools">
              <>
                <PlusIcon className="h-5 w-5" />
                <span className="sr-only">Create</span>
              </>
            </Link>
          </Button>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <p>ID: #{inToken.toString()}</p>
                <span className="text-sm text-muted-foreground">
                  Balance: {inTokenBalance}
                </span>
              </div>
            </div>
            <Input
              type="number"
              placeholder="0.0"
              className="w-16 text-right"
              value={inTokenAmount}
              onChange={(e) => {
                setInTokenAmount(parseFloat(e.target.value));
              }}
              // max={inTokenBalance !== undefined ? inTokenBalance.toString() : 0}
            />
          </div>
          <div className="text-center">
            <Button
              variant="ghost"
              className="h-auto px-1 py-1"
              onClick={() => setIsBuy((prev) => !prev)}
            >
              {isBuy ? (
                <ChevronDownIcon className={"h-4 w-4 transition-all"} />
              ) : (
                <ChevronUpIcon className={"h-4 w-4 transition-all"} />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <p>ID: #{outToken.toString()}</p>
                <span className="text-sm text-muted-foreground">
                  Balance: {outTokenBalance}
                </span>
              </div>
            </div>
            <Input
              type="number"
              placeholder="0.0"
              className="w-16 text-right"
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
        <Slider
          defaultValue={blockDelays}
          minStepsBetweenThumbs={1}
          max={100}
          min={0}
          step={1}
          onValueChange={(value) => {
            setBlockDelays(value);
          }}
          className={"w-full"}
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Min. Block Delay</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    The order will only be matched after this many blocks have
                    been processed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span>{blockDelays[0]}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Max. Block Delay</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    The order will only be matched before this many blocks have
                    been processed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span>{blockDelays[1]}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            Price (#{inToken.toString()} = #{outToken.toString()})
          </span>
          <span>
            1 (#{inToken.toString()}) ={" "}
            {isNaN(outTokenAmount / inTokenAmount)
              ? "0"
              : (outTokenAmount / inTokenAmount).toFixed(3)}{" "}
            (#{outToken.toString()})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Slippage Tolerance</span>
          <span>{slippage}%</span>
        </div>
        {/* <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Minimum Received</span>
          <span>
            {outTokenAmount * (1 - slippage / 100)} {outTokenSymbol}
          </span>
        </div> */}
      </div>
    </div>
  );
}
