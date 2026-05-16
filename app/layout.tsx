import type { Metadata, Viewport } from "next";
import {
  Poppins,
  Noto_Sans_Devanagari,
  Noto_Sans_Bengali,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";
import "./globals.css";
import Disclaimer from "@/components/Disclaimer";
import { I18nProvider } from "@/lib/i18n/provider";
import HeaderBar from "@/components/HeaderBar";
import { ThemeProvider } from "@/components/theme-provider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Indic-script fallbacks so glyphs render correctly when translated UI text
// contains Devanagari (Hindi/Marathi), Bengali, Tamil or Telugu. Poppins
// covers Latin only, so without these the browser falls back to whatever
// system font happens to be installed — which often looks awful (tofu,
// inconsistent weights). We subset narrowly and only ship 3 weights per
// script to keep the total payload small.
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const fontVariables = [
  poppins.variable,
  notoDevanagari.variable,
  notoBengali.variable,
  notoTamil.variable,
  notoTelugu.variable,
].join(" ");

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
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <head>
        {/*
          Apply the saved locale (lang + dir) before React hydrates so screen
          readers, :lang() CSS rules, and font cascades pick up the right
          script on first paint. Translated string content still flashes once
          on hard refresh because SSR has no localStorage access — that's a
          static-export constraint.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var l = localStorage.getItem("crimeradar.locale");
                var rtl = { ur: 1 };
                if (l && /^[a-z]{2}$/.test(l)) {
                  document.documentElement.setAttribute("lang", l);
                  document.documentElement.setAttribute("dir", rtl[l] ? "rtl" : "ltr");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:text-foreground focus:px-3 focus:py-2 focus:rounded focus:ring-2 focus:ring-primary"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <HeaderBar />
            <main id="main" className="flex-1 flex flex-col">{children}</main>
            <Disclaimer />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
