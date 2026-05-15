#!/usr/bin/env node
// Generates a wards-raw.ts file for a city by reading its GeoJSON and
// assigning each polygon a 4-tier classification based on distance from
// the city's centroid (central → peripheral). Per-tier breakdowns are
// editorial constants — once a city's real city-aggregate stats are
// available (via monthly_stats.json), the calibration step in
// lib/wards.ts rescales them to match real city totals. Without real
// stats the values stay seeded but produce a visually differentiated map.
//
// Run: node scripts/generate_ward_seed.mjs <cityId>
//   e.g. node scripts/generate_ward_seed.mjs bangalore

import { default as centroid } from "@turf/centroid";
import { default as distance } from "@turf/distance";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const CITY_CONFIG = {
  bangalore: {
    geojson: "public/geo/bangalore_wards.geojson",
    wardIdKey: "KGISWardName",
    population: 8_500_000,
    nameOf: (props) => props.KGISWardName ?? `Ward ${props.KGISWardNo}`,
  },
  delhi: {
    geojson: "public/geo/delhi_wards.geojson",
    wardIdKey: "Ward_No",
    population: 17_000_000,
    nameOf: (props) =>
      props.Ward_Name?.toLowerCase()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ") ?? props.Ward_No,
  },
  chennai: {
    geojson: "public/geo/chennai_wards.geojson",
    wardIdKey: "Ward_No",
    population: 7_100_000,
    nameOf: (props) => `Ward ${props.Ward_No} (${props.Zone_Name})`,
  },
  hyderabad: {
    geojson: "public/geo/hyderabad_wards.geojson",
    wardIdKey: "name",
    population: 7_700_000,
    nameOf: (props) => props.name ?? "Ward",
  },
  kolkata: {
    geojson: "public/geo/kolkata_wards.geojson",
    wardIdKey: "WARD",
    population: 4_500_000,
    nameOf: (props) => `Ward ${props.WARD}`,
  },
};

// Per-tier breakdown PER 1000 PEOPLE per quarter (editorial, anchored to
// rough orders of magnitude seen in Mumbai's seed). Calibration in
// lib/wards.ts rescales these to match real city totals; the relative
// pattern between tiers is what determines map colour differentiation.
const TIER_PROFILES = [
  // tier 0 (central) — commercial / high-traffic, more theft+harassment,
  // less violent
  { theft: 1.6, harassment: 0.40, sexual_offence: 0.08, assault: 0.22, robbery: 0.16, burglary: 0.28, kidnapping: 0.04, other: 0.55 },
  // tier 1 (inner) — denser residential, mixed
  { theft: 1.2, harassment: 0.55, sexual_offence: 0.13, assault: 0.32, robbery: 0.18, burglary: 0.30, kidnapping: 0.06, other: 0.65 },
  // tier 2 (outer) — suburban, more violent/property
  { theft: 1.0, harassment: 0.40, sexual_offence: 0.12, assault: 0.36, robbery: 0.20, burglary: 0.36, kidnapping: 0.06, other: 0.70 },
  // tier 3 (peripheral) — variable, often higher per-capita
  { theft: 0.9, harassment: 0.55, sexual_offence: 0.18, assault: 0.45, robbery: 0.22, burglary: 0.30, kidnapping: 0.08, other: 0.80 },
];

const TIER_CONCERNS = [
  ["Higher pedestrian foot-traffic — pickpocketing & chain-snatching", "Isolated late-night stretches near transit interchanges"],
  ["Mixed residential/commercial — opportunistic theft", "Sub-station road stretches poorly lit at night"],
  ["Suburban service-road stretches isolated late at night", "Snatching reported along highway approaches"],
  ["Peripheral lanes very isolated at night", "Higher rates of reported violent incidents per capita"],
];

function tierFor(distNorm) {
  // distNorm is 0 (closest to centroid) … 1 (farthest). Quartile cut.
  if (distNorm < 0.25) return 0;
  if (distNorm < 0.5) return 1;
  if (distNorm < 0.75) return 2;
  return 3;
}

function noiseFactor(id) {
  // deterministic hash → [0.7 .. 1.3] noise multiplier so neighbouring
  // wards in the same tier still differ slightly
  const h = crypto.createHash("md5").update(id).digest();
  const v = h.readUInt32BE(0) / 0xffffffff;
  return 0.7 + v * 0.6;
}

