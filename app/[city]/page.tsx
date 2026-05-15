import { ArrowLeft, Info, LineChart as LineChartIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import WardMap from "@/components/Map/WardMap";
import LocateMeButton from "@/components/Map/LocateMeButton";
import NightToggle from "@/components/NightToggle";
import WomenToggle from "@/components/WomenToggle";
import RankList from "@/components/RankList";
import CityStatsCard from "@/components/CityStatsCard";
import TrendChart from "@/components/TrendChart";
import AnnualTrendChart from "@/components/AnnualTrendChart";
import NightDeltaChart from "@/components/NightDeltaChart";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";
import {
  cityDataQuality,
  listWards,
  monthlyHistory,
} from "@/lib/wards";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  const history = monthlyHistory(city);
  const isAnnualHistory =
    history.length > 0 && history.every((m) => m.month === 12);
  const showHistory =
    history.length >= (isAnnualHistory ? 2 : 6);

  return (
    <div className="flex-1 flex flex-col">
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="min-w-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All cities
              </Link>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
                {cfg.name}
              </h1>
              <p className="mt-1 text-muted-foreground max-w-2xl text-sm sm:text-base">
                Estimated risk per {cfg.unit} with a night-time multiplier
                applied per crime type.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={qualityClass(quality)}>{quality}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <Badge variant="outline" className="font-normal">
                  {wards.length} {cfg.unit}s
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Suspense fallback={null}>
                <WomenToggle />
              </Suspense>
              <Suspense fallback={null}>
                <NightToggle />
              </Suspense>
            </div>
          </div>
          <Suspense fallback={null}>
            <LocateMeButton city={city} />
          </Suspense>
        </div>
      </section>

      <section className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 grid lg:grid-cols-[1fr_320px] gap-4 lg:gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-[55vh] min-h-[340px] sm:h-[60vh] sm:min-h-[400px] lg:h-[65vh] lg:min-h-[440px]">
            <Suspense fallback={<MapSkeleton />}>
              <WardMap city={city} wards={wards} />
            </Suspense>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
            <Info className="h-3.5 w-3.5" />
            Tap any {cfg.unit} to open its full report. Pinch to zoom.
          </p>
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
          <p className="text-xs text-muted-foreground leading-relaxed px-1">
            Scores are normalised to a 5–95 percentile band across all{" "}
            {cfg.name} {cfg.unit}s. High score = more incidents reported per
            capita, not a guarantee of danger.{" "}
            <Link href="/methodology" className="underline">
              methodology
            </Link>
            .
          </p>
        </aside>
      </section>

      {wards.length > 0 ? (
        <section className="max-w-6xl w-full mx-auto px-4 pb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Wards with the biggest night-time premium
              </CardTitle>
              <CardDescription>
                {cfg.name} {cfg.unit}s ranked by how much higher their
                night-time score is than day. The amber bar is the day score;
                the indigo bar is the added risk at night.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NightDeltaChart wards={wards} />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {showHistory ? (
        <section className="max-w-6xl w-full mx-auto px-4 pb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-1.5">
                <LineChartIcon className="h-4 w-4 text-sky-500" />
                Multi-year trend
              </CardTitle>
              <CardDescription>
                {isAnnualHistory
                  ? `Annual reported totals per IPC category for ${cfg.name} (NCRB Crime in India). Click a category in the legend to toggle it.`
                  : `Monthly registered cases per category for ${cfg.name}, scraped from the historical archive. Click a category in the legend to toggle it.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAnnualHistory ? (
                <AnnualTrendChart months={history} />
              ) : (
                <TrendChart months={history} />
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="w-full h-full rounded-lg bg-muted border animate-pulse" />
  );
}
