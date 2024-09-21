"use client";

import { Faucet } from "@/components/faucet";
import { useAddBalance } from "@/lib/stores/balances";
import { useWalletStore } from "@/lib/stores/wallet";

export default function Home() {
  const wallet = useWalletStore();
  const { mutate } = useAddBalance();

  return (
    <div className="mx-auto h-full">
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
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
    </div>
  );
}
