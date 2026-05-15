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

export default function Home() {
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
        <div className="flex flex-col gap-3 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            CrimeRadar
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Ward-level safety estimates for Indian cities, sourced from
            official police publications where they exist.
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              In one of these cities? Get your area&apos;s stats.
            </CardTitle>
            <CardDescription>
              Tap below — we&apos;ll detect which city you&apos;re in
              (Mumbai, Bangalore, Delhi, Chennai, Hyderabad, Kolkata) and
              jump straight to your ward&apos;s report. Your location stays
              in the browser; we don&apos;t log or send it anywhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocateAnywhereButton />
          </CardContent>
        </Card>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-12 flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            Or pick a city
          </h2>
          <p className="text-xs text-muted-foreground">{tiles.length} cities</p>
        </div>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {tiles.map((t) => {
            const hasAny =
              t.wardCount > 0 || t.statsCategories > 0 || t.absconderCount > 0;
            return (
              <li key={t.id} className="h-full">
                <Link
                  href={`/${t.id}/`}
                  className="block group h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
                >
                  <Card className="h-full flex flex-col transition-all group-hover:bg-accent/50 group-hover:border-foreground/20 group-hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-lg">{t.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {t.state}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                      </div>
                    </CardHeader>
                    <CardContent className="mt-auto flex flex-wrap items-center gap-2">
                      {t.wardCount > 0 ? (
                        <Badge
                          variant={
                            t.quality === "live"
                              ? "default"
                              : t.quality === "calibrated"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {t.wardCount} per-area
                        </Badge>
                      ) : null}
                      {t.statsCategories > 0 ? (
                        <Badge variant="secondary">city stats</Badge>
                      ) : null}
                      {t.absconderCount > 0 ? (
                        <Badge variant="destructive">
                          {t.absconderCount} absconders
                        </Badge>
                      ) : null}
                      {!hasAny ? (
                        <Badge variant="outline">geometry only</Badge>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>

        <Separator className="my-4" />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Data quality scale</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <p>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                live
              </span>{" "}
              — automated ingest, per-area data from official police feeds.
            </p>
            <p>
              <span className="font-mono text-sky-600 dark:text-sky-400">
                calibrated
              </span>{" "}
              — real city-aggregate counts from official sources, apportioned
              to areas via editorial relative weights.
            </p>
            <p>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                seeded
              </span>{" "}
              — editorial estimates, no real-data calibration yet.
            </p>
            <p>
              <span className="font-mono text-muted-foreground">empty</span>{" "}
              — ward boundaries shown, but no per-area data ingested.
            </p>
            <p className="pt-2">
              Full details:{" "}
              <Link href="/methodology" className="underline">
                methodology
              </Link>{" "}
              ·{" "}
              <Link href="/legal" className="underline">
                legal &amp; takedown
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
