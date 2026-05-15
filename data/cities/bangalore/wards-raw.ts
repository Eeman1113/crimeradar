import type { CrimeBreakdown } from "@/lib/types";

export type WardSeed = {
  id: string;
  name: string;
  neighborhoods: string;
  population: number;
  breakdown: CrimeBreakdown;
  topConcerns: string[];
};

// Placeholder — real seed lands once research + GeoJSON are wired up.
export const WARDS_SEED: WardSeed[] = [];
