"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import RiskBadge from "@/components/RiskBadge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { searchWards, type SearchIndexEntry } from "@/lib/wards";

export default function WardSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchIndexEntry[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      return;
    }
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    const id = setTimeout(() => setResults(searchWards(q, 30)), 50);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search wards"
          title="Search wards"
        >
          <Search className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Search areas</SheetTitle>
        </SheetHeader>
        <div className="relative mt-4 mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Andheri, Govandi, Sion, Borivali…"
            className="w-full h-10 pl-9 pr-9 rounded-md border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground px-1 mb-2">
          {q
            ? `${results.length} ${results.length === 1 ? "match" : "matches"} across all 6 cities`
            : "Type a neighbourhood or ward name (across all 6 cities)"}
        </p>
        <ul className="flex flex-col gap-1 overflow-y-auto flex-1 px-1">
          {results.map((r) => (
            <li key={`${r.city}-${r.wardId}`}>
              <Link
                href={`/${r.city}/ward/${r.wardSlug}/`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 rounded-md p-2 hover:bg-accent transition-colors"
              >
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {r.name.length > 26 ? r.name.slice(0, 26) + "…" : r.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {r.cityName} · {r.neighborhoods}
                  </span>
                </span>
                <RiskBadge score={r.score} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
