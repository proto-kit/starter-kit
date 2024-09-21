import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useBalancesStore, useLoadAllBalances } from "@/lib/stores/balances";
import protokit from "@/public/protokit-zinc.svg";
import Image from "next/image";
import truncateMiddle from "truncate-middle";
import { Chain } from "./chain";
import { Separator } from "./ui/separator";
import Link from "next/link";

export interface HeaderProps {
  loading: boolean;
  wallet?: string;
  onConnectWallet: () => void;
  blockHeight?: string;
}

export default function Header({
  loading,
  wallet,
  onConnectWallet,
  blockHeight,
}: HeaderProps) {
  return (
    <header className="sticky top-0 flex items-center justify-between border-b p-2 shadow-sm">
      <div className="container flex">
        <div className="flex basis-6/12 items-center justify-start">
          <Link href="/">
            <Image className="h-8 w-8" src={protokit} alt={"Protokit logo"} />
          </Link>
          <Separator className="mx-4 h-8" orientation={"vertical"} />
          <div className="flex grow">
            <Chain height={blockHeight} />
          </div>
        </div>
        <div className="flex basis-6/12 flex-row items-center justify-end">
          {/* balance */}
          {wallet && (
            <div className="mr-4 flex shrink flex-col items-end justify-center">
              <div>
                <p className="pr-2 text-xs">Your balance</p>
              </div>
              <div className="w-32 pt-0.5 text-right">
                <TokenBalanceDialog />
              </div>
            </div>
          )}
          {/* connect wallet */}
          <Button loading={loading} className="w-44" onClick={onConnectWallet}>
            <div>
              {wallet ? truncateMiddle(wallet, 7, 7, "...") : "Connect wallet"}
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}

function TokenBalanceDialog() {
  "use client";

  const { balances } = useBalancesStore();
  useLoadAllBalances();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-auto text-xs font-bold" variant={"ghost"}>
          {balances?.[0] ?? 0} (ID #0)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your balances</DialogTitle>
          <DialogDescription></DialogDescription>
          <div>
            {balances === undefined
              ? "No balances"
              : Object.entries(balances).map(([tokenId, balance]) => (
                  <div key={tokenId}>
                    {balance} ID #{tokenId}
                  </div>
                ))}
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
