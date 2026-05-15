import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Disclaimer from "@/components/Disclaimer";

export const metadata: Metadata = {
  title: "CrimeRadar — Indian city night-safety estimates",
  description:
    "Ward-level estimated risk scores for major Indian cities, sourced from official police publications where they exist. Educational / informational use only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="font-semibold tracking-tight text-zinc-50">
              Crime<span className="text-rose-400">Radar</span>
              <span className="ml-2 text-xs font-normal text-zinc-500">
                India · MVP
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-400">
              <Link href="/methodology" className="hover:text-zinc-100">
                Methodology
              </Link>
              <Link href="/legal" className="hover:text-zinc-100">
                Legal
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <Disclaimer />
      </body>
    </html>
  );
}
