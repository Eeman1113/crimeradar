import Link from "next/link";
import { Suspense } from "react";
import WardMap from "@/components/Map/WardMap";
import LocateMeButton from "@/components/Map/LocateMeButton";
import NightToggle from "@/components/NightToggle";
import RiskBadge from "@/components/RiskBadge";
import { listWards } from "@/lib/wards";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ night?: string }>;
}) {
  const sp = await searchParams;
  const isNight = sp.night === "1";
  const wards = listWards();
  const sorted = [...wards].sort((a, b) =>
    isNight
      ? b.riskScoreNight - a.riskScoreNight
      : b.riskScore - a.riskScore,
  );
  const top = sorted.slice(0, 5);
  const safest = sorted.slice(-5).reverse();

  return (
    <div className="flex-1 flex flex-col">
      <section className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
                Mumbai night-safety map
              </h1>
              <p className="mt-2 text-zinc-400 max-w-2xl text-sm sm:text-base">
                Estimated risk scores per BMC ward, with a night-time multiplier
                applied per crime type. Use your location to see where you are
                right now, or tap any ward on the map for details.
              </p>
            </div>
            <Suspense fallback={null}>
              <NightToggle />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <LocateMeButton />
          </Suspense>
        </div>
      </section>

      <section className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="h-[60vh] min-h-[400px]">
          <Suspense fallback={<MapSkeleton />}>
            <WardMap wards={wards} />
          </Suspense>
        </div>
        <aside className="flex flex-col gap-6">
          <RankList
            title={isNight ? "Highest risk (night)" : "Highest risk (day)"}
            rows={top}
            night={isNight}
          />
          <RankList
            title={isNight ? "Lowest risk (night)" : "Lowest risk (day)"}
            rows={safest}
            night={isNight}
          />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Scores are normalized to a 5–95 percentile band across the 24 wards.
            High score = more incidents reported per capita, not a guarantee of
            danger. Some low-score wards may simply have lower reporting rates.
            See{" "}
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

function RankList({
  title,
  rows,
  night,
}: {
  title: string;
  rows: ReturnType<typeof listWards>;
  night: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="text-sm font-semibold text-zinc-200 mb-3">{title}</h3>
      <ul className="flex flex-col gap-2">
        {rows.map((w) => {
          const score = night ? w.riskScoreNight : w.riskScore;
          const qs = night ? "?night=1" : "";
          return (
            <li key={w.id}>
              <Link
                href={`/ward/${encodeURIComponent(w.id)}${qs}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-zinc-800"
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-100">
                    Ward {w.id}
                  </span>
                  <span className="text-xs text-zinc-500 truncate max-w-[180px]">
                    {w.neighborhoods}
                  </span>
                </span>
                <RiskBadge score={score} size="sm" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
