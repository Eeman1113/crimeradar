"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CITIES, CITY_IDS } from "@/lib/cities";
import { listAbsconders } from "@/lib/absconders";
import { cityDataQuality, listWards, monthlyStatsMeta } from "@/lib/wards";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LocateAnywhereButton from "@/components/LocateAnywhereButton";
import { useI18n } from "@/lib/i18n/provider";

export default function Home() {
  const { t } = useI18n();
  const tiles = CITY_IDS.map((id) => {
    const cfg = CITIES[id];
    const quality = cityDataQuality(id);
    const wardCount = listWards(id).length;
    const stats = monthlyStatsMeta(id);
    const statsCategories = Object.values(stats.totals).filter(
      (v) => typeof v === "number" && v > 0,
    ).length;
    const absconderCount = listAbsconders(id).filter((a) => !a.isOrganisation)
      .length;
    return { ...cfg, quality, wardCount, statsCategories, absconderCount };
  });

  return (
    <div className="flex-1">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-8 sm:pt-16 flex flex-col gap-6">
        <div
          className="flex flex-col gap-3 max-w-2xl animate-fade-in-up"
          style={{ animationDelay: "0ms" }}
        >
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            CrimeRadar
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("home_subtitle")}
          </p>
        </div>

        <Card
          className="border-primary/20 bg-primary/5 animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              {t("home_cta_title")}
            </CardTitle>
            <CardDescription>{t("home_cta_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LocateAnywhereButton />
          </CardContent>
        </Card>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-12 flex flex-col gap-4">
        <div
          className="flex items-end justify-between gap-3 flex-wrap animate-fade-in-up"
          style={{ animationDelay: "160ms" }}
        >
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            {t("home_pick_city")}
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/compare"
              className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Compare cities →
            </Link>
            <span className="text-muted-foreground">
              {t("home_cities_count", { n: tiles.length })}
            </span>
          </div>
        </div>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {tiles.map((tile, idx) => {
            const hasAny =
              tile.wardCount > 0 ||
              tile.statsCategories > 0 ||
              tile.absconderCount > 0;
            return (
              <li
                key={tile.id}
                className="h-full animate-fade-in-up"
                style={{ animationDelay: `${200 + idx * 45}ms` }}
              >
                <Link
                  href={`/${tile.id}/`}
                  className="block group h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
                >
                  <Card className="h-full flex flex-col group-hover:bg-accent/40 group-hover:border-foreground/20 group-hover:shadow-md group-hover:-translate-y-0.5">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-lg">
                            {tile.name}
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

        <Separator className="my-4" />

        <Card
          className="animate-fade-in-up"
          style={{ animationDelay: `${200 + tiles.length * 45 + 40}ms` }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("dq_title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <p>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {t("dq_live")}
              </span>{" "}
              — {t("dq_live_desc")}
            </p>
            <p>
              <span className="font-mono text-sky-600 dark:text-sky-400">
                {t("dq_calibrated")}
              </span>{" "}
              — {t("dq_calibrated_desc")}
            </p>
            <p>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                {t("dq_seeded")}
              </span>{" "}
              — {t("dq_seeded_desc")}
            </p>
            <p>
              <span className="font-mono text-muted-foreground">
                {t("dq_empty")}
              </span>{" "}
              — {t("dq_empty_desc")}
            </p>
            <p className="pt-2">
              <Link
                href="/methodology"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                {t("nav_methodology")}
              </Link>{" "}
              ·{" "}
              <Link
                href="/legal"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                {t("nav_legal")}
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
