import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CrimeBreakdownChart from "@/components/CrimeBreakdownChart";
import NightToggle from "@/components/NightToggle";
import WardScoreDisplay from "@/components/WardScoreDisplay";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";
import { listWards, wardFromSlug, wardSlug } from "@/lib/wards";
import { CRIME_CATEGORY_LABELS, type CrimeCategory } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { city: string; id: string }[] = [];
  for (const city of CITY_IDS) {
    for (const w of listWards(city)) {
      params.push({ city, id: wardSlug(w.id) });
    }
  }
  return params;
}

export default async function WardPage({
  params,
}: {
  params: Promise<{ city: string; id: string }>;
}) {
  const { city: rawCity, id } = await params;
  if (!isCityId(rawCity)) notFound();
  const city = rawCity;
  const cfg = getCity(city)!;
  const ward = wardFromSlug(city, id);
  if (!ward) notFound();
  const totalIncidents = Object.values(ward.breakdown).reduce(
    (a: number, b) => a + (b ?? 0),
    0,
  );
  const topCats: CrimeCategory[] = (
    Object.entries(ward.breakdown) as [CrimeCategory, number][]
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  return (
    <div className="flex-1">
      <section className="border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-4">
          <Suspense fallback={null}>
            <WardScoreDisplay city={city} ward={ward} />
          </Suspense>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">
                {cfg.name} · {cfg.unit}
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
                {cfg.unit === "MCD ward" || cfg.unit === "GHMC ward"
                  ? ward.name
                  : `Ward ${ward.id}`}
              </h1>
              <p className="mt-1 text-zinc-300">{ward.neighborhoods}</p>
              <p className="mt-1 text-xs text-zinc-500">
                Pop. ≈ {ward.population.toLocaleString("en-IN")} · data
                quality:{" "}
                <span className="font-mono text-sky-400">
                  {ward.dataQuality}
                </span>
              </p>
            </div>
            <Suspense fallback={null}>
              <NightToggle />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            Reported incidents (year-to-date)
          </h2>
          <CrimeBreakdownChart breakdown={ward.breakdown} />
          <p className="text-xs text-zinc-500">
            Total: {totalIncidents.toLocaleString("en-IN")} reported incidents
            across all categories. Top contributors:{" "}
            {topCats.map((c) => CRIME_CATEGORY_LABELS[c]).join(", ")}.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            What to watch for
          </h2>
          <ul className="flex flex-col gap-2">
            {ward.topConcerns.map((c, i) => (
              <li
                key={i}
                className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-200"
              >
                {c}
              </li>
            ))}
          </ul>
          <div className="rounded-md border border-amber-900/50 bg-amber-950/40 p-3 text-xs text-amber-200">
            <strong className="block text-amber-100 mb-1">Reminder</strong>
            High-score areas often reflect higher <em>reporting</em> rates
            (better policing, more cameras, more women who can safely file
            FIRs). A lower score is not a guarantee of safety. See{" "}
            <Link
              href="/methodology"
              className="underline underline-offset-2"
            >
              methodology
            </Link>
            .
          </div>
        </div>
      </section>

      {cfg.hasAbsconders ? (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-300 flex flex-col gap-2">
            <h3 className="font-semibold text-zinc-100">
              Named absconders ({cfg.name})
            </h3>
            <p className="text-zinc-400 text-xs">
              We republish names <strong>only</strong> from the official police
              absconder list (CrPC §82 proclamations). The list is city-wide,
              not mapped to wards.{" "}
              <Link
                href="/legal"
                className="underline underline-offset-2 text-zinc-300"
              >
                Naming policy
              </Link>
              .
            </p>
            <Link
              href={`/${city}/absconders`}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1.5 text-xs font-medium"
            >
              View {cfg.name} absconder list →
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
