#!/usr/bin/env node
// Fetches localized city names from Wikipedia's interlanguage links for all
// cities in data/cities.manifest.json. Output: merges a `nameI18n` field
// into each manifest row, keyed by our 12 non-English locales.
//
// Run: node scripts/fetch_city_names.mjs
// Idempotent — preserves existing nameI18n entries; only fills in missing
// locales. Re-running picks up new languages without overwriting curated
// values.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST = resolve(ROOT, "data/cities.manifest.json");

// Map our city ids to the canonical English Wikipedia article title.
// For Vijayawada-as-amaravati we fetch Vijayawada's translations because
// that's the city whose ward boundaries we actually serve.
const ID_TO_WIKI = {
  mumbai: "Mumbai",
  bangalore: "Bengaluru",
  delhi: "Delhi",
  chennai: "Chennai",
  hyderabad: "Hyderabad",
  kolkata: "Kolkata",
  pune: "Pune",
  gurugram: "Gurugram",
  noida: "Noida",
  bhubaneswar: "Bhubaneswar",
  ahmedabad: "Ahmedabad",
  coimbatore: "Coimbatore",
  indore: "Indore",
  jaipur: "Jaipur",
  lucknow: "Lucknow",
  surat: "Surat",
  kochi: "Kochi",
  kanpur: "Kanpur",
  nagpur: "Nagpur",
  patna: "Patna",
  bhopal: "Bhopal",
  ranchi: "Ranchi",
  thiruvananthapuram: "Thiruvananthapuram",
  dehradun: "Dehradun",
  gandhinagar: "Gandhinagar",
  panaji: "Panaji",
  raipur: "Raipur",
  chandigarh: "Chandigarh",
  shillong: "Shillong",
  aizawl: "Aizawl",
  imphal: "Imphal",
  itanagar: "Itanagar",
  kohima: "Kohima",
  agartala: "Agartala",
  shimla: "Shimla",
  srinagar: "Srinagar",
  jammu: "Jammu",
  leh: "Leh",
  puducherry: "Pondicherry",
  port_blair: "Port Blair",
  amaravati: "Vijayawada",
  guwahati: "Guwahati",
  gangtok: "Gangtok",
};

const LOCALES = ["hi", "bn", "mr", "te", "ta", "gu", "ur", "kn", "or", "ml", "pa", "as"];

async function langlinksBatch(titles) {
  // Wikipedia accepts up to 50 titles per request. Returns a Map<title, {lang: name}>.
  const joined = titles.map(encodeURIComponent).join("%7C");
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&titles=${joined}&lllimit=500&format=json&redirects=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "crimeradar-bot/1.0 (one-shot build helper)" },
  });
  if (!res.ok) throw new Error(`batch: HTTP ${res.status}`);
  const j = await res.json();
  const pages = j.query?.pages ?? {};
  const redirects = j.query?.redirects ?? [];
  // Map redirected-from titles back to original (so we can look up by input)
  const redirectMap = {};
  for (const r of redirects) redirectMap[r.from] = r.to;

  const byTitle = {};
  for (const page of Object.values(pages)) {
    if (page.missing) continue;
    const out = {};
    for (const l of page.langlinks ?? []) {
      if (LOCALES.includes(l.lang)) out[l.lang] = l["*"];
    }
    byTitle[page.title] = out;
  }
  // Resolve each requested title (may go through a redirect)
  const result = {};
  for (const t of titles) {
    const resolved = redirectMap[t] ?? t;
    if (byTitle[resolved]) result[t] = byTitle[resolved];
  }
  return result;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  // Pick the cities that still need any langlinks.
  const todo = manifest.filter((c) => {
    const wiki = ID_TO_WIKI[c.id];
    if (!wiki) return false;
    const existing = c.nameI18n ?? {};
    return LOCALES.some((l) => !existing[l]);
  });
  if (todo.length === 0) {
    console.log("nothing to do — every city has all 12 locales");
    return;
  }
  console.log(`fetching for ${todo.length} city(ies)`);
  const titles = todo.map((c) => ID_TO_WIKI[c.id]);
  // Batch into groups of 5 — Wikipedia caps langlinks at 500 per request
  // total across pages, and each Indian city page has ~80-100 langlinks,
  // so anything beyond ~5 per batch silently drops the tail.
  let touched = 0;
  for (let i = 0; i < titles.length; i += 5) {
    const batch = titles.slice(i, i + 5);
    const idsBatch = todo.slice(i, i + 5);
    let result;
    try {
      result = await langlinksBatch(batch);
    } catch (e) {
      console.log(`batch ${i / 5}: ${e.message}`);
      await sleep(5000);
      continue;
    }
    for (let j = 0; j < batch.length; j++) {
      const title = batch[j];
      const city = idsBatch[j];
      const fetched = result[title];
      if (!fetched) {
        console.log(`${city.id} (${title}): no langlinks`);
        continue;
      }
      const existing = city.nameI18n ?? {};
      const merged = { ...existing };
      let added = 0;
      for (const l of LOCALES) {
        if (fetched[l] && !merged[l]) {
          merged[l] = fetched[l];
          added++;
        }
      }
      if (added > 0) {
        city.nameI18n = merged;
        touched++;
        console.log(`${city.id}: +${added} (now ${Object.keys(merged).length}/${LOCALES.length})`);
      }
    }
    await sleep(2000);
  }
  if (touched > 0) {
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`\nwrote nameI18n for ${touched} city(ies) → data/cities.manifest.json`);
  } else {
    console.log("\nno changes");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
