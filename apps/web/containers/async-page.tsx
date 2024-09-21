"use client";

import { Faucet } from "@/components/faucet";
import { useDrip } from "@/lib/stores/balances";
import { useWalletStore } from "@/lib/stores/wallet";

export default function Home() {
  const wallet = useWalletStore();
  const { mutate } = useDrip();

  return (
    <div className="mx-auto mt-8 grid w-full max-w-md gap-6 rounded-xl bg-background p-6 shadow-sm">
      <div className="grid gap-4">
        <Faucet
          wallet={wallet.wallet}
          onConnectWallet={wallet.connectWallet}
          onDrip={(tokenId, amount) =>
            mutate({
              tokenId,
              amount,
            })
          }
          loading={false}
        />
      </div>
    </div>
  );
}
