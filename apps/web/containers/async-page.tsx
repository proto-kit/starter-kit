"use client";
import { Faucet } from "@/components/faucet";
import { useFaucet } from "@/lib/stores/balances";
import { useWalletStore } from "@/lib/stores/wallet";

export default function Home() {
  const wallet = useWalletStore();
  const drip = useFaucet();

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Faucet
            wallet={wallet.wallet}
            onConnectWallet={wallet.connectWallet}
            onDrip={drip}
            loading={false}
          />
        </div>
      </div>
    </div>
  );
}
