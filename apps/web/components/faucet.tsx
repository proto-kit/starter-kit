"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Balance, TokenId } from "@proto-kit/library";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

export interface FaucetProps {
  wallet?: string;
  loading: boolean;
  onConnectWallet: () => void;
  onDrip: (tokenId: TokenId, amount: Balance) => void;
}

const formSchema = z.object({
  tokenId: z.coerce.number(),
  amount: z.coerce.number(),
});

export function Faucet({
  wallet,
  onConnectWallet,
  onDrip,
  loading,
}: FaucetProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    onDrip(TokenId.from(data.tokenId), Balance.from(data.amount));
  }

  return (
    <Card className="w-full p-4">
      <div className="mb-2">
        <h2 className="text-xl font-bold">Faucet</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Get testing (L2) MINA tokens for your wallet
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            name="to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  To{" "}
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
          <FormField
            name="tokenId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Token ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter token ID" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter amount" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            size={"lg"}
            type="submit"
            className="mt-6 w-full"
            loading={loading}
            onClick={() => {
              wallet ?? onConnectWallet();
            }}
          >
            {wallet ? "Drip 💦" : "Connect wallet"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
