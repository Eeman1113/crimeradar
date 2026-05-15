import { WARDS_SEED } from "@/data/wards-raw";
import { normalizeScores, rawScore } from "./risk";
import type { Ward } from "./types";

const SEEDED_AT = "2026-05-15";

function buildWards(): Ward[] {
  const popPerK = WARDS_SEED.map((w) => w.population / 1000);
  const rawsDay = WARDS_SEED.map((w, i) =>
    rawScore(w.breakdown, popPerK[i], false),
  );
  const rawsNight = WARDS_SEED.map((w, i) =>
    rawScore(w.breakdown, popPerK[i], true),
  );
  const day = normalizeScores(rawsDay);
  const night = normalizeScores(rawsNight);
  return WARDS_SEED.map((w, i) => ({
    id: w.id,
    name: w.name,
    neighborhoods: w.neighborhoods,
    population: w.population,
    breakdown: w.breakdown,
    topConcerns: w.topConcerns,
    riskScore: day[i],
    riskScoreNight: night[i],
    dataQuality: "seeded",
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
  return SEEDED_AT;
}
