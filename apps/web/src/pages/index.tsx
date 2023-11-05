"use client";
import dynamic from "next/dynamic";
import BlockHeight from "../components/BlockHeight";

const Home = dynamic(() => import("./../containers/Home"), {
  ssr: false,
});

export default function App() {
  return <Home />;
}
