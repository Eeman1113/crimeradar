"use client";

import { Check, Languages } from "lucide-react";
import { useState } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LOCALES_LIST, useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/locales";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LOCALES_LIST.find((l) => l.id === locale);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("lang_label")}
          title={t("lang_label")}
          className="relative"
        >
          <Languages className="h-4 w-4" />
          <span className="absolute -bottom-0.5 right-0.5 text-[8px] font-mono uppercase opacity-70">
            {locale}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>{t("lang_label")}</SheetTitle>
        </SheetHeader>
        <ul className="flex flex-col gap-0.5 mt-4 px-2 max-h-[80vh] overflow-y-auto">
          {LOCALES_LIST.map((l) => {
            const active = l.id === locale;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => {
                    posthog.capture("language_changed", { locale: l.id, previous_locale: locale });
                    setLocale(l.id as Locale);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/60"
                  }`}
                >
                  <span className="flex flex-col items-start min-w-0">
                    <span className="font-medium truncate">{l.native}</span>
                    <span className="text-xs text-muted-foreground">
                      {l.english}
                    </span>
                  </span>
                  {active ? (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">
                      {l.id}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 px-3 text-[11px] text-muted-foreground">
          {current?.native ?? ""} {current?.id !== "en" ? "·" : ""}{" "}
          {current?.english ?? ""}
        </p>
      </SheetContent>
    </Sheet>
  );
}
