"use client";

import { ArrowLeft, BarChart3, Plus, ShieldAlert, Sun, Moon, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useCallback, useMemo, useState, useTransition } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ShareCard from "@/components/ShareCard";
import PdfExportButton from "@/components/PdfExportButton";
import { CITIES, CITY_IDS, isCityId, type CityId } from "@/lib/cities";
import { listWards, wardSlug } from "@/lib/wards";
import {
  CRIME_CATEGORY_LABELS,
  type CrimeCategory,
  type Ward,
} from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";

// Up to 5 ward scorecards fit comfortably side-by-side on desktop and stack on
// mobile. Keeping this small also keeps the URL share-friendly.
const MAX_WARDS = 5;

// Categories shown in the breakdown bars. Mirrors /compare ordering so users
// who toggle between city + ward compare see consistent rows.
const CATS: CrimeCategory[] = [
  "sexual_offence",
  "harassment",
  "assault",
  "kidnapping",
  "robbery",
  "theft",
  "burglary",
];

// Stable colour per scorecard slot. Index-based (not city-based) so the same
// ward keeps its colour even when the user swaps cities.
const SLOT_COLORS = [
  "#f43f5e",
  "#6366f1",
  "#10b981",
  "#0ea5e9",
  "#a855f7",
];

type Pick = { city: CityId; ward: Ward };

function parseWardsParam(city: CityId, raw: string | null): Pick[] {
  if (!raw) return [];
  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_WARDS);
  const wards = listWards(city);
  const out: Pick[] = [];
  const seen = new Set<string>();
  for (const slug of slugs) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    const w = wards.find((w) => wardSlug(w.id) === slug);
    if (w) out.push({ city, ward: w });
  }
  return out;
}

