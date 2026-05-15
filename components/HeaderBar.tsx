"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileNav from "@/components/MobileNav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n/provider";
import { withBase } from "@/lib/site";

export default function HeaderBar() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
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
            {t("brand_country")}
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/compare"
              className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/methodology"
              className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
            >
              {t("nav_methodology")}
            </Link>
            <Link
              href="/legal"
              className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
            >
              {t("nav_legal")}
            </Link>
          </nav>
          <LanguageSwitcher />
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
