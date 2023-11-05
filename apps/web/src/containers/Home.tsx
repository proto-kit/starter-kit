import { useState } from "react";
import BlockHeight from "../components/BlockHeight";
import Faucet from "../components/Faucet";

export default function Home() {
  const [h, sh] = useState();
  return (
    <>
      <BlockHeight onBlockHeightChange={sh} />
      <Faucet blockHeight={h} />
    </>
  );
}
