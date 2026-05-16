import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import LocateMeButton from "@/components/Map/LocateMeButton";
import NightToggle from "@/components/NightToggle";
import WomenToggle from "@/components/WomenToggle";
import RankList from "@/components/RankList";
import CityStatsCard from "@/components/CityStatsCard";
import LocalizedCityName from "@/components/LocalizedCityName";
import TrendChart from "@/components/TrendChart";
import AnnualTrendChart from "@/components/AnnualTrendChart";
import NightDeltaChart from "@/components/NightDeltaChart";
import PerCategoryTrendChart from "@/components/PerCategoryTrendChart";
import PdfExportButton from "@/components/PdfExportButton";
import ShareCard from "@/components/ShareCard";
import WardSourceDrawer from "@/components/WardSourceDrawer";
import CityMapWithLayers, {
  CityAddressSearch,
} from "@/components/CityMapWithLayers";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";
import {
  cityDataQuality,
  listWards,
  monthlyHistory,
} from "@/lib/wards";
import { withBase } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

  // Highest-risk ward feeds the WardSourceDrawer in the stats area so users
  // can drill into provenance for the most consequential number on the page.
  const topRiskWard = wards.length > 0
    ? [...wards].sort((a, b) => b.riskScore - a.riskScore)[0]
    : null;

  // Share-card metadata. Static export means we can't read window.location
  // server-side, so we build a base-path-aware path. ShareCard's encoded URL
  // will be a relative-with-base path; share targets resolve it once opened.
  const shareUrl = withBase(`/${city}/`);
  const shareSummary = `Ward-level risk estimates for ${cfg.name} — ${wards.length} ${cfg.unit}s, data quality: ${quality}.`;

  return (
    <div className="flex-1 flex flex-col">
      <section className="animate-fade-in-up">
        <div className="max-w-6xl mx-auto px-4 pt-6 sm:pt-8 pb-4 flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
            All cities
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                <LocalizedCityName cityId={city} />
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className={qualityClass(quality)}>{quality}</span>
                <span className="mx-2 text-muted-foreground/40">/</span>
                <span>{wards.length} {cfg.unit}s</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 print:hidden">
              <Suspense fallback={null}>
                <WomenToggle />
              </Suspense>
              <Suspense fallback={null}>
                <NightToggle />
              </Suspense>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Share"
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <ShareCard
                    title={cfg.name}
                    summary={shareSummary}
                    url={shareUrl}
                  />
                </PopoverContent>
              </Popover>
              <PdfExportButton />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <LocateMeButton city={city} />
            </Suspense>
            <Suspense fallback={null}>
              <CityAddressSearch city={city} className="flex-1 min-w-0" />
            </Suspense>
          </div>
        </div>
      </section>

      <section
        className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 grid lg:grid-cols-[1fr_320px] gap-4 lg:gap-6 animate-fade-in-up"
        style={{ animationDelay: "80ms" }}
      >
        <div className="flex flex-col gap-2">
          <CityMapWithLayers city={city} wards={wards} />
        </div>
        <aside className="flex flex-col gap-4 lg:max-h-[calc(65vh+2rem)] lg:overflow-y-auto scrollbar-hide">
          <CityStatsCard city={city} />
          {topRiskWard ? (
            <div className="flex items-center justify-end -mt-1">
              <WardSourceDrawer cityId={city} wardId={topRiskWard.id} />
            </div>
          ) : null}
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
        <section
          className="max-w-6xl w-full mx-auto px-4 pb-6 animate-fade-in-up"
          style={{ animationDelay: "160ms" }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Night-time premium</CardTitle>
              <CardDescription className="text-xs">
                {cfg.unit.charAt(0).toUpperCase() + cfg.unit.slice(1)}s ranked
                by added risk after dark. Amber is day; indigo is the
                night-time delta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NightDeltaChart wards={wards} />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {showHistory ? (
        <section
          className="max-w-6xl w-full mx-auto px-4 pb-6 animate-fade-in-up"
          style={{ animationDelay: "240ms" }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Multi-year trend</CardTitle>
              <CardDescription className="text-xs">
                {isAnnualHistory
                  ? "Annual totals per category (NCRB Crime in India). Click a category to toggle."
                  : "Monthly registered cases per category. Click a category to toggle."}
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

      {showHistory ? (
        <section
          className="max-w-6xl w-full mx-auto px-4 pb-12 animate-fade-in-up"
          style={{ animationDelay: "320ms" }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Per-category trajectory</CardTitle>
              <CardDescription className="text-xs">
                Each category plotted individually — spot which crime type
                drives the headline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerCategoryTrendChart cityId={city} />
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
