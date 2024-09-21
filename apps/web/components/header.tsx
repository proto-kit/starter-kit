import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBalancesStore, useLoadAllBalances } from "@/lib/stores/balances";
import { cn } from "@/lib/utils";
import protokit from "@/public/protokit-zinc.svg";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import truncateMiddle from "truncate-middle";
import { Chain } from "./chain";
import { Separator } from "./ui/separator";
import { ColourModeToggle } from "@/components/colour-mode-toggle";
import { DropletIcon } from "lucide-react";

export interface HeaderProps {
  loading: boolean;
  wallet?: string;
  onConnectWallet: () => void;
  onCopyToClipboard: () => void;
  blockHeight?: string;
}

export default function Header({
  loading,
  wallet,
  onConnectWallet,
  onCopyToClipboard,
  blockHeight,
}: HeaderProps) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 flex items-center justify-between border-b p-2 shadow-sm dark:bg-zinc-900">
      <div className="container flex">
        <div className="flex basis-8/12 items-center justify-start">
          <Link href="/">
            <DropletIcon className="h-8 w-8 transition-opacity hover:opacity-80" />
          </Link>
          <Separator className="mx-4 h-8" orientation={"vertical"} />
          <div className="flex">
            <Chain height={blockHeight} />
          </div>
          <Separator className="mx-4 h-8" orientation={"vertical"} />
          <div className="flex grow space-x-4">
            <Link
              href="/guide"
              className={cn(
                "hover:underline",
                pathname === "/guide" && "font-semibold",
              )}
            >
              Guide
            </Link>
            <Link
              href="/"
              className={cn(
                "hover:underline",
                pathname === "/" && "font-semibold",
              )}
            >
              Swap
            </Link>
            <Link
              href="/lend"
              className={cn(
                "hover:underline",
                pathname === "/lend" && "font-semibold",
              )}
            >
              Lend
            </Link>
            <Link
              href="/pools"
              className={cn(
                "hover:underline",
                pathname === "/pools" && "font-semibold",
              )}
            >
              Pools
            </Link>
            <Link
              href="/faucet"
              className={cn(
                "hover:underline",
                pathname === "/faucet" && "font-semibold",
              )}
            >
              Faucet
            </Link>
          </div>
        </div>
        <div className="flex basis-4/12 flex-row items-center justify-end">
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
          <Button
            loading={loading}
            onClick={() => {
              if (wallet) {
                onCopyToClipboard();
              } else {
                onConnectWallet();
              }
            }}
          >
            {wallet ? truncateMiddle(wallet, 7, 7, "...") : "Connect wallet"}
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
