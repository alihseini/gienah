import type { Metadata } from "next";
import { LandingApp } from "./LandingApp";

export const metadata: Metadata = {
  title: "Gienah Landing",
  description: "Login → dashboard, deployments, usage.",
};

export default function LandingPage() {
  return <LandingApp />;
}
