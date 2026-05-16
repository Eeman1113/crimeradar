import { ArrowRight, Newspaper } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CrimeBreakdownChart from "@/components/CrimeBreakdownChart";
import NightToggle from "@/components/NightToggle";
import WardScoreDisplay from "@/components/WardScoreDisplay";
import NewsLink from "@/components/NewsLink";
import LocalizedCityName from "@/components/LocalizedCityName";
import RealtimeNewsSection from "@/components/RealtimeNewsSection";
import WardSourceDrawer from "@/components/WardSourceDrawer";
import ShareCard from "@/components/ShareCard";
import PdfExportButton from "@/components/PdfExportButton";
import PerCategoryTrendChart from "@/components/PerCategoryTrendChart";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";
import {
  dynamicWardConcerns,
  listWards,
  wardFromSlug,
  wardNews,
  wardSlug,
} from "@/lib/wards";
import { BASE_PATH } from "@/lib/site";
import { CRIME_CATEGORY_LABELS, type CrimeCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Canonical production origin — see lib/site.ts comment. Used to build absolute
// share URLs (social shares need a fully-qualified link).
const SITE_ORIGIN = "https://eeman1113.github.io";

function bandFor(score: number) {
  if (score >= 75) return "High";
  if (score >= 50) return "Elevated";
  if (score >= 25) return "Moderate";
  return "Lower";
}

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
  const news = wardNews(city, ward.id);
  const totalIncidents = Object.values(ward.breakdown).reduce(
    (a: number, b) => a + (b ?? 0),
    0,
  );
  const sortedCats = (
    Object.entries(ward.breakdown) as [CrimeCategory, number][]
  ).sort((a, b) => b[1] - a[1]);
  const topCats: CrimeCategory[] = sortedCats.slice(0, 3).map(([cat]) => cat);
  const topCategoriesForWard: CrimeCategory[] = sortedCats
    .slice(0, 4)
    .map(([cat]) => cat);
  const concerns = dynamicWardConcerns(city, ward);
  const ratePerK =
    ward.population > 0
      ? (totalIncidents / (ward.population / 1000)).toFixed(1)
      : null;

  const wardDisplayName =
    cfg.unit === "MCD ward" || cfg.unit === "GHMC ward"
      ? ward.name
      : `Ward ${ward.id}`;
  const canonicalUrl = `${SITE_ORIGIN}${BASE_PATH}/${city}/ward/${wardSlug(ward.id)}`;
  const shareTitle = `${wardDisplayName}, ${cfg.name}`;
  const shareSummary = `Risk score: ${ward.riskScore} (${bandFor(
    ward.riskScore,
  )}). Day: ${ward.riskScore}, Night: ${ward.riskScoreNight}.`;

  return (
    <div className="flex-1">
      <section className="border-b animate-fade-in-up">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-4">
          <Suspense fallback={null}>
            <WardScoreDisplay city={city} ward={ward} />
          </Suspense>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                <LocalizedCityName cityId={city} /> · {cfg.unit}
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                {cfg.unit === "MCD ward" || cfg.unit === "GHMC ward"
                  ? ward.name
                  : `Ward ${ward.id}`}
              </h1>
              <p className="mt-1 text-foreground/80 leading-relaxed">
                {ward.neighborhoods}
              </p>
              <p className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  Pop. ≈ {ward.population.toLocaleString("en-IN")} · data
                  quality:{" "}
                  <span className="font-mono text-sky-600 dark:text-sky-400">
                    {ward.dataQuality}
                  </span>
                </span>
                <WardSourceDrawer cityId={city} wardId={ward.id} />
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <PdfExportButton />
              <Suspense fallback={null}>
                <NightToggle />
              </Suspense>
            </div>
          </div>
          <ShareCard
            title={shareTitle}
            summary={shareSummary}
            url={canonicalUrl}
          />
        </div>
      </section>

      <section
        className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-6 animate-fade-in-up"
        style={{ animationDelay: "80ms" }}
      >
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
              <CardTitle className="text-base flex items-center gap-1.5">
                <Newspaper className="h-4 w-4 text-sky-500" />
                What to watch for
              </CardTitle>
              <CardDescription className="text-xs">
                {news.length > 0
                  ? `${news.length} recent crime-related headlines mentioning this area (Google News, last 18 months)`
                  : `No recent local crime news matched — patterns below derived from ${totalIncidents.toLocaleString(
                      "en-IN",
                    )} YTD reported incidents${
                      ratePerK ? ` (≈ ${ratePerK}/1,000 residents)` : ""
                    }`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {news.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {news.map((n, i) => (
                    <li
                      key={n.link}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${120 + i * 50}ms` }}
                    >
                      <NewsLink item={n} city={city} wardId={ward.id} />
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="flex flex-col gap-2">
                  {concerns.map((c, i) => (
                    <li
                      key={i}
                      className="rounded-md border bg-card p-3 text-sm animate-fade-in-up"
                      style={{ animationDelay: `${120 + i * 50}ms` }}
                    >
                      <p className="text-foreground leading-snug">{c.text}</p>
                      {c.detail ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {c.detail}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

        </div>
      </section>

      <section
        className="max-w-5xl mx-auto px-4 pb-6 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trend by category</CardTitle>
            <CardDescription>
              Top {topCategoriesForWard.length} categories for this ward
              ({topCategoriesForWard
                .map((c) => CRIME_CATEGORY_LABELS[c])
                .join(", ")})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerCategoryTrendChart
              cityId={city}
              categories={topCategoriesForWard}
            />
          </CardContent>
        </Card>
      </section>

      <section
        className="max-w-5xl mx-auto px-4 pb-6 animate-fade-in-up"
        style={{ animationDelay: "120ms" }}
      >
        <RealtimeNewsSection
          city={city}
          cityName={cfg.name}
          wardId={ward.id}
          wardName={ward.name}
          neighborhoods={ward.neighborhoods}
        />
      </section>

      <section
        className="max-w-5xl mx-auto px-4 pb-8 animate-fade-in-up"
        style={{ animationDelay: "140ms" }}
      >
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-5 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            <strong className="block text-amber-900 dark:text-amber-200 mb-1">
              Reminder
            </strong>
            High-score areas often reflect higher <em>reporting</em> rates
            (better policing, more cameras, more women who can safely file
            FIRs). A lower score is not a guarantee of safety. See{" "}
            <Link href="/methodology" className="underline underline-offset-2">
              methodology
            </Link>
            .
          </CardContent>
        </Card>
      </section>

      {cfg.hasAbsconders ? (
        <section
          className="max-w-5xl mx-auto px-4 pb-12 animate-fade-in-up"
          style={{ animationDelay: "160ms" }}
        >
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
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Naming policy
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm" className="group">
                <Link href={`/${city}/absconders`}>
                  View {cfg.name} absconder list
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
