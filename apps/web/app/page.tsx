"use client";
import { Faucet } from "@/components/faucet";
import { Transfer } from "@/components/transfer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AsyncPageDynamic from "@/containers/async-page-dynamic";
import { useFaucet } from "@/lib/stores/balances";
import { useWalletStore } from "@/lib/stores/wallet";
import Image from "next/image";

export default function Home() {
  return <AsyncPageDynamic />;
}
