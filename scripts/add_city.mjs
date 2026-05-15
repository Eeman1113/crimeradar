#!/usr/bin/env node
// Onboard a new city: validate the GeoJSON, register the city in
// data/cities.manifest.json, generate data/cities/<id>/wards-raw.ts,
// and stub the four data JSONs. Idempotent — re-running with the same
// inputs is safe (manifest dedupes by id, seeds rewrite deterministically).
//
// Usage (CLI flags):
//   node scripts/add_city.mjs \
//     --id lucknow --name Lucknow --state "Uttar Pradesh" --state-code IN-UP \
//     --tier capital --geojson public/geo/lucknow_wards.geojson \
//     --ward-id-key ward_no --unit "LMC ward" --population 3700000
//
// Or from a JSON file:
//   node scripts/add_city.mjs --from new_city.json
//
// Optional flags:
//   --name-template "Ward {Ward_No}"   substitute into ward name (see generateSeed)
//   --has-monthly-stats                 default false
//   --has-absconders                    default false
//   --force                             overwrite an existing manifest entry
//   --skip-codegen                      don't run codegen_cities at the end

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { generateSeed } from "./generate_ward_seed.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = resolve(ROOT, "data/cities.manifest.json");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function readManifest() {
  const raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  if (!Array.isArray(raw)) throw new Error("manifest is not an array");
  return raw;
}

function computeBounds(features) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const visit = (coords) => {
    if (typeof coords[0] === "number") {
      const [lon, lat] = coords;
      if (lon < w) w = lon;
      if (lon > e) e = lon;
      if (lat < s) s = lat;
      if (lat > n) n = lat;
    } else {
      for (const c of coords) visit(c);
    }
  };
  for (const f of features) visit(f.geometry.coordinates);
  return [[w, s], [e, n]];
}

function center(bounds) {
  return [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
}

async function ensureDataStubs(cityId) {
  const dir = join(ROOT, "data/cities", cityId);
  await mkdir(dir, { recursive: true });
  const stubs = {
    "monthly_stats.json": {
      source: null,
      publishedFor: null,
      scrapedAt: null,
      cityWideYtdTotals: {},
      notes: "Pending ingest.",
    },
    "monthly_stats_history.json": {
      source: null,
      scrapedAt: null,
      count: 0,
      months: [],
    },
    "ward_news.json": {
      source: "https://news.google.com/rss/search",
      scrapedAt: null,
      wards: {},
    },
    "absconders.json": {
      source: null,
      scrapedAt: null,
      count: 0,
      absconders: [],
      notes: "No absconder source identified yet.",
    },
  };
  const written = [];
  for (const [name, content] of Object.entries(stubs)) {
    const p = join(dir, name);
    if (!existsSync(p)) {
      await writeFile(p, JSON.stringify(content, null, 2) + "\n");
      written.push(p);
    }
  }
  return written;
}

function loadConfig(args) {
  if (args.from) {
    return JSON.parse(readFileSync(resolve(args.from), "utf8"));
  }
  const required = ["id", "name", "state", "state-code", "tier", "geojson", "ward-id-key", "unit", "population"];
  for (const r of required) {
    if (args[r] === undefined) {
      throw new Error(`missing required flag: --${r}`);
    }
  }
  return {
    id: args.id,
    name: args.name,
    state: args.state,
    stateCode: args["state-code"],
    tier: args.tier,
    geojson: args.geojson.startsWith("/") ? args.geojson : `/${args.geojson.replace(/^public\//, "")}`,
    geojsonPath: args.geojson,
    wardIdKey: args["ward-id-key"],
    unit: args.unit,
    population: Number(args.population),
    nameTemplate: args["name-template"],
    hasMonthlyStats: args["has-monthly-stats"] === true,
    hasAbsconders: args["has-absconders"] === true,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const cfg = loadConfig(args);

  // Validate GeoJSON
  const geoPath = resolve(ROOT, cfg.geojsonPath ?? cfg.geojson.replace(/^\//, ""));
  if (!existsSync(geoPath)) throw new Error(`GeoJSON not found: ${geoPath}`);
  const geo = JSON.parse(readFileSync(geoPath, "utf8"));
  if (!geo?.features?.length) throw new Error(`${geoPath}: no features`);
  const ids = new Set();
  for (const f of geo.features) {
    const id = f.properties?.[cfg.wardIdKey];
    if (id == null || id === "") {
      throw new Error(`feature missing "${cfg.wardIdKey}": ${JSON.stringify(f.properties).slice(0, 200)}`);
    }
    if (ids.has(String(id))) throw new Error(`duplicate ward id: ${id}`);
    ids.add(String(id));
  }

  const bounds = computeBounds(geo.features);
  const c = center(bounds);

  // Update manifest
  const manifest = readManifest();
  const existing = manifest.findIndex((m) => m.id === cfg.id);
  if (existing >= 0 && !args.force) {
    throw new Error(`city "${cfg.id}" already in manifest; pass --force to overwrite`);
  }
  const entry = {
    id: cfg.id,
    name: cfg.name,
    state: cfg.state,
    stateCode: cfg.stateCode,
    tier: cfg.tier,
    center: c,
    bounds,
    geojson: cfg.geojson,
    wardIdKey: cfg.wardIdKey,
    unit: cfg.unit,
    hasMonthlyStats: cfg.hasMonthlyStats,
    hasAbsconders: cfg.hasAbsconders,
  };
  if (existing >= 0) manifest[existing] = entry;
  else manifest.push(entry);
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`manifest: ${existing >= 0 ? "updated" : "added"} ${cfg.id} (${ids.size} wards)`);

  // Stub data files
  const stubbed = await ensureDataStubs(cfg.id);
  if (stubbed.length) {
    console.log(`stubbed ${stubbed.length} data file(s) under data/cities/${cfg.id}/`);
  }

  // Generate wards-raw.ts
  const { count, outPath } = await generateSeed({
    cityId: cfg.id,
    geojsonPath: geoPath,
    wardIdKey: cfg.wardIdKey,
    population: cfg.population,
    nameTemplate: cfg.nameTemplate,
  });
  console.log(`wards-raw.ts: wrote ${count} wards → ${outPath.replace(`${ROOT}/`, "")}`);

  // Re-run codegen
  if (!args["skip-codegen"]) {
    execFileSync("node", [resolve(ROOT, "scripts/codegen_cities.mjs")], { stdio: "inherit" });
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
