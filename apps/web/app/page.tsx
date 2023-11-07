import { Faucet } from "@/components/faucet";
import { Transfer } from "@/components/transfer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

export default function Home() {
  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center">
          <Tabs defaultValue="transfer" className="w-full max-w-md">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
              <TabsTrigger value="faucet">Faucet</TabsTrigger>
            </TabsList>
            <TabsContent value="transfer">
              <Transfer
                wallet="B62qmeMDp3AafAcYHGhBtx9UhTuqKCgyqLAWjcEED6Q1mGwJ6W14Zr6"
                balanceLoading={true}
                balance="1000"
                loading={false}
              />
            </TabsContent>
            <TabsContent value="faucet">
              <Faucet
                wallet="B62qmeMDp3AafAcYHGhBtx9UhTuqKCgyqLAWjcEED6Q1mGwJ6W14Zr6"
                balanceLoading={false}
                balance="0"
                loading={false}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