function escapeTsString(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function main() {
  const cityId = process.argv[2];
  const cfg = CITY_CONFIG[cityId];
  if (!cfg) {
    console.error(
      `unknown city: ${cityId}. one of: ${Object.keys(CITY_CONFIG).join(", ")}`,
    );
    process.exit(1);
  }
  const geoPath = path.join(process.cwd(), cfg.geojson);
  const geo = JSON.parse(await fs.readFile(geoPath, "utf8"));

  // Compute each ward's centroid + a synthetic area weight (great-circle
  // squared distance covers fine for our population apportioning).
  const wardsRaw = geo.features.map((f) => {
    const c = centroid(f).geometry.coordinates; // [lon, lat]
    const id = String(f.properties[cfg.wardIdKey] ?? "");
    const name = cfg.nameOf(f.properties) || id;
    return { id, name, lon: c[0], lat: c[1], props: f.properties };
  });

  // City centroid as average of ward centroids (good enough)
  const meanLon =
    wardsRaw.reduce((a, w) => a + w.lon, 0) / wardsRaw.length;
  const meanLat =
    wardsRaw.reduce((a, w) => a + w.lat, 0) / wardsRaw.length;
  const cityCenter = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [meanLon, meanLat] },
    properties: {},
  };

  // Distance from city center per ward
  const annotated = wardsRaw.map((w) => {
    const d = distance(
      cityCenter,
      { type: "Feature", geometry: { type: "Point", coordinates: [w.lon, w.lat] }, properties: {} },
      { units: "kilometers" },
    );
    return { ...w, distance: d };
  });
  const maxDist = Math.max(...annotated.map((w) => w.distance), 1e-9);
  const popPerWard = cfg.population / annotated.length;

  const seeds = annotated.map((w) => {
    const distNorm = w.distance / maxDist;
    const tier = tierFor(distNorm);
    const profile = TIER_PROFILES[tier];
    const noise = noiseFactor(w.id);
    const population = Math.round(popPerWard * (0.8 + noiseFactor(w.id + "p") * 0.4 - 0.2));
    // breakdown for a 90-day window — profile is per-1000-people-per-quarter
    const k = (population / 1000) * noise;
    const breakdown = {
      theft: Math.max(0, Math.round(profile.theft * k)),
      robbery: Math.max(0, Math.round(profile.robbery * k)),
      assault: Math.max(0, Math.round(profile.assault * k)),
      sexual_offence: Math.max(0, Math.round(profile.sexual_offence * k)),
      harassment: Math.max(0, Math.round(profile.harassment * k)),
      kidnapping: Math.max(0, Math.round(profile.kidnapping * k)),
      burglary: Math.max(0, Math.round(profile.burglary * k)),
      other: Math.max(0, Math.round(profile.other * k)),
    };
    return {
      id: w.id,
      name: w.name,
      neighborhoods: w.name,
      population,
      breakdown,
      topConcerns: TIER_CONCERNS[tier],
    };
  });

  // Write wards-raw.ts
  const lines = [
    'import type { CrimeBreakdown } from "@/lib/types";',
    "",
    "export type WardSeed = {",
    "  id: string;",
    "  name: string;",
    "  neighborhoods: string;",
    "  population: number;",
    "  breakdown: CrimeBreakdown;",
    "  topConcerns: string[];",
    "};",
    "",
    "// Auto-generated by scripts/generate_ward_seed.mjs — do not hand-edit.",
    "// Per-ward values are editorial estimates assigned by distance-from-",
    "// centroid tier; the calibration step in lib/wards.ts rescales them",
    "// to match real city totals when monthly_stats.json has data.",
    "export const WARDS_SEED: WardSeed[] = [",
  ];
  for (const s of seeds) {
    lines.push("  {");
    lines.push(`    id: "${escapeTsString(s.id)}",`);
    lines.push(`    name: "${escapeTsString(s.name)}",`);
    lines.push(`    neighborhoods: "${escapeTsString(s.neighborhoods)}",`);
    lines.push(`    population: ${s.population},`);
    lines.push(
      `    breakdown: { ${Object.entries(s.breakdown)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")} },`,
    );
    lines.push(
      `    topConcerns: [${s.topConcerns
        .map((c) => `"${escapeTsString(c)}"`)
        .join(", ")}],`,
    );
    lines.push("  },");
  }
  lines.push("];");
  lines.push("");

  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    cityId,
    "wards-raw.ts",
  );
  await fs.writeFile(dest, lines.join("\n"));
  console.log(`wrote ${seeds.length} wards → ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
