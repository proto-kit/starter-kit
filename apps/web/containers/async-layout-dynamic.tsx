import dynamic from "next/dynamic";

export default dynamic(() => import("./async-layout"), {
  ssr: false,
});
