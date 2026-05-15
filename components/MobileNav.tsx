"use client";

import { FileText, Globe, Menu, Scale } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n/provider";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("nav_open_menu")}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>{t("nav_menu_title")}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 mt-4 px-2">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Globe className="h-4 w-4 text-muted-foreground" />
            {t("menu_all_cities")}
          </Link>
          <Link
            href="/methodology"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            {t("nav_methodology")}
          </Link>
          <Link
            href="/legal"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Scale className="h-4 w-4 text-muted-foreground" />
            {t("menu_legal_full")}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
