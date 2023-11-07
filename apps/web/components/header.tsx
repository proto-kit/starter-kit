import { Button } from "@/components/ui/button";
import protokit from "@/public/protokit-zinc.svg";
import Image from "next/image";
// @ts-ignore
import truncateMiddle from "truncate-middle";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import { Chain } from "./chain";
import { Separator } from "./ui/separator";

export interface HeaderProps {
  loading: boolean;
  wallet?: string;
  balance?: string;
  balanceLoading: boolean;
}

export default function Header({
  loading,
  wallet,
  balance,
  balanceLoading,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b p-2 shadow-sm">
      <div className="container flex">
        <div className="flex basis-6/12 items-center justify-start">
          <Image className="h-8 w-8" src={protokit} alt={"Protokit logo"} />
          <Separator className="mx-4 h-8" orientation={"vertical"} />
          <div className="flex grow">
            <Chain error={false} />
          </div>
        </div>
        <div className="flex basis-6/12 flex-row items-center justify-end">
          {/* balance */}
          {wallet && (
            <div className="mr-4 flex shrink flex-col items-end justify-center">
              <div>
                <p className="text-xs">Your balance</p>
              </div>
              <div className="w-32 pt-0.5 text-right">
                {balanceLoading && balance === undefined ? (
                  <Skeleton className="h-4 w-full" />
                ) : (
                  <p className="text-xs font-bold">{balance} MINA</p>
                )}
              </div>
            </div>
          )}
          {/* connect wallet */}
          <div
            className={clsx("mr-2", {
              group: wallet,
            })}
          >
            <Button loading={loading} className="w-44">
              <div className="inline-block group-hover:hidden">
                {wallet
                  ? truncateMiddle(wallet, 7, 7, "...")
                  : "Connect wallet"}
              </div>
              <div className="hidden group-hover:inline-block">
                Reconnect wallet
              </div>
            </Button>
          </div>
          {/* additional actions */}
          {/* {wallet && (
            <div>
              <Button variant={"outline"} size="icon">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
