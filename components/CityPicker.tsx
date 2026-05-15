"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  const [query, setQuery] = useState("");

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

  return (
    <div className="flex flex-col gap-4">
      {tiles.length > 6 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("home_search_placeholder")}
            aria-label="Search cities"
            className="w-full h-10 pl-9 pr-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No cities match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {filtered.map((tile, idx) => {
            const hasAny =
              tile.wardCount > 0 ||
              tile.statsCategories > 0 ||
              tile.absconderCount > 0;
            return (
              <li
                key={tile.id}
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
