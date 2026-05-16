# CrimeRadar — public data index

Reviewer-facing exports of the weight matrices and apportioning rules used by
the CrimeRadar risk model. Published so journalists, researchers, RTI activists,
and ward residents can audit how a ward's 0-100 risk score is computed.

## Files

- **`apportioning_weights.csv`** — How seeded ward-level breakdowns are scaled
  to match official city-wide YTD totals. Implemented by `calibrate()` in
  `lib/wards.ts`. Columns: `tier, category, weight, notes`. Note: the current
  implementation does not bucket wards into central/inner/outer/peripheral
  tiers — every ward in a city shares the same per-category scale factor
  computed at build time from the city's monthly stats JSON. See the NOTE row
  in the CSV.

- **`category_weights.csv`** — Per-category risk weights and night-time
  multipliers fed into `rawScore()` in `lib/risk.ts`. Columns: `category,
  group, group_weight, night_multiplier, notes`. Encodes the 3x / 2x / 0.5x
  weighting for crimes-against-women, violent, and property buckets plus the
  category-level night multipliers from `lib/night_multipliers.json`.

## How the score is built

1. Seed ward breakdowns (from `lib/wards.generated.ts`) are scaled per
   category so each city's totals match published YTD numbers — see
   `apportioning_weights.csv`.
2. A raw weighted incident rate per 1,000 residents is computed for each ward
   using the weights in `category_weights.csv`.
3. Raw rates are clamped to the p5-p95 range across the city's wards and
   rescaled to 0-100. Night and women-only scores reuse the same pipeline with
   different multipliers / category subsets.

## Provenance

Inputs are the published monthly police statistics linked from each city's
methodology page. The seed breakdowns and any unverified figures are flagged
`seeded`; ward sets that have been scaled against published totals are flagged
`calibrated` and surfaced in the UI via `cityDataQuality()`.
