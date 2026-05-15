import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import WardMap from "@/components/Map/WardMap";
import LocateMeButton from "@/components/Map/LocateMeButton";
import NightToggle from "@/components/NightToggle";
import RankList from "@/components/RankList";
import CityStatsCard from "@/components/CityStatsCard";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";
import { cityDataQuality, listWards } from "@/lib/wards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamicParams = false;

export function generateStaticParams() {
  return CITY_IDS.map((id) => ({ city: id }));
}

function qualityClass(quality: ReturnType<typeof cityDataQuality>) {
  if (quality === "live") return "font-mono text-emerald-600 dark:text-emerald-400";
  if (quality === "calibrated") return "font-mono text-sky-600 dark:text-sky-400";
  if (quality === "seeded") return "font-mono text-amber-600 dark:text-amber-400";
  return "font-mono text-muted-foreground";
}

export default async function CityHome({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: rawCity } = await params;
  if (!isCityId(rawCity)) notFound();
  const city = rawCity;
  const cfg = getCity(city)!;
  const wards = listWards(city);
  const quality = cityDataQuality(city);

  return (
    <div className="flex-1 flex flex-col">
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All cities
              </Link>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
                {cfg.name} night-safety map
              </h1>
              <p className="mt-2 text-muted-foreground max-w-2xl text-sm sm:text-base">
                Estimated risk per {cfg.unit} across {cfg.name}, with a
                night-time multiplier applied per crime type. Use your location
                to see where you are, or tap any area on the map for details.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Data quality:{" "}
                <span className={qualityClass(quality)}>{quality}</span>
                {quality === "empty" ? (
                  <>
                    {" "}— per-area data not yet ingested for {cfg.name}.{" "}
                    <Link href="/methodology" className="underline">
                      methodology
                    </Link>
                    .
                  </>
                ) : null}
              </p>
            </div>
            <Suspense fallback={null}>
              <NightToggle />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <LocateMeButton city={city} />
          </Suspense>
        </div>
      </section>

      <section className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="h-[65vh] min-h-[440px]">
          <Suspense fallback={<MapSkeleton />}>
            <WardMap city={city} wards={wards} />
          </Suspense>
        </div>
        <aside className="flex flex-col gap-4">
          <CityStatsCard city={city} />
          {wards.length > 0 ? (
            <>
              <Suspense fallback={null}>
                <RankList city={city} wards={wards} variant="high" />
              </Suspense>
              <Suspense fallback={null}>
                <RankList city={city} wards={wards} variant="low" />
              </Suspense>
            </>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Per-area data coming</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {cfg.name}&apos;s police publishes only city-aggregate data —
                see above. Per-{cfg.unit} heatmaps need station-level data
                that isn&apos;t public yet.
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-4 text-xs text-muted-foreground leading-relaxed">
              Scores are normalized to a 5–95 percentile band across all{" "}
              {cfg.name} {cfg.unit}s. High score = more incidents reported per
              capita, not a guarantee of danger.{" "}
              <Link href="/methodology" className="underline">
                methodology
              </Link>
              .
            </CardContent>
          </Card>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-1">
            <Badge variant="outline" className="font-normal">
              {wards.length} {cfg.unit}s
            </Badge>
          </p>
        </aside>
      </section>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="w-full h-full rounded-lg bg-muted border animate-pulse" />
  );
}
