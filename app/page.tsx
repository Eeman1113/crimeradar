import Link from "next/link";
import { CITIES, CITY_IDS } from "@/lib/cities";
import { listAbsconders } from "@/lib/absconders";
import { cityDataQuality, listWards, monthlyStatsMeta } from "@/lib/wards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            CrimeRadar
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Ward-level safety estimates for Indian cities, sourced from
            official police publications where they exist. Pick a city to see
            its map.
          </p>
        </div>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((t) => {
            const hasAny =
              t.wardCount > 0 || t.statsCategories > 0 || t.absconderCount > 0;
            return (
              <li key={t.id}>
                <Link href={`/${t.id}`} className="block group">
                  <Card className="transition-colors group-hover:bg-accent/40 group-hover:border-foreground/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{t.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{t.state}</p>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-2">
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
              <span className="font-mono text-muted-foreground">empty</span> —
              ward boundaries shown, but no per-area data ingested. Geometry
              only.
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
