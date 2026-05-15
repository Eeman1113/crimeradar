import { WARDS_SEED as MUMBAI_SEED } from "@/data/cities/mumbai/wards-raw";
import { WARDS_SEED as BANGALORE_SEED } from "@/data/cities/bangalore/wards-raw";
import { WARDS_SEED as DELHI_SEED } from "@/data/cities/delhi/wards-raw";
import { WARDS_SEED as CHENNAI_SEED } from "@/data/cities/chennai/wards-raw";
import { WARDS_SEED as HYDERABAD_SEED } from "@/data/cities/hyderabad/wards-raw";
import { WARDS_SEED as KOLKATA_SEED } from "@/data/cities/kolkata/wards-raw";

import mumbaiStatsJson from "@/data/cities/mumbai/monthly_stats.json";
import bangaloreStatsJson from "@/data/cities/bangalore/monthly_stats.json";
import delhiStatsJson from "@/data/cities/delhi/monthly_stats.json";
import chennaiStatsJson from "@/data/cities/chennai/monthly_stats.json";
import hyderabadStatsJson from "@/data/cities/hyderabad/monthly_stats.json";
import kolkataStatsJson from "@/data/cities/kolkata/monthly_stats.json";

import { normalizeScores, rawScore } from "./risk";
import type {
  CrimeBreakdown,
  CrimeCategory,
  DataQuality,
  Ward,
} from "./types";
import type { CityId } from "./cities";

type WardSeedFile = typeof MUMBAI_SEED;

type MonthlyStats = {
  source: string | null;
  indexUrl?: string;
  publishedFor: { year: number; month?: number } | null;
  windowKind?: "ytd" | "month" | "year";
  scrapedAt: string | null;
  cityWideYtdTotals: Partial<Record<CrimeCategory, number>>;
  notes?: string;
};

const SEEDS: Record<CityId, WardSeedFile> = {
  mumbai: MUMBAI_SEED,
  bangalore: BANGALORE_SEED,
  delhi: DELHI_SEED,
  chennai: CHENNAI_SEED,
  hyderabad: HYDERABAD_SEED,
  kolkata: KOLKATA_SEED,
};

const STATS: Record<CityId, MonthlyStats> = {
  mumbai: mumbaiStatsJson as MonthlyStats,
  bangalore: bangaloreStatsJson as MonthlyStats,
  delhi: delhiStatsJson as MonthlyStats,
  chennai: chennaiStatsJson as MonthlyStats,
  hyderabad: hyderabadStatsJson as MonthlyStats,
  kolkata: kolkataStatsJson as MonthlyStats,
};

const FALLBACK_SEEDED_AT = "2026-05-15";

const CATS: CrimeCategory[] = [
  "theft",
  "robbery",
  "assault",
  "sexual_offence",
  "harassment",
  "kidnapping",
  "burglary",
  "other",
];

function calibrate(
  seed: WardSeedFile,
  stats: MonthlyStats | undefined,
): { breakdowns: CrimeBreakdown[]; quality: DataQuality } {
  const totals = stats?.cityWideYtdTotals ?? {};
  const seedTotalsByCat: Partial<Record<CrimeCategory, number>> = {};
  for (const cat of CATS) {
    seedTotalsByCat[cat] = seed.reduce(
      (acc, w) => acc + (w.breakdown[cat] ?? 0),
      0,
    );
  }
  const scale: Partial<Record<CrimeCategory, number>> = {};
  let calibratedAny = false;
  for (const cat of CATS) {
    const real = totals[cat];
    const seedSum = seedTotalsByCat[cat] ?? 0;
    if (real != null && seedSum > 0) {
      scale[cat] = real / seedSum;
      calibratedAny = true;
    } else {
      scale[cat] = 1;
    }
  }
  const breakdowns = seed.map((w) => {
    const out: CrimeBreakdown = {};
    for (const cat of CATS) {
      const s = scale[cat] ?? 1;
      out[cat] = Math.round((w.breakdown[cat] ?? 0) * s);
    }
    return out;
  });
  return {
    breakdowns,
    quality: calibratedAny ? "calibrated" : "seeded",
  };
}

function buildWardsFor(city: CityId): Ward[] {
  const seed = SEEDS[city];
  if (seed.length === 0) return [];
  const stats = STATS[city];
  const { breakdowns, quality } = calibrate(seed, stats);
  const popPerK = seed.map((w) => w.population / 1000);
  const rawsDay = breakdowns.map((b, i) => rawScore(b, popPerK[i], false));
  const rawsNight = breakdowns.map((b, i) => rawScore(b, popPerK[i], true));
  const day = normalizeScores(rawsDay);
  const night = normalizeScores(rawsNight);
  return seed.map((w, i) => ({
    id: w.id,
    name: w.name,
    neighborhoods: w.neighborhoods,
    population: w.population,
    breakdown: breakdowns[i],
    topConcerns: w.topConcerns,
    riskScore: day[i],
    riskScoreNight: night[i],
    dataQuality: quality,
  }));
}

const WARDS_BY_CITY: Record<CityId, Ward[]> = {
  mumbai: buildWardsFor("mumbai"),
  bangalore: buildWardsFor("bangalore"),
  delhi: buildWardsFor("delhi"),
  chennai: buildWardsFor("chennai"),
  hyderabad: buildWardsFor("hyderabad"),
  kolkata: buildWardsFor("kolkata"),
};

const WARD_INDEX: Record<CityId, Map<string, Ward>> = Object.fromEntries(
  (Object.keys(WARDS_BY_CITY) as CityId[]).map((c) => [
    c,
    new Map(WARDS_BY_CITY[c].map((w) => [w.id, w])),
  ]),
) as Record<CityId, Map<string, Ward>>;

export function listWards(city: CityId): Ward[] {
  return WARDS_BY_CITY[city] ?? [];
}

export function getWard(city: CityId, id: string): Ward | undefined {
  return WARD_INDEX[city]?.get(id);
}

// URL slug for a ward id. Ward IDs can contain slashes ("M/E"), spaces
// ("Kempegowda Ward"), parens, etc. We normalise to lowercase ascii with
// dashes, and keep a per-city reverse map so the static export round-trips.
export function wardSlug(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_INDEX: Record<CityId, Map<string, Ward>> = Object.fromEntries(
  (Object.keys(WARDS_BY_CITY) as CityId[]).map((c) => {
    const m = new Map<string, Ward>();
    for (const w of WARDS_BY_CITY[c]) {
      m.set(wardSlug(w.id), w);
    }
    return [c, m];
  }),
) as Record<CityId, Map<string, Ward>>;

export function wardFromSlug(city: CityId, slug: string): Ward | undefined {
  return SLUG_INDEX[city]?.get(slug);
}

export function dataSeededAt(city: CityId): string {
  return (
    STATS[city]?.scrapedAt?.slice(0, 10) ?? FALLBACK_SEEDED_AT
  );
}

export function monthlyStatsMeta(city: CityId) {
  const s = STATS[city];
  return {
    source: s?.source ?? null,
    publishedFor: s?.publishedFor ?? null,
    windowKind: s?.windowKind ?? "ytd",
    scrapedAt: s?.scrapedAt ?? null,
    totals: s?.cityWideYtdTotals ?? {},
  };
}

export function cityDataQuality(city: CityId): DataQuality | "empty" {
  const ws = WARDS_BY_CITY[city];
  if (!ws || ws.length === 0) return "empty";
  return ws[0].dataQuality;
}
