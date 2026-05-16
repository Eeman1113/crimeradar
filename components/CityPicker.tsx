"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import posthog from "posthog-js";
import type { CityId } from "@/lib/cities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DataQuality } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";

export type CityTile = {
  id: CityId;
  name: string;
  state: string;
  quality: DataQuality | "empty";
  wardCount: number;
  statsCategories: number;
  absconderCount: number;
};

export default function CityPicker({ tiles }: { tiles: CityTile[] }) {
  const { t, cityName } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const optionIdPrefix = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tiles;
    return tiles.filter(
      (tile) =>
        tile.name.toLowerCase().includes(q) ||
        tile.state.toLowerCase().includes(q) ||
        cityName(tile.id).toLowerCase().includes(q),
    );
  }, [tiles, query, cityName]);

  const showCombobox = tiles.length > 6;
  const listboxOpen = showCombobox && isOpen && filtered.length > 0;
  const optionId = (i: number) => `${optionIdPrefix}-opt-${i}`;
  const activeId =
    listboxOpen && activeIndex >= 0 && activeIndex < filtered.length
      ? optionId(activeIndex)
      : undefined;

  const selectTile = (tile: CityTile) => {
    posthog.capture("city_selected", {
      city_id: tile.id,
      city_name: tile.name,
    });
    router.push(`/${tile.id}/`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showCombobox) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length === 0) return;
      setIsOpen(true);
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length === 0) return;
      setIsOpen(true);
      setActiveIndex((prev) =>
        prev <= 0 ? filtered.length - 1 : prev - 1,
      );
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        e.preventDefault();
        selectTile(filtered[activeIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (isOpen) {
        setIsOpen(false);
        setActiveIndex(-1);
      } else if (query) {
        setQuery("");
      }
    } else if (e.key === "Home") {
      if (listboxOpen) {
        e.preventDefault();
        setActiveIndex(0);
      }
    } else if (e.key === "End") {
      if (listboxOpen) {
        e.preventDefault();
        setActiveIndex(filtered.length - 1);
      }
    }
  };

  const liveMessage = query.trim()
    ? `${filtered.length} ${filtered.length === 1 ? "city matches" : "cities match"} ${query.trim()}`
    : "";

  return (
    <div className="flex flex-col gap-4">
      {showCombobox && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={t("home_search_placeholder")}
            aria-label="Search cities"
            role="combobox"
            aria-expanded={listboxOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            autoComplete="off"
            className="w-full h-10 pl-9 pr-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {liveMessage}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No cities match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul
          id={showCombobox ? listboxId : undefined}
          role={showCombobox ? "listbox" : undefined}
          aria-label={showCombobox ? "Cities" : undefined}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr"
        >
          {filtered.map((tile, idx) => {
            const hasAny =
              tile.wardCount > 0 ||
              tile.statsCategories > 0 ||
              tile.absconderCount > 0;
            const isActive = showCombobox && idx === activeIndex;
            return (
              <li
                key={tile.id}
                id={showCombobox ? optionId(idx) : undefined}
                role={showCombobox ? "option" : undefined}
                aria-selected={showCombobox ? isActive : undefined}
                className="h-full animate-fade-in-up"
                style={{ animationDelay: `${idx * 45}ms` }}
              >
                <Link
                  href={`/${tile.id}/`}
                  className="block group h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
                  onClick={() =>
                    posthog.capture("city_selected", {
                      city_id: tile.id,
                      city_name: tile.name,
                    })
                  }
                >
                  <Card className="h-full flex flex-col group-hover:bg-accent/40 group-hover:border-foreground/20 group-hover:shadow-md group-hover:-translate-y-0.5">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-lg">
                            {cityName(tile.id)}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tile.state}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out flex-shrink-0 mt-1" />
                      </div>
                    </CardHeader>
                    <CardContent className="mt-auto flex flex-wrap items-center gap-2">
                      {tile.wardCount > 0 ? (
                        <Badge
                          variant={
                            tile.quality === "live"
                              ? "default"
                              : tile.quality === "calibrated"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {t("badge_per_area", { n: tile.wardCount })}
                        </Badge>
                      ) : null}
                      {tile.statsCategories > 0 ? (
                        <Badge variant="secondary">
                          {t("badge_city_stats")}
                        </Badge>
                      ) : null}
                      {tile.absconderCount > 0 ? (
                        <Badge variant="destructive">
                          {t("badge_absconders", { n: tile.absconderCount })}
                        </Badge>
                      ) : null}
                      {!hasAny ? (
                        <Badge variant="outline">
                          {t("badge_geometry_only")}
                        </Badge>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
