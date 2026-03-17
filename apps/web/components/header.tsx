import { Button } from "@/components/ui/button";
import protokit from "@/public/protokit-zinc.svg";
import Image from "next/image";
// @ts-ignore
import truncateMiddle from "truncate-middle";
import { Skeleton } from "@/components/ui/skeleton";
import { Chain } from "./chain";
import { Separator } from "./ui/separator";

export interface HeaderProps {
  loading: boolean;
  wallet?: string;
  walletInstalled: boolean;
  onConnectWallet: () => void;
  balance?: string;
  balanceLoading: boolean;
  blockHeight?: string;
}

export default function Header({
  loading,
  wallet,
  walletInstalled,
  onConnectWallet,
  balance,
  balanceLoading,
  blockHeight,
}: HeaderProps) {
  return (
    <>
      {!walletInstalled && (
        <div className="flex items-center justify-center gap-2 bg-red-100 px-4 py-2 text-sm text-red-800">
          <span>
            {" "}
            <a
              href="https://www.aurowallet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              Auro Wallet
            </a>{" "}
            not detected. Please install it to continue.
          </span>
        </div>
      )}
      <div className="flex items-center justify-between border-b p-2 shadow-sm">
        <div className="container flex">
          <div className="flex basis-6/12 items-center justify-start">
            <Image className="h-8 w-8" src={protokit} alt={"Protokit logo"} />
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
                  <p className="text-xs">Your balance</p>
                </div>
                <div className="w-32 pt-0.5 text-right">
                  {balanceLoading && balance === undefined ? (
                    <Skeleton className="h-4 w-full" />
                  ) : (
                    <p className="text-xs font-bold">
                      {Number(balance) / 1e9} MINA
                    </p>
                  )}
                </div>
              </div>
            )}
            {/* connect wallet */}
            <Button
              loading={loading}
              className="w-44"
              onClick={
                walletInstalled
                  ? onConnectWallet
                  : () => window.open("https://www.aurowallet.com", "_blank")
              }
            >
              <div>
                {wallet
                  ? truncateMiddle(wallet, 7, 7, "...")
                  : walletInstalled
                    ? "Connect wallet"
                    : "Install Auro Wallet"}
              </div>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
