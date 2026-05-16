import { describe, it, expect } from "vitest";
import { listWards, cityDataQuality, monthlyStatsMeta } from "@/lib/wards";
import type { CrimeBreakdown } from "@/lib/types";

const CRIME_KEYS: (keyof CrimeBreakdown)[] = [
  "theft",
  "burglary",
  "robbery",
  "assault",
  "sexual_offence",
  "harassment",
  "kidnapping",
  "other",
];

function sumBreakdowns(b: CrimeBreakdown[]): Record<keyof CrimeBreakdown, number> {
  const acc: Record<keyof CrimeBreakdown, number> = {
    theft: 0,
    burglary: 0,
    robbery: 0,
    assault: 0,
    sexual_offence: 0,
    harassment: 0,
    kidnapping: 0,
    other: 0,
  };
  for (const cb of b) {
    if (!cb) continue;
    for (const k of CRIME_KEYS) {
      acc[k] = acc[k] + (cb[k] ?? 0);
    }
  }
  return acc;
}

describe("calibrate() — via public listWards()", () => {
  // calibrate() is private; we exercise it through listWards which calls it
  // during build. For any city whose dataQuality is "calibrated", the sum of
  // per-ward category counts must match the city-level totals for every
  // category present in the source stats.
  it("ward category sums equal city totals for calibrated cities", () => {
    const wards = listWards("mumbai");
    expect(wards.length).toBeGreaterThan(0);
    if (cityDataQuality("mumbai") !== "calibrated") return;

    const stats = monthlyStatsMeta("mumbai");
    expect(stats).toBeTruthy();

    const wardSum = sumBreakdowns(wards.map((w) => w.breakdown));
    const cityTotals = (stats as unknown as { breakdown?: CrimeBreakdown })
      .breakdown;
    if (!cityTotals) return;

    for (const k of CRIME_KEYS) {
      const total = cityTotals[k];
      if (!total) continue;
      // Allow ±2 of slack for floating rounding when seedSum is uneven.
      expect(Math.abs(wardSum[k] - total)).toBeLessThanOrEqual(2);
    }
  });

  it("ward populations sum to a plausible city total", () => {
    const wards = listWards("mumbai");
    const popSum = wards.reduce((s, w) => s + w.population, 0);
    // 2011 Census Greater Mumbai ~12.4M. Allow 8M–16M range as sanity.
    expect(popSum).toBeGreaterThan(8_000_000);
    expect(popSum).toBeLessThan(16_000_000);
  });

  it("no ward population is in the millions (guards _000 typo bug)", () => {
    const wards = listWards("mumbai");
    for (const w of wards) {
      expect(w.population).toBeLessThan(2_000_000);
      expect(w.population).toBeGreaterThan(0);
    }
  });
});

describe("cityDataQuality()", () => {
  it("returns a valid quality tier for every supported city", () => {
    const allowed = new Set(["live", "calibrated", "seeded", "empty"]);
    const cities = ["mumbai", "delhi", "bangalore", "chennai", "kolkata"] as const;
    for (const c of cities) {
      const q = cityDataQuality(c);
      expect(allowed.has(q)).toBe(true);
    }
  });
});
