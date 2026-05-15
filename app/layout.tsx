import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Disclaimer from "@/components/Disclaimer";
import MobileNav from "@/components/MobileNav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { withBase } from "@/lib/site";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CrimeRadar — Indian city night-safety estimates",
  description:
    "Ward-level estimated risk scores for major Indian cities, sourced from official police publications where they exist. Educational / informational use only.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold tracking-tight text-foreground min-w-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withBase("/icon.webp")}
                  alt=""
                  className="h-7 w-7 rounded-md flex-shrink-0"
                  aria-hidden
                />
                <span className="truncate">
                  Crime<span className="text-primary/80">Radar</span>
                </span>
                <span className="hidden sm:inline ml-1 text-xs font-normal text-muted-foreground">
                  India
                </span>
              </Link>
              <div className="flex items-center gap-1 text-sm">
                <nav className="hidden md:flex items-center gap-1">
                  <Link
                    href="/methodology"
                    className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
                  >
                    Methodology
                  </Link>
                  <Link
                    href="/legal"
                    className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
                  >
                    Legal
                  </Link>
                </nav>
                <ThemeToggle />
                <MobileNav />
              </div>
            </div>
          </header>
          <main className="flex-1 flex flex-col">{children}</main>
          <Disclaimer />
        </ThemeProvider>
      </body>
    </html>
  );
}
