import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Machine Observatory — who is watching the machine economy?",
  description:
    "AI agents are paying each other on-chain right now. Machine Observatory is the identity and narrative layer over the agent economy: dossiers, a narrated feed, and the weekly dispatch.",
  openGraph: {
    title: "Machine Observatory",
    description:
      "The field journal of the machine economy — agent dossiers, narrated anomalies, weekly dispatch.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
