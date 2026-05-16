#!/usr/bin/env node
// Export per-city monthly_stats.json files to flat CSVs in public/data/.
// Columns: year,window,category,count,source,scraped_at

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CITIES_DIR = path.join(REPO_ROOT, "data", "cities");
const OUT_DIR = path.join(REPO_ROOT, "public", "data");

const HEADER = ["year", "window", "category", "count", "source", "scraped_at"];

/** Quote a CSV field if it contains a comma, quote, CR or LF. */
function csvField(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsvRow(values) {
  return values.map(csvField).join(",");
}

/** Build the human-readable `window` token, e.g. `year`, `ytd:3`, `month:4`. */
function buildWindowToken(stats) {
  const kind = stats.windowKind ?? "";
  const month = stats?.publishedFor?.month;
  if (kind && Number.isFinite(month)) return `${kind}:${month}`;
  return kind;
}

async function listCityIds() {
  const entries = await fs.readdir(CITIES_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

async function readStats(cityId) {
  const file = path.join(CITIES_DIR, cityId, "monthly_stats.json");
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === "ENOENT") return null;
    throw err;
  }
}

async function exportCity(cityId) {
  const stats = await readStats(cityId);
  if (!stats) return { cityId, wrote: false, reason: "no monthly_stats.json" };

  const totals = stats.cityWideYtdTotals ?? {};
  const year = stats?.publishedFor?.year ?? "";
  const windowToken = buildWindowToken(stats);
  const source = stats.source ?? "";
  const scrapedAt = stats.scrapedAt ?? "";

  const categories = Object.keys(totals).sort();
  const lines = [toCsvRow(HEADER)];
  for (const cat of categories) {
    const count = totals[cat];
    if (count === null || count === undefined) continue;
    lines.push(toCsvRow([year, windowToken, cat, count, source, scrapedAt]));
  }

  const outPath = path.join(OUT_DIR, `${cityId}.csv`);
  await fs.writeFile(outPath, lines.join("\n") + "\n", "utf8");
  return { cityId, wrote: true, rows: categories.length, outPath };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const cityIds = await listCityIds();

  let written = 0;
  let skipped = 0;
  for (const cityId of cityIds) {
    const res = await exportCity(cityId);
    if (res.wrote) {
      written += 1;
      console.log(`wrote ${path.relative(REPO_ROOT, res.outPath)} (${res.rows} rows)`);
    } else {
      skipped += 1;
      console.warn(`skip ${cityId}: ${res.reason}`);
    }
  }
  console.log(`\nDone. ${written} csv(s) written, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
