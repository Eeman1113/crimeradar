import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Disclaimer from "@/components/Disclaimer";
import { I18nProvider } from "@/lib/i18n/provider";
import HeaderBar from "@/components/HeaderBar";
import { ThemeProvider } from "@/components/theme-provider";

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
          <I18nProvider>
            <HeaderBar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Disclaimer />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
