import type { Metadata } from "next";
import { ConsoleApp } from "./ConsoleApp";

export const metadata: Metadata = {
  title: "Gienah Console",
  description: "Login → dashboard, deployments, usage.",
};

export default function ConsolePage() {
  return <ConsoleApp />;
}
