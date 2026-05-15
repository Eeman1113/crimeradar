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

export const dynamicParams = false;

export function generateStaticParams() {
  return CITY_IDS.map((id) => ({ city: id }));
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
      <section className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <Link
                href="/"
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                ← All cities
              </Link>
              <h1 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
                {cfg.name} night-safety map
              </h1>
              <p className="mt-2 text-zinc-400 max-w-2xl text-sm sm:text-base">
                Estimated risk per {cfg.unit} across {cfg.name}, with a
                night-time multiplier applied per crime type. Use your location
                to see where you are, or tap any area on the map for details.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Data quality:{" "}
                <span
                  className={
                    quality === "live"
                      ? "font-mono text-emerald-400"
                      : quality === "calibrated"
                        ? "font-mono text-sky-400"
                        : quality === "seeded"
                          ? "font-mono text-amber-400"
                          : "font-mono text-zinc-500"
                  }
                >
                  {quality}
                </span>
                {quality === "empty" ? (
                  <>
                    {" "}
                    — per-area crime data not yet ingested for {cfg.name}. Map
                    shows ward boundaries from public sources; risk scores will
                    light up as scrapers land. See{" "}
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
        <div className="h-[60vh] min-h-[400px]">
          <Suspense fallback={<MapSkeleton />}>
            <WardMap city={city} wards={wards} />
          </Suspense>
        </div>
        <aside className="flex flex-col gap-6">
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
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-300">
              <h3 className="font-semibold text-zinc-100 mb-1">
                Per-area data coming
              </h3>
              <p className="text-xs text-zinc-400">
                {cfg.name}&apos;s police force publishes data only at the
                city-aggregate level — see above. Per-{cfg.unit} heatmaps need
                station-level data that isn&apos;t public yet.
              </p>
            </div>
          )}
          <p className="text-xs text-zinc-500 leading-relaxed">
            Scores are normalized to a 5–95 percentile band across all{" "}
            {cfg.name} {cfg.unit}s. High score = more incidents reported per
            capita, not a guarantee of danger. See{" "}
            <Link
              href="/methodology"
              className="text-zinc-300 underline underline-offset-2"
            >
              methodology
            </Link>
            .
          </p>
        </aside>
      </section>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="w-full h-full rounded-lg bg-zinc-900 border border-zinc-800 animate-pulse" />
  );
}