function ComparePicker({
  city,
  excludeIds,
  onPick,
  disabled,
}: {
  city: CityId;
  excludeIds: Set<string>;
  onPick: (w: Ward) => void;
  disabled: boolean;
}) {
  const [q, setQ] = useState("");
  const wards = useMemo(() => listWards(city), [city]);
  const hits = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const filtered = wards.filter((w) => !excludeIds.has(w.id));
    if (!ql) return filtered.slice(0, 8);
    return filtered
      .filter(
        (w) =>
          w.name.toLowerCase().includes(ql) ||
          w.id.toLowerCase().includes(ql) ||
          w.neighborhoods.toLowerCase().includes(ql),
      )
      .slice(0, 8);
  }, [q, wards, excludeIds]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Add ward
        </CardTitle>
        <CardDescription>
          Pick up to {MAX_WARDS} wards from {CITIES[city].name}. Disabled when
          {" "}the limit is reached.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search wards by name, id, or neighborhood…"
          disabled={disabled}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <div className="flex flex-wrap gap-2">
          {hits.length === 0 ? (
            <p className="text-xs text-muted-foreground">No matches.</p>
          ) : (
            hits.map((w) => (
              <Button
                key={w.id}
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => {
                  onPick(w);
                  setQ("");
                }}
                title={w.neighborhoods}
              >
                <Plus className="h-3 w-3 mr-1" />
                {w.name}
                <span className="text-muted-foreground ml-1.5">· {w.id}</span>
              </Button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  // Risk score 0–100. Tier colours mirror RiskLegend tiers.
  const tier =
    value >= 75
      ? "text-rose-600 dark:text-rose-400"
      : value >= 50
        ? "text-amber-600 dark:text-amber-400"
        : value >= 25
          ? "text-sky-600 dark:text-sky-400"
          : "text-emerald-600 dark:text-emerald-400";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className={`text-xl font-semibold tabular-nums ${tier}`}>
        {value}
      </span>
    </div>
  );
}

function WardScoreCard({
  pick,
  color,
  rank,
  cohortMaxPerK,
  onRemove,
}: {
  pick: Pick;
  color: string;
  rank: number;
  cohortMaxPerK: Partial<Record<CrimeCategory, number>>;
  onRemove: () => void;
}) {
  const { ward, city } = pick;
  const popK = Math.max(ward.population / 1000, 1);
  const totalIncidents = Object.values(ward.breakdown).reduce(
    (a: number, b) => a + (b ?? 0),
    0,
  );
  const topConcerns = useMemo(() => {
    const entries = (
      Object.entries(ward.breakdown) as [CrimeCategory, number][]
    )
      .filter(([, v]) => (v ?? 0) > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return entries.map(([cat, v]) => ({
      cat,
      v,
      label: CRIME_CATEGORY_LABELS[cat],
    }));
  }, [ward]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: color }}
              />
              <span className="truncate">
                {CITIES[city].name} · #{rank}
              </span>
            </div>
            <CardTitle className="text-base leading-tight mt-1 truncate">
              {ward.name}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-2">
              {ward.neighborhoods}
            </CardDescription>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 -mr-1 -mt-1 shrink-0"
            aria-label={`Remove ${ward.name}`}
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          <ScoreBlock label="Total" value={ward.riskScore} />
          <ScoreBlock
            label="Women"
            value={ward.riskScoreWomen}
            icon={<ShieldAlert className="h-3 w-3" />}
          />
          <ScoreBlock
            label="Day"
            value={ward.riskScore}
            icon={<Sun className="h-3 w-3" />}
          />
          <ScoreBlock
            label="Night"
            value={ward.riskScoreNight}
            icon={<Moon className="h-3 w-3" />}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Category breakdown · per 1k
          </p>
          {CATS.map((cat) => {
            const v = ward.breakdown[cat] ?? 0;
            const perK = v / popK;
            const max = cohortMaxPerK[cat] ?? 0;
            const pct = max > 0 ? Math.min(100, (perK / max) * 100) : 0;
            return (
              <div key={cat} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground truncate">
                    {CRIME_CATEGORY_LABELS[cat]}
                  </span>
                  <span className="tabular-nums">{perK.toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Top concerns
          </p>
          {topConcerns.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No incident data.
            </p>
          ) : (
            <ul className="text-xs flex flex-col gap-0.5">
              {topConcerns.map(({ cat, v, label }) => (
                <li
                  key={cat}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {v.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t">
          <span>
            Pop. {ward.population.toLocaleString("en-IN")}
          </span>
          <Link
            href={`/${city}/ward/${wardSlug(ward.id)}`}
            className="underline hover:text-foreground"
          >
            Open ward →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CompareWardsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { cityName } = useI18n();
  const [, startTransition] = useTransition();

  // City defaults to mumbai if missing/unknown — same fallback as the rest of
  // the app's "first city" heuristic.
  const rawCity = params.get("city");
  const city: CityId = rawCity && isCityId(rawCity) ? rawCity : "mumbai";
  const wardsParam = params.get("wards");
  const picks = useMemo(() => parseWardsParam(city, wardsParam), [city, wardsParam]);

  const writeUrl = useCallback(
    (nextCity: CityId, nextSlugs: string[]) => {
      const sp = new URLSearchParams();
      sp.set("city", nextCity);
      if (nextSlugs.length > 0) sp.set("wards", nextSlugs.join(","));
      startTransition(() => {
        router.replace(`${pathname}?${sp.toString()}`);
      });
    },
    [pathname, router],
  );

  const setCity = (next: CityId) => {
    if (next === city) return;
    posthog.capture("compare_wards_city_changed", { city: next });
    writeUrl(next, []);
  };

  const addWard = (w: Ward) => {
    if (picks.length >= MAX_WARDS) return;
    if (picks.some((p) => p.ward.id === w.id)) return;
    const slugs = [...picks.map((p) => wardSlug(p.ward.id)), wardSlug(w.id)];
    posthog.capture("compare_wards_added", {
      city,
      ward_id: w.id,
      count: slugs.length,
    });
    writeUrl(city, slugs);
  };

  const removeWard = (id: string) => {
    const slugs = picks
      .filter((p) => p.ward.id !== id)
      .map((p) => wardSlug(p.ward.id));
    posthog.capture("compare_wards_removed", {
      city,
      ward_id: id,
      count: slugs.length,
    });
    writeUrl(city, slugs);
  };

  const clearAll = () => {
    posthog.capture("compare_wards_clear", { city });
    writeUrl(city, []);
  };

  // Per-category cohort max (per 1k residents) so each ward's breakdown bars
  // are scaled against the picked cohort, not the whole city. This makes
  // small-volume wards visible when paired only with each other.
  const cohortMaxPerK = useMemo(() => {
    const out: Partial<Record<CrimeCategory, number>> = {};
    for (const cat of CATS) {
      let m = 0;
      for (const p of picks) {
        const popK = Math.max(p.ward.population / 1000, 1);
        const perK = (p.ward.breakdown[cat] ?? 0) / popK;
        if (perK > m) m = perK;
      }
      out[cat] = m;
    }
    return out;
  }, [picks]);

  // Share-friendly headline. Wave 3 will wire an actual share button to grab
  // this DOM node (id="ward-share-summary"). Keep the markup self-contained
  // so html-to-image / canvas serialisation works without extra hoisting.
  const headline = useMemo(() => {
    if (picks.length === 0) return null;
    const sorted = [...picks].sort((a, b) => b.ward.riskScore - a.ward.riskScore);
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];
    return {
      worst,
      best,
      delta: worst.ward.riskScore - best.ward.riskScore,
    };
  }, [picks]);

  const excludeIds = useMemo(
    () => new Set(picks.map((p) => p.ward.id)),
    [picks],
  );

  // Share URL = current pathname + current search params. Stable across
  // re-renders so the ShareCard's anchor hrefs don't churn unnecessarily.
  const shareUrl = useMemo(() => {
    const qs = params.toString();
    const path = qs ? `${pathname}?${qs}` : pathname;
    if (typeof window !== "undefined") {
      try {
        return new URL(path, window.location.origin).toString();
      } catch {
        return path;
      }
    }
    return path;
  }, [pathname, params]);

  const comparisonTitle = useMemo(() => {
    const n = picks.length;
    return `CrimeRadar — Comparing ${n} ward${n === 1 ? "" : "s"} in ${CITIES[city].name}`;
  }, [picks.length, city]);

  const comparisonSummary = useMemo(() => {
    if (!headline) return `Pick wards in ${CITIES[city].name} to compare risk scores.`;
    const worstName = headline.worst.ward.name;
    const worstScore = headline.worst.ward.riskScore;
    if (picks.length === 1) {
      return `${worstName} scores ${worstScore}/100.`;
    }
    const bestName = headline.best.ward.name;
    const bestScore = headline.best.ward.riskScore;
    return `Worst: ${worstName} (${worstScore}). Best: ${bestName} (${bestScore}). Delta: ${headline.delta}.`;
  }, [headline, picks.length, city]);

  return (
    <div className="flex-1">
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-fit transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All cities
            </Link>
            <PdfExportButton />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Compare wards
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Stack up to {MAX_WARDS} wards from the same city side-by-side.
            Scores use the same day / night / women calibration as ward pages.
            Category bars are scaled within the picked cohort, so even small
            wards stay legible.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground mr-1">City:</span>
            {CITY_IDS.map((id) => (
              <Button
                key={id}
                size="sm"
                variant={id === city ? "default" : "outline"}
                onClick={() => setCity(id)}
              >
                {cityName(id)}
              </Button>
            ))}
            <span className="ml-auto" />
            <Link
              href="/compare"
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              Compare cities instead →
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        {headline ? (
          <Card id="ward-share-summary" data-share-card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">
                CrimeRadar · ward comparison · {CITIES[city].name}
              </CardDescription>
              <CardTitle className="text-lg">
                {headline.worst.ward.name}{" "}
                <span className="text-muted-foreground font-normal">
                  scores {headline.worst.ward.riskScore}/100
                </span>
                {picks.length > 1 ? (
                  <>
                    {" "}vs{" "}
                    {headline.best.ward.name}{" "}
                    <span className="text-muted-foreground font-normal">
                      at {headline.best.ward.riskScore}/100
                    </span>
                  </>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-xs">
              {picks.length > 1 ? (
                <Badge variant="secondary">
                  Δ {headline.delta} pts between highest and lowest
                </Badge>
              ) : null}
              <Badge variant="outline">
                {picks.length} of {MAX_WARDS} wards
              </Badge>
              <Badge variant="outline">
                <BarChart3 className="h-3 w-3 mr-1" />
                Day / night / women scores
              </Badge>
              {picks.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-7"
                  onClick={clearAll}
                >
                  Clear all
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {headline ? (
          <ShareCard
            title={comparisonTitle}
            summary={comparisonSummary}
            url={shareUrl}
          />
        ) : null}

        {picks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Pick at least one ward below to start comparing.
            </CardContent>
          </Card>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 240px), 1fr))`,
            }}
          >
            {picks.map((p, i) => (
              <WardScoreCard
                key={`${p.city}:${p.ward.id}`}
                pick={p}
                color={SLOT_COLORS[i % SLOT_COLORS.length]}
                rank={i + 1}
                cohortMaxPerK={cohortMaxPerK}
                onRemove={() => removeWard(p.ward.id)}
              />
            ))}
          </div>
        )}

        <ComparePicker
          city={city}
          excludeIds={excludeIds}
          onPick={addWard}
          disabled={picks.length >= MAX_WARDS}
        />
      </section>
    </div>
  );
}

export default function CompareWardsPage() {
  // useSearchParams forces CSR for the subtree; a Suspense boundary keeps the
  // shell prerender-able for the static export build.
  return (
    <Suspense
      fallback={
        <div className="flex-1">
          <section className="border-b">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Compare wards
              </h1>
            </div>
          </section>
        </div>
      }
    >
      <CompareWardsInner />
    </Suspense>
  );
}
