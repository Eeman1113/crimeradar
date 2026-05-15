import { WARDS_SEED } from "@/data/wards-raw";
import monthlyStatsJson from "@/data/monthly_stats.json";
import { normalizeScores, rawScore } from "./risk";
import type { CrimeBreakdown, CrimeCategory, DataQuality, Ward } from "./types";

const SEEDED_AT = "2026-05-15";

type MonthlyStats = {
  source: string;
  indexUrl: string;
  publishedFor: { year: number; month: number } | null;
  scrapedAt: string;
  cityWideYtdTotals: Partial<Record<CrimeCategory, number>>;
};

const MONTHLY = monthlyStatsJson as MonthlyStats;

function calibrateBreakdowns(): {
  breakdowns: CrimeBreakdown[];
  quality: DataQuality;
} {
  const totals = MONTHLY?.cityWideYtdTotals ?? {};
  const cats: CrimeCategory[] = [
    "theft",
    "robbery",
    "assault",
    "sexual_offence",
    "harassment",
    "kidnapping",
    "burglary",
    "other",
  ];
  const seedTotalsByCat: Partial<Record<CrimeCategory, number>> = {};
  for (const cat of cats) {
    seedTotalsByCat[cat] = WARDS_SEED.reduce(
      (acc, w) => acc + (w.breakdown[cat] ?? 0),
      0,
    );
  }
  // scale factors per category: real_city_total / seed_total. If we don't
  // have a real total for a category, fall back to 1 (keep seed).
  const scale: Partial<Record<CrimeCategory, number>> = {};
  let calibratedAny = false;
  for (const cat of cats) {
    const real = totals[cat];
    const seedSum = seedTotalsByCat[cat] ?? 0;
    if (real != null && seedSum > 0) {
      scale[cat] = real / seedSum;
      calibratedAny = true;
    } else {
      scale[cat] = 1;
    }
  }
  const breakdowns = WARDS_SEED.map((w) => {
    const out: CrimeBreakdown = {};
    for (const cat of cats) {
      const seed = w.breakdown[cat] ?? 0;
      const s = scale[cat] ?? 1;
      out[cat] = Math.round(seed * s);
    }
    return out;
  });
  return {
    breakdowns,
    quality: calibratedAny ? "calibrated" : "seeded",
  };
}

function buildWards(): Ward[] {
  const { breakdowns, quality } = calibrateBreakdowns();
  const popPerK = WARDS_SEED.map((w) => w.population / 1000);
  const rawsDay = breakdowns.map((b, i) => rawScore(b, popPerK[i], false));
  const rawsNight = breakdowns.map((b, i) => rawScore(b, popPerK[i], true));
  const day = normalizeScores(rawsDay);
  const night = normalizeScores(rawsNight);
  return WARDS_SEED.map((w, i) => ({
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

const WARDS = buildWards();
const WARD_BY_ID = new Map(WARDS.map((w) => [w.id, w]));

export function listWards(): Ward[] {
  return WARDS;
}

export function getWard(id: string): Ward | undefined {
  return WARD_BY_ID.get(id);
}

export function dataSeededAt(): string {
  return MONTHLY?.scrapedAt?.slice(0, 10) ?? SEEDED_AT;
}

export function monthlyStatsMeta() {
  return {
    source: MONTHLY?.source ?? null,
    publishedFor: MONTHLY?.publishedFor ?? null,
    scrapedAt: MONTHLY?.scrapedAt ?? null,
    totals: MONTHLY?.cityWideYtdTotals ?? {},
  };
}
