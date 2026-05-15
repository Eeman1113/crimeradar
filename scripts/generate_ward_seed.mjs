#!/usr/bin/env node
// Generates a wards-raw.ts file for a city by reading its GeoJSON and
// assigning each polygon a 4-tier classification based on distance from
// the city's centroid (central → peripheral). Per-tier breakdowns are
// editorial constants — once a city's real city-aggregate stats are
// available (via monthly_stats.json), the calibration step in
// lib/wards.ts rescales them to match real city totals. Without real
// stats the values stay seeded but produce a visually differentiated map.
//
// Legacy CLI (for the 5 cities originally seeded this way):
//   node scripts/generate_ward_seed.mjs <cityId>
// Programmatic (new cities — used by scripts/add_city.mjs):
//   import { generateSeed } from "./generate_ward_seed.mjs";

import { default as centroid } from "@turf/centroid";
import { default as distance } from "@turf/distance";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// Original five-city hard-coded table. Kept so the legacy CLI still works.
// New cities should flow through scripts/add_city.mjs, which calls
// generateSeed() directly.
const LEGACY_CITY_CONFIG = {
  bangalore: {
    geojson: "public/geo/bangalore_wards.geojson",
    wardIdKey: "KGISWardName",
    population: 8_500_000,
    nameTemplate: "{KGISWardName|Ward {KGISWardNo}}",
  },
  delhi: {
    geojson: "public/geo/delhi_wards.geojson",
    wardIdKey: "Ward_No",
    population: 17_000_000,
    nameFn: (props) =>
      props.Ward_Name?.toLowerCase()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ") ?? props.Ward_No,
  },
  chennai: {
    geojson: "public/geo/chennai_wards.geojson",
    wardIdKey: "Ward_No",
    population: 7_100_000,
    nameTemplate: "Ward {Ward_No} ({Zone_Name})",
  },
  hyderabad: {
    geojson: "public/geo/hyderabad_wards.geojson",
    wardIdKey: "name",
    population: 7_700_000,
    nameTemplate: "{name|Ward}",
  },
  kolkata: {
    geojson: "public/geo/kolkata_wards.geojson",
    wardIdKey: "WARD",
    population: 4_500_000,
    nameTemplate: "Ward {WARD}",
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
  if (distNorm < 0.25) return 0;
  if (distNorm < 0.5) return 1;
  if (distNorm < 0.75) return 2;
  return 3;
}

function noiseFactor(id) {
  const h = crypto.createHash("md5").update(id).digest();
  const v = h.readUInt32BE(0) / 0xffffffff;
  return 0.7 + v * 0.6;
}

function escapeTsString(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function titleCaseIfAllCaps(s) {
  if (s === s.toUpperCase() && s.length > 3) {
    return s
      .toLowerCase()
      .split(/\s+/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(" ");
  }
  return s;
}

// Substitutes {key} tokens against a properties object. Supports a
// fallback with {key|fallback}, e.g. {name|Ward {Ward_No}} — if `name`
// is missing or empty, the fallback string is used (also templated).
function applyTemplate(template, props) {
  return template.replace(/\{([^{}]+)\}/g, (_, expr) => {
    const [key, fallback] = expr.split("|").map((s) => s.trim());
    const v = props[key];
    if (v != null && v !== "") return String(v);
    if (fallback != null) return applyTemplate(fallback, props);
    return "";
  });
}

// Generic name inference when no template provided. Tries common keys.
const COMMON_NAME_KEYS = [
  "name", "Name", "NAME",
  "Ward_Name", "WARD_NAME", "ward_name",
  "KGISWardName",
];
function inferName(props, wardIdKey) {
  for (const k of COMMON_NAME_KEYS) {
    if (props[k]) return titleCaseIfAllCaps(String(props[k]));
  }
  const id = props[wardIdKey];
  if (id != null) return `Ward ${id}`;
  return "Ward";
}

/**
 * Programmatic seed generator. Used by scripts/add_city.mjs.
 *
 * @param {object} opts
 * @param {string} opts.cityId
 * @param {string} opts.geojsonPath        absolute or repo-relative
 * @param {string} opts.wardIdKey
 * @param {number} opts.population         city total (used to apportion per-ward)
 * @param {string} [opts.nameTemplate]     e.g. "Ward {Ward_No}" or "{Ward_Name|Ward {Ward_No}}"
 * @param {(props: object) => string} [opts.nameFn]   takes precedence over nameTemplate
 * @param {string} [opts.outPath]          override destination
 * @returns {Promise<{count: number, outPath: string}>}
 */
export async function generateSeed(opts) {
  const { cityId, wardIdKey, population, nameTemplate, nameFn } = opts;
  const geoPath = path.isAbsolute(opts.geojsonPath)
    ? opts.geojsonPath
    : path.join(process.cwd(), opts.geojsonPath);
  const outPath =
    opts.outPath ??
    path.join(process.cwd(), "data", "cities", cityId, "wards-raw.ts");

  const geo = JSON.parse(await fs.readFile(geoPath, "utf8"));
  if (!geo?.features?.length) {
    throw new Error(`${geoPath}: no features found`);
  }
  const resolveName = (props) => {
    if (nameFn) return nameFn(props) || String(props[wardIdKey] ?? "Ward");
    if (nameTemplate) {
      const v = applyTemplate(nameTemplate, props).trim();
      if (v) return v;
    }
    return inferName(props, wardIdKey);
  };

  const wardsRaw = geo.features.map((f) => {
    const c = centroid(f).geometry.coordinates;
    const id = String(f.properties[wardIdKey] ?? "");
    if (!id) throw new Error(`feature missing ward id at key "${wardIdKey}"`);
    return { id, name: resolveName(f.properties), lon: c[0], lat: c[1] };
  });

  const meanLon = wardsRaw.reduce((a, w) => a + w.lon, 0) / wardsRaw.length;
  const meanLat = wardsRaw.reduce((a, w) => a + w.lat, 0) / wardsRaw.length;
  const cityCenter = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [meanLon, meanLat] },
    properties: {},
  };
  const annotated = wardsRaw.map((w) => {
    const d = distance(
      cityCenter,
      { type: "Feature", geometry: { type: "Point", coordinates: [w.lon, w.lat] }, properties: {} },
      { units: "kilometers" },
    );
    return { ...w, distance: d };
  });
  const maxDist = Math.max(...annotated.map((w) => w.distance), 1e-9);
  const popPerWard = population / annotated.length;

  const seeds = annotated.map((w) => {
    const distNorm = w.distance / maxDist;
    const tier = tierFor(distNorm);
    const profile = TIER_PROFILES[tier];
    const noise = noiseFactor(w.id);
    const wPop = Math.round(popPerWard * (0.8 + noiseFactor(w.id + "p") * 0.4 - 0.2));
    const k = (wPop / 1000) * noise;
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
      population: wPop,
      breakdown,
      topConcerns: TIER_CONCERNS[tier],
    };
  });

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

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, lines.join("\n"));
  return { count: seeds.length, outPath };
}

async function cli() {
  const cityId = process.argv[2];
  const cfg = LEGACY_CITY_CONFIG[cityId];
  if (!cfg) {
    console.error(
      `unknown legacy city: ${cityId}. one of: ${Object.keys(LEGACY_CITY_CONFIG).join(", ")}\n` +
        `for new cities use scripts/add_city.mjs.`,
    );
    process.exit(1);
  }
  const { count, outPath } = await generateSeed({
    cityId,
    geojsonPath: cfg.geojson,
    wardIdKey: cfg.wardIdKey,
    population: cfg.population,
    nameTemplate: cfg.nameTemplate,
    nameFn: cfg.nameFn,
  });
  console.log(`wrote ${count} wards → ${outPath}`);
}

// Run CLI when invoked directly (not when imported).
if (import.meta.url === `file://${process.argv[1]}`) {
  cli().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
