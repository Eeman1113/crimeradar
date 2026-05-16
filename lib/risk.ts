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

// ---------------------------------------------------------------------------
// Alternative framing: "policing intensity"
// ---------------------------------------------------------------------------
//
// Requested by the sociology / RTI review (Ruchi et al.): the existing risk
// pipeline weights crime categories by perceived severity, which implicitly
// treats high-FIR wards as "dangerous neighbourhoods". An alternative reading
// is that an FIR is a record of *state behaviour* — a police station chose to
// register an event. Higher counts therefore conflate (a) actual incidence
// with (b) station-level willingness/capacity to register. Surfacing the
// un-weighted rate gives readers a second lens on the same data.
//
// These additions are purely additive — existing `rawScore`, `rawWomenScore`,
// `normalizeScores`, and `NIGHT_MULTIPLIERS` exports are unchanged.

export type RiskMode = "risk" | "policing-intensity";

export type ScoreOptions = {
  /** Apply night multipliers from `night_multipliers.json`. */
  night?: boolean;
};

type ScoreInput = {
  breakdown: CrimeBreakdown;
  /** Population expressed in thousands (per-1k denominator). */
  popPerK: number;
};

/**
 * Severity-weighted FIR rate per 1k residents. Wrapper around `rawScore` that
 * accepts a ward-like `{ breakdown, popPerK }` object so it composes with
 * `scoreByMode`. This is the "danger" framing — categories are weighted by
 * perceived harm (women's crimes 3x, violent 2x, property 0.5x).
 */
export function riskScore(ward: ScoreInput, options: ScoreOptions = {}) {
  return rawScore(ward.breakdown, ward.popPerK, options.night ?? false);
}

/**
 * Measures registered police events per resident. Higher numbers can indicate
 * active policing AND/OR higher actual incidence.
 *
 * Unlike `riskScore`, every crime category contributes equally (weight = 1).
 * The night multiplier still applies if requested, because a night-time FIR
 * is still a single registered event — the multiplier reflects reporting
 * patterns, not severity weighting. The output is shaped identically to
 * `rawScore` (a per-1k rate) so it can be fed through `normalizeScores` to
 * produce the same 0-100 p5/p95-normalised value used by the UI.
 */
export function policingIntensityScore(
  ward: ScoreInput,
  options: ScoreOptions = {},
) {
  const night = options.night ?? false;
  const b = ward.breakdown;
  const mult = (cat: CrimeCategory) => (night ? NIGHT[cat] ?? 1 : 1);
  let total = 0;
  for (const cat of Object.keys(b) as CrimeCategory[]) {
    total += (b[cat] ?? 0) * mult(cat);
  }
  const denom = Math.max(ward.popPerK, 1);
  return total / denom;
}

/**
 * Convenience dispatcher that picks the scoring function by mode. Lets call
 * sites stay agnostic when toggling between the "risk" and
 * "policing-intensity" framings.
 */
export function scoreByMode(
  ward: ScoreInput,
  mode: RiskMode,
  options: ScoreOptions = {},
) {
  return mode === "policing-intensity"
    ? policingIntensityScore(ward, options)
    : riskScore(ward, options);
}
