import type { Metadata } from "next";
import { CareersPage } from "./CareersPage";

export const metadata: Metadata = {
  title: "Careers — Gienah",
  description: "Open roles at Gienah. Build the next one with us.",
};

export default function Page() {
  return <CareersPage />;
}
