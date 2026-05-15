import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CrimeBreakdownChart from "@/components/CrimeBreakdownChart";
import NightToggle from "@/components/NightToggle";
import WardScoreDisplay from "@/components/WardScoreDisplay";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";
import { listWards, wardFromSlug, wardSlug } from "@/lib/wards";
import { CRIME_CATEGORY_LABELS, type CrimeCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-4">
          <Suspense fallback={null}>
            <WardScoreDisplay city={city} ward={ward} />
          </Suspense>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {cfg.name} · {cfg.unit}
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                {cfg.unit === "MCD ward" || cfg.unit === "GHMC ward"
                  ? ward.name
                  : `Ward ${ward.id}`}
              </h1>
              <p className="mt-1 text-foreground/80">{ward.neighborhoods}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Pop. ≈ {ward.population.toLocaleString("en-IN")} · data
                quality:{" "}
                <span className="font-mono text-sky-600 dark:text-sky-400">
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

      <section className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reported incidents</CardTitle>
            <CardDescription>Year-to-date breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <CrimeBreakdownChart breakdown={ward.breakdown} />
            <p className="text-xs text-muted-foreground">
              Total: {totalIncidents.toLocaleString("en-IN")} reported
              incidents across all categories. Top contributors:{" "}
              {topCats.map((c) => CRIME_CATEGORY_LABELS[c]).join(", ")}.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What to watch for</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <ul className="flex flex-col gap-2">
                {ward.topConcerns.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-md border bg-card p-3 text-sm"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-5 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <strong className="block text-amber-900 dark:text-amber-200 mb-1">
                Reminder
              </strong>
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
            </CardContent>
          </Card>
        </div>
      </section>

      {cfg.hasAbsconders ? (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Named absconders ({cfg.name})
              </CardTitle>
              <CardDescription>
                We republish names only from the official police absconder
                list (CrPC §82 proclamations) — city-wide, not mapped to
                wards.{" "}
                <Link
                  href="/legal"
                  className="underline underline-offset-2"
                >
                  Naming policy
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/${city}/absconders`}>
                  View {cfg.name} absconder list
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
