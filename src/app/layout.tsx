import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gienah — Creating digital experiences beyond your expectations",
  description:
    "Gienah is a software studio that turns ambitious ideas into products people love — from strategy and design to engineering and growth.",
  icons: { icon: "/assets/logo-mark.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
