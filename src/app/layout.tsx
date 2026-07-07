import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.css";

/* Self-hosted at build time (no runtime Google Fonts CDN request) and shipped
   with an auto-generated, metric-matched fallback so there is no font-swap
   layout shift. This is what makes the production render deterministic and
   identical to local — the previous remote @import + display=swap caused FOUT
   reflow and a local/prod mismatch. Same Geist typefaces, unchanged identity. */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050b14",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Gienah — Creating digital experiences beyond your expectations",
  description:
    "Gienah is a software studio that turns ambitious ideas into products people love — from strategy and design to engineering and growth.",
  icons: { icon: "/assets/logo-mark.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gienah",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
