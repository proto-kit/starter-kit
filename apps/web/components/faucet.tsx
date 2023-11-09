"use client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";

export interface FaucetProps {
  wallet?: string;
  loading: boolean;
  onConnectWallet: () => void;
  onDrip: () => void;
}

export function Faucet({
  wallet,
  onConnectWallet,
  onDrip,
  loading,
}: FaucetProps) {
  const form = useForm();
  return (
    <Card className="w-full p-4">
      <div className="mb-2">
        <h2 className="text-xl font-bold">Faucet</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Get testing (L2) MINA tokens for your wallet
        </p>
      </div>
      <Form {...form}>
        <div className="pt-3">
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
        </div>

        <Button
          size={"lg"}
          type="submit"
          className="mt-6 w-full"
          loading={loading}
          onClick={() => {
            wallet ?? onConnectWallet();
            wallet && onDrip();
          }}
        >
          {wallet ? "Drip 💦" : "Connect wallet"}
        </Button>
      </Form>
    </Card>
  );
}
