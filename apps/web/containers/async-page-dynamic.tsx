import dynamic from "next/dynamic";

export default dynamic(() => import("./async-page"), {
  ssr: false,
});
