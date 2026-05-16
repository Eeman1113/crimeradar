"use client";

import Link from "next/link";
import { CITIES, CITY_IDS } from "@/lib/cities";
import { listAbsconders } from "@/lib/absconders";
import { cityDataQuality, listWards, monthlyStatsMeta } from "@/lib/wards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LocateAnywhereButton from "@/components/LocateAnywhereButton";
import CityPicker, { type CityTile } from "@/components/CityPicker";
import { useI18n } from "@/lib/i18n/provider";

export default function Home() {
  const { t } = useI18n();
  const tiles: CityTile[] = CITY_IDS.map((id) => {
    const cfg = CITIES[id];
    const quality = cityDataQuality(id);
    const wardCount = listWards(id).length;
    const stats = monthlyStatsMeta(id);
    const statsCategories = Object.values(stats.totals).filter(
      (v) => typeof v === "number" && v > 0,
    ).length;
    const absconderCount = listAbsconders(id).filter((a) => !a.isOrganisation)
      .length;
    return {
      id,
      name: cfg.name,
      state: cfg.state,
      quality,
      wardCount,
      statsCategories,
      absconderCount,
    };
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
          className="animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              {t("home_cta_title")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("home_cta_desc")}
            </CardDescription>
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
        <CityPicker tiles={tiles} />

        <Separator className="my-4" />

        <div
          className="animate-fade-in-up flex items-center gap-3 text-xs text-muted-foreground"
          style={{ animationDelay: `${200 + tiles.length * 45 + 40}ms` }}
        >
          <Link
            href="/methodology"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t("nav_methodology")}
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link
            href="/legal"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t("nav_legal")}
          </Link>
        </div>
      </section>
    </div>
  );
}
