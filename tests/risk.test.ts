import { describe, expect, it } from "vitest";
import {
  normalizeScores,
  policingIntensityScore,
  rawScore,
  riskScore,
  scoreByMode,
  NIGHT_MULTIPLIERS,
} from "@/lib/risk";
import type { CrimeBreakdown } from "@/lib/types";

// A modest synthesised ward used across most non-snapshot assertions.
const FIXTURE_WARD = {
  breakdown: {
    theft: 80,
    robbery: 10,
    assault: 12,
    sexual_offence: 4,
    harassment: 6,
    kidnapping: 2,
    burglary: 20,
    other: 5,
  } satisfies CrimeBreakdown,
  popPerK: 50, // 50k residents
};

describe("riskScore — basic shape", () => {
  it("returns a finite non-negative number", () => {
    const s = riskScore(FIXTURE_WARD);
    expect(Number.isFinite(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0);
  });

  it("normalizeScores over a population is in [0, 100]", () => {
    // Construct a spread of wards so we exercise the p5/p95 clamping path.
    const wards: Array<typeof FIXTURE_WARD> = Array.from({ length: 25 }, (_, i) => ({
      breakdown: {
        theft: i * 4,
        robbery: i,
        assault: i * 2,
        sexual_offence: Math.floor(i / 2),
        harassment: Math.floor(i / 3),
        kidnapping: Math.floor(i / 5),
        burglary: i,
        other: i,
      },
      popPerK: 30,
    }));
    const raws = wards.map((w) => riskScore(w));
    const norm = normalizeScores(raws);
    for (const v of norm) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe("riskScore — category weights", () => {
  // popPerK=1 → denominator clamps to 1, so raw score == weighted sum.
  const POP = 1;

  it("applies a 3x weight to women's crimes (harassment is women-only)", () => {
    const s = riskScore({ breakdown: { harassment: 100 }, popPerK: POP });
    expect(s).toBeCloseTo(3 * 100, 9);
  });

  it("applies a 2x weight to violent-only crimes (robbery, assault)", () => {
    const s = riskScore({ breakdown: { robbery: 100 }, popPerK: POP });
    expect(s).toBeCloseTo(2 * 100, 9);

    const s2 = riskScore({ breakdown: { assault: 50 }, popPerK: POP });
    expect(s2).toBeCloseTo(2 * 50, 9);
  });

  it("applies a 0.5x weight to property crimes (theft, burglary)", () => {
    expect(
      riskScore({ breakdown: { theft: 100 }, popPerK: POP }),
    ).toBeCloseTo(0.5 * 100, 9);
    expect(
      riskScore({ breakdown: { burglary: 40 }, popPerK: POP }),
    ).toBeCloseTo(0.5 * 40, 9);
  });

  it("counts dual-bucket categories (sexual_offence, kidnapping) at 3+2 = 5x", () => {
    const sex = riskScore({ breakdown: { sexual_offence: 10 }, popPerK: POP });
    expect(sex).toBeCloseTo((3 + 2) * 10, 9);

    const kid = riskScore({ breakdown: { kidnapping: 10 }, popPerK: POP });
    expect(kid).toBeCloseTo((3 + 2) * 10, 9);
  });

  it("'other' category contributes zero", () => {
    expect(
      riskScore({ breakdown: { other: 999 }, popPerK: POP }),
    ).toBe(0);
  });

  it("scales inversely with popPerK (per-1k normalisation)", () => {
    const small = riskScore({ breakdown: { theft: 100 }, popPerK: 1 });
    const big = riskScore({ breakdown: { theft: 100 }, popPerK: 10 });
    expect(small / big).toBeCloseTo(10, 9);
  });

  it("clamps popPerK below 1 to 1 (no division blow-up)", () => {
    const sub = riskScore({ breakdown: { theft: 100 }, popPerK: 0.1 });
    const one = riskScore({ breakdown: { theft: 100 }, popPerK: 1 });
    expect(sub).toBeCloseTo(one, 9);
  });
});

describe("riskScore — night multipliers", () => {
  const POP = 1;

  it("night theft is 1.1x day theft (theft mult = 1.1)", () => {
    const day = riskScore({ breakdown: { theft: 100 }, popPerK: POP });
    const night = riskScore(
      { breakdown: { theft: 100 }, popPerK: POP },
      { night: true },
    );
    expect(night / day).toBeCloseTo(NIGHT_MULTIPLIERS.theft, 9);
    expect(NIGHT_MULTIPLIERS.theft).toBeCloseTo(1.1, 9);
  });

  it("night sexual_offence is 2.4x day sexual_offence", () => {
    const day = riskScore({ breakdown: { sexual_offence: 10 }, popPerK: POP });
    const night = riskScore(
      { breakdown: { sexual_offence: 10 }, popPerK: POP },
      { night: true },
    );
    expect(night / day).toBeCloseTo(NIGHT_MULTIPLIERS.sexual_offence, 9);
    expect(NIGHT_MULTIPLIERS.sexual_offence).toBeCloseTo(2.4, 9);
  });

  it("night score >= day score for any non-negative breakdown (all mults >= 1)", () => {
    const day = riskScore(FIXTURE_WARD);
    const night = riskScore(FIXTURE_WARD, { night: true });
    expect(night).toBeGreaterThanOrEqual(day);
  });

  it("default options behaves the same as { night: false }", () => {
    expect(riskScore(FIXTURE_WARD)).toBeCloseTo(
      riskScore(FIXTURE_WARD, { night: false }),
      12,
    );
  });

  it("rawScore and riskScore agree (wrapper contract)", () => {
    const a = rawScore(FIXTURE_WARD.breakdown, FIXTURE_WARD.popPerK, false);
    const b = riskScore(FIXTURE_WARD);
    expect(a).toBeCloseTo(b, 12);

    const an = rawScore(FIXTURE_WARD.breakdown, FIXTURE_WARD.popPerK, true);
    const bn = riskScore(FIXTURE_WARD, { night: true });
    expect(an).toBeCloseTo(bn, 12);
  });
});

describe("scoreByMode dispatcher", () => {
  it("'risk' mode == riskScore", () => {
    expect(scoreByMode(FIXTURE_WARD, "risk")).toBeCloseTo(
      riskScore(FIXTURE_WARD),
      12,
    );
  });
  it("'policing-intensity' mode == policingIntensityScore", () => {
    expect(scoreByMode(FIXTURE_WARD, "policing-intensity")).toBeCloseTo(
      policingIntensityScore(FIXTURE_WARD),
      12,
    );
  });
});

// ---------------------------------------------------------------------------
// Snapshot: three reference wards (low / medium / high).
// If these scores change, the snapshot file will fail — review whether the
// weights/multipliers actually changed before regenerating.
// ---------------------------------------------------------------------------
describe("riskScore — snapshot (low / medium / high)", () => {
  const wards = {
    low: {
      breakdown: {
        theft: 20,
        robbery: 1,
        assault: 2,
        sexual_offence: 0,
        harassment: 1,
        kidnapping: 0,
        burglary: 4,
        other: 2,
      },
      popPerK: 80,
    },
    medium: {
      breakdown: {
        theft: 120,
        robbery: 8,
        assault: 14,
        sexual_offence: 3,
        harassment: 6,
        kidnapping: 1,
        burglary: 18,
        other: 6,
      },
      popPerK: 60,
    },
    high: {
      breakdown: {
        theft: 400,
        robbery: 30,
        assault: 55,
        sexual_offence: 14,
        harassment: 28,
        kidnapping: 5,
        burglary: 60,
        other: 12,
      },
      popPerK: 40,
    },
  } as const;

  it("matches snapshot for raw day/night scores", () => {
    const out: Record<string, { day: number; night: number }> = {};
    for (const [k, w] of Object.entries(wards)) {
      out[k] = {
        day: Number(riskScore(w).toFixed(6)),
        night: Number(riskScore(w, { night: true }).toFixed(6)),
      };
    }
    expect(out).toMatchSnapshot();
  });

  it("normalised scores rank low < medium < high", () => {
    const raws = (Object.values(wards) as Array<typeof wards.low>).map((w) =>
      riskScore(w),
    );
    const norm = normalizeScores(raws);
    expect(norm[0]).toBeLessThanOrEqual(norm[1]);
    expect(norm[1]).toBeLessThanOrEqual(norm[2]);
    expect(norm).toMatchSnapshot();
  });
});
