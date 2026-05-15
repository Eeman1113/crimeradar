import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Disclaimer from "@/components/Disclaimer";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

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
          <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
              >
                <img
                  src="/icon.webp"
                  alt=""
                  className="h-7 w-7 rounded-md"
                  aria-hidden
                />
                <span>
                  Crime<span className="text-primary/80">Radar</span>
                </span>
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  India
                </span>
              </Link>
              <nav className="flex items-center gap-1 text-sm">
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
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="flex-1 flex flex-col">{children}</main>
          <Disclaimer />
        </ThemeProvider>
      </body>
    </html>
  );
}
