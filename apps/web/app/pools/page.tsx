"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useBalancesStore } from "@/lib/stores/balances";
import {
  useCreatePool,
  usePoolsStore,
  useWhitelistAddress,
} from "@/lib/stores/pools";
import { useWalletStore } from "@/lib/stores/wallet";
import { zodResolver } from "@hookform/resolvers/zod";
import { Balance, TokenId } from "@proto-kit/library";
import { PoolKey } from "chain/dist/runtime/modules/xyk/pool-key";
import { EyeIcon, ScrollTextIcon } from "lucide-react";
import Link from "next/link";
import { PublicKey } from "o1js";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  tokenA: z.coerce.number(),
  tokenB: z.coerce.number(),
  tokenAAmount: z.coerce.number(),
  tokenBAmount: z.coerce.number(),
});

export default function PoolsPage() {
  const { pools } = usePoolsStore();
  const { wallet } = useWalletStore();
  const { toast } = useToast();
  const { mutate, isPending } = useCreatePool();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      tokenA: 0,
      tokenB: 1,
      tokenAAmount: 1,
      tokenBAmount: 1,
    },
  });

  function handleSubmit(data: z.infer<typeof formSchema>) {
    if (!wallet) {
      toast({
        title: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }
    if (
      data.tokenA === undefined ||
      data.tokenB === undefined ||
      data.tokenA === data.tokenB
    ) {
      toast({
        title: "Please select two different tokens",
        variant: "destructive",
      });
      return;
    }
    mutate({
      tokenAId: TokenId.from(data.tokenA),
      tokenBId: TokenId.from(data.tokenB),
      tokenAAmount: Balance.from(data.tokenAAmount),
      tokenBAmount: Balance.from(data.tokenBAmount),
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-lg bg-card p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold">Create Pool</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid grid-cols-2 gap-4"
          >
            <FormField
              name="tokenA"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token 1</FormLabel>
                  <Input {...field} placeholder="Enter token ID" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="tokenB"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token 2</FormLabel>
                  <Input {...field} placeholder="Enter token ID" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="tokenAAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token 1 Amount</FormLabel>
                  <Input {...field} placeholder="Enter initial amount" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="tokenBAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token 2 Amount</FormLabel>
                  <Input {...field} placeholder="Enter initial amount" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="col-span-2"
              type="submit"
              loading={form.formState.isSubmitting || isPending}
            >
              Create Pool
            </Button>
          </form>
        </Form>
      </div>
      <div>
        <h2 className="mb-4 text-2xl font-bold">Pools</h2>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(pools).map(([poolKey, tokens]) => (
            <Card
              className="bg-background p-4 px-6 text-card-foreground"
              key={poolKey}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">
                  Pool {poolKey.toString()}
                </span>
                <div>
                  <Button variant="ghost" className="h-auto p-2">
                    <Link
                      href={`/?tokenA=${tokens.tokenIn}&tokenB=${tokens.tokenOut}`}
                      className="text-sm text-primary hover:text-primary/70"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                  <WhitelistAddress poolKey={poolKey} />
                </div>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {poolKey}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

const whitelistAddressSchema = z.object({
  address: z.string(),
});

function WhitelistAddress({ poolKey }: { poolKey: string }) {
  const { mutate, isPending } = useWhitelistAddress();
  const form = useForm<z.infer<typeof whitelistAddressSchema>>({
    resolver: zodResolver(whitelistAddressSchema),
    values: {
      address: "",
    },
  });

  function handleSubmit(data: z.infer<typeof whitelistAddressSchema>) {
    mutate({
      poolKey: PoolKey.fromBase58(poolKey),
      address: PublicKey.fromBase58(data.address),
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-auto p-2">
          <ScrollTextIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Whitelist Address</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col"
          >
            <FormField
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <Input {...field} placeholder="Enter address" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" loading={isPending} className="mt-4">
              Whitelist
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
