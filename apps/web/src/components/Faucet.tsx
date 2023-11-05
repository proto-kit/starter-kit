import { client } from "chain";
import { useCallback, useEffect, useState } from "react";
import { PublicKey, UInt64, Poseidon, Provable } from "o1js";

function useAccount() {
  const [account, setAccount] = useState<string | undefined>();
  const connectAccount = useCallback(async () => {
    const [address] = await (window as any).mina.requestAccounts();
    setAccount(address);
  }, []);

  return { account, connectAccount };
}

function useFaucet(address?: string) {
  const getTestFunds = useCallback(async () => {
    if (!address) return;
    const balances = client.runtime.resolve("Balances");
    const sender = PublicKey.fromBase58(address);
    const amount = UInt64.from(1000);

    console.log("gettestfunds", address, PublicKey);
    Provable.log(
      "address",
      Poseidon.hash(PublicKey.toFields(sender)).toString()
    );
    const tx = await client.transaction(sender, () => {
      balances.setBalance(sender, amount);
    });

    await tx.sign();
    await tx.send();
    console.log("path", balances.balances.getPath(sender).toString());
  }, [address]);

  return { getTestFunds };
}

function useBalance(address?: string, blockHeight?: string) {
  const [balance, setBalance] = useState<string | undefined>();
  const getBalance = useCallback(async (address) => {
    const balances = client.runtime.resolve("Balances");
    const publicKey = PublicKey.fromBase58(address);

    return (
      await client.query.runtime.Balances.balances.get(publicKey)
    )?.toString();
  }, []);

  useEffect(() => {
    if (!address) {
      setBalance(undefined);
      return;
    }

    void (async () => {
      const balance = await getBalance(address);
      setBalance(balance);
    })();
  }, [address, blockHeight]);

  return balance;
}

export default function Faucet({ blockHeight }: { blockHeight?: string }) {
  const { account, connectAccount } = useAccount();
  const { getTestFunds } = useFaucet(account);
  const balance = useBalance(account, blockHeight);

  return (
    <div>
      <div>Account: {account ?? "not connected"}</div>
      <div>Balance: {balance ?? "-"}</div>
      <button onClick={connectAccount}>connect account</button>
      <button onClick={getTestFunds}>get test funds</button>
    </div>
  );
}
