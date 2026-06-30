import "~/styles/globals.css";

import { type Metadata } from "next";
import { Fraunces, Hanken_Grotesk, DM_Mono } from "next/font/google";

import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "~/trpc/react";
import { SiteHeader } from "~/components/SiteHeader";

export const metadata: Metadata = {
  title: "Spine — Mat-Pilates Class Builder",
  description: "Build your mat flow, then run it.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

// Fonts self-hosted via next/font (no FOUT, no external @import).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${dmMono.variable}`}
    >
      <body>
        <SessionProvider>
          <TRPCReactProvider>
            <div className="wrap">
              <SiteHeader />
              {children}
            </div>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
