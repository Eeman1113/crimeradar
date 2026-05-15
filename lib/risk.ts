import type { CrimeBreakdown, CrimeCategory } from "./types";
import nightMultipliers from "./night_multipliers.json";

const NIGHT: Record<CrimeCategory, number> = nightMultipliers as Record<
  CrimeCategory,
  number
>;

const VIOLENT: CrimeCategory[] = [
  "robbery",
  "assault",
  "sexual_offence",
  "kidnapping",
];
const PROPERTY: CrimeCategory[] = ["theft", "burglary"];
const AGAINST_WOMEN: CrimeCategory[] = [
  "sexual_offence",
  "harassment",
  "kidnapping",
];

export function rawScore(b: CrimeBreakdown, popPerK: number, night: boolean) {
  const mult = (cat: CrimeCategory) => (night ? NIGHT[cat] ?? 1 : 1);
  const sum = (cats: CrimeCategory[]) =>
    cats.reduce((acc, c) => acc + (b[c] ?? 0) * mult(c), 0);
  const womenCrimes = sum(AGAINST_WOMEN);
  const violent = sum(VIOLENT);
  const property = sum(PROPERTY);
  const denom = Math.max(popPerK, 1);
  return (3.0 * womenCrimes + 2.0 * violent + 0.5 * property) / denom;
}

// Women-only score: same per-1k normalisation but ONLY the crimes-against-
// women bucket. Used by the "Women's safety mode" toggle on the UI.
export function rawWomenScore(
  b: CrimeBreakdown,
  popPerK: number,
  night: boolean,
) {
  const mult = (cat: CrimeCategory) => (night ? NIGHT[cat] ?? 1 : 1);
  const women = AGAINST_WOMEN.reduce(
    (acc, c) => acc + (b[c] ?? 0) * mult(c),
    0,
  );
  const denom = Math.max(popPerK, 1);
  return women / denom;
}

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function normalizeScores(raws: number[]) {
  const sorted = [...raws].sort((a, b) => a - b);
  const p5 = percentile(sorted, 5);
  const p95 = percentile(sorted, 95);
  const span = Math.max(p95 - p5, 1e-9);
  return raws.map((r) => {
    const clamped = Math.min(Math.max(r, p5), p95);
    return Math.round((100 * (clamped - p5)) / span);
  });
}

export const NIGHT_MULTIPLIERS = NIGHT;
