"use client";
// @ts-ignore
import truncateMiddle from "truncate-middle";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Footer } from "./chain";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "./ui/use-toast";

export interface TransferProps {
  wallet?: string;
  loading: boolean;
  balance?: string;
  balanceLoading: boolean;
}

export function Transfer({
  wallet,
  loading,
  balance,
  balanceLoading,
}: TransferProps) {
  const form = useForm();
  const { toast } = useToast();
  return (
    <Card className="w-full p-4">
      <div className="mb-2">
        <h2 className="text-xl font-bold">Transfer</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Transfer MINA tokens from one wallet to another
        </p>
      </div>
      <Form {...form}>
        <div className="pt-3">
          <FormField
            name="from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  From{" "}
                  <span className="text-sm text-zinc-500">(your wallet)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    disabled
                    placeholder={wallet ?? "Please connect a wallet first"}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4">
          <FormField
            name="to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <div className="pb-0.5">To</div>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter recipient address" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="pt-8">
          <FormField
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <div className="flex items-center justify-between pb-0.5">
                    <div>Amount</div>
                    {balance === undefined || balanceLoading ? (
                      <Skeleton className="h-4 w-32" />
                    ) : (
                      <div className="text-xs font-normal text-zinc-400">
                        {balance} MINA
                      </div>
                    )}
                  </div>
                </FormLabel>
                <FormControl>
                  <Input
                    className="border-rose-500 focus-visible:border-transparent"
                    type="text"
                    placeholder="Enter token amount"
                  />
                </FormControl>
                <div className="text-xs font-bold text-rose-500">
                  Infussicient balance
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button
          size={"lg"}
          type="submit"
          className="mt-6 w-full"
          loading={loading}
          onClick={() =>
            toast({
              title: "✅ Transfering",
              description: "100 MINA from B62.. to B62..",
            })
          }
        >
          {wallet ? "Send" : "Connect wallet"}
        </Button>
      </Form>
    </Card>
  );
}
