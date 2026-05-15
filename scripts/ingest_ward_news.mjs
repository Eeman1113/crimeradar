#!/usr/bin/env node
// Scrapes Google News RSS per ward and writes
// data/cities/<city>/ward_news.json with recent crime-relevant headlines.
//
// One feed per ward, query built from the ward's most distinctive
// neighbourhood name + the city name + crime keywords. We filter results to
// items where the title actually mentions a crime word, deduplicate by URL,
// keep the most recent 4 per ward, and skip any item older than 18 months.
//
// Usage:
//   node scripts/ingest_ward_news.mjs                # all 6 cities
//   node scripts/ingest_ward_news.mjs mumbai         # one city
//
// Notes:
// - Google News RSS is publicly accessible. We sleep 700ms between requests.
// - This is a heavy run for the bigger cities (Delhi has 290 wards).
// - Subsequent runs are incremental: a ward isn't re-fetched if its cached
//   entry is < 6 days old, unless the FORCE env var is set.

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

const CRIME_TERMS = [
  "crime",
  "arrest",
  "snatch",
  "rape",
  "robbery",
  "robbed",
  "harass",
  "molest",
  "murder",
  "theft",
  "stolen",
  "stabb",
  "kidnap",
  "assault",
  "raid",
  "fir",
  "police",
  "absconding",
  "loot",
  "extort",
  "trafficking",
  "abduct",
  "constable",
  "violence",
];

const CRIME_RE = new RegExp(`\\b(${CRIME_TERMS.join("|")})`, "i");

const CITY_NAME = {
  mumbai: "Mumbai",
  bangalore: "Bengaluru",
  delhi: "Delhi",
  chennai: "Chennai",
  hyderabad: "Hyderabad",
  kolkata: "Kolkata",
  pune: "Pune",
  gurugram: "Gurugram",
  noida: "Noida",
};

// Pull the first distinctive token out of the ward's neighbourhood string.
// For Mumbai (hand-seeded with real names) this picks e.g. "Govandi".
// For auto-generated cities (Bangalore/Delhi/etc) we fall back to the
// ward name itself, stripping generic "Ward" suffixes.
function queryFor(city, ward) {
  const cityName = CITY_NAME[city];
  const raw = ward.neighborhoods || ward.name || ward.id;
  let first = raw
    .split(",")[0]
    // strip "Ward 91 Khairatabad" -> "Khairatabad"
    .replace(/\bWard\s+\d+\s*/i, "")
    .replace(/\bWard\b/i, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // strip generic suffixes like "Layout" / "Nagar" when they appear alone
  if (!first || first.length < 3) {
    // fall back to the ward name itself if neighborhoods didn't help
    first = (ward.name || ward.id || "").replace(/\bWard\s+\d+\s*/i, "").trim();
  }
  if (!first || first.length < 3) return null;
  return `"${first}" ${cityName} (crime OR arrest OR snatch OR rape OR molest OR raid)`;
}

function curlGet(url) {
  const r = spawnSync(
    "curl",
    ["-sSL", "-A", UA, "--max-time", "30", url],
    { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
  );
  if (r.status !== 0) {
    throw new Error(`curl ${url} exit ${r.status}: ${r.stderr.slice(0, 200)}`);
  }
  return r.stdout;
}

function decodeCdata(s) {
  if (!s) return "";
  return String(s).replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function parseFeed(xml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
  });
  let doc;
  try {
    doc = parser.parse(xml);
  } catch {
    return [];
  }
  const channel = doc?.rss?.channel;
  if (!channel) return [];
  const items = Array.isArray(channel.item)
    ? channel.item
    : channel.item
      ? [channel.item]
      : [];
  return items
    .map((it) => {
      const title = decodeCdata(
        typeof it.title === "object" ? (it.title.__cdata ?? "") : it.title,
      );
      const link = decodeCdata(
        typeof it.link === "object" ? (it.link.__cdata ?? "") : it.link,
      );
      const dateStr = decodeCdata(it.pubDate);
      const ts = dateStr ? new Date(dateStr).getTime() : NaN;
      const source = decodeCdata(
        typeof it.source === "object"
          ? (it.source.__cdata ?? it.source["#text"] ?? "")
          : it.source,
      );
      return {
        title: title.replace(/\s*-\s*[^-]+$/, "").trim(), // strip trailing "- Source"
        rawTitle: title,
        link,
        date: Number.isFinite(ts) ? new Date(ts).toISOString() : null,
        source,
      };
    })
    .filter((x) => x.title && x.link);
}

async function loadExisting(dest) {
  try {
    const buf = await fs.readFile(dest, "utf8");
    return JSON.parse(buf);
  } catch {
    return { scrapedAt: null, wards: {} };
  }
}

const SLEEP_MS = 700;
const MAX_AGE_MS = 180 * 86_400_000; // 18 months
const FRESH_AGE_MS = 6 * 86_400_000; // re-use cached ward < 6 days old
const MAX_ITEMS = 4;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ingestCity(city) {
  // Load this city's seed dynamically.
  const seedModulePath = `../data/cities/${city}/wards-raw.ts`;
  const seedAbs = path.resolve("data/cities", city, "wards-raw.ts");
  // We're a plain Node script — read the file and pull out the array literal.
  // Cheaper than spinning up tsx: just import the JSON-y data via dynamic eval.
  const raw = await fs.readFile(seedAbs, "utf8");
  const match = raw.match(/export const WARDS_SEED:[^=]*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    console.warn(`  ! could not parse WARDS_SEED for ${city}`);
    return;
  }
  // Strip the type annotations and trailing commas. The literal itself is
  // JSON-ish; we use Function rather than eval to scope it.
  let body = match[1];
  // remove trailing commas inside objects/arrays (TS-only)
  body = body.replace(/,(\s*[}\]])/g, "$1");
  let wards;
  try {
    wards = new Function(`return ${body};`)();
  } catch (e) {
    console.warn(`  ! eval failed for ${city}: ${e.message}`);
    return;
  }
  void seedModulePath;
  console.log(`${city}: ${wards.length} wards`);

  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    city,
    "ward_news.json",
  );
  const existing = await loadExisting(dest);
  const force = !!process.env.FORCE;
  const now = Date.now();

  let fetched = 0;
  let cached = 0;
  let skipped = 0;
  const out = {};

  for (const ward of wards) {
    const cachedEntry = existing.wards?.[ward.id];
    const ageMs = cachedEntry?.cachedAt
      ? now - new Date(cachedEntry.cachedAt).getTime()
      : Infinity;
    if (!force && cachedEntry && ageMs < FRESH_AGE_MS) {
      out[ward.id] = cachedEntry;
      cached++;
      continue;
    }
    const q = queryFor(city, ward);
    if (!q) {
      skipped++;
      continue;
    }
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
    try {
      const xml = curlGet(url);
      const items = parseFeed(xml)
        .filter(
          (it) =>
            it.date &&
            now - new Date(it.date).getTime() < MAX_AGE_MS &&
            CRIME_RE.test(it.title),
        )
        .reduce((acc, it) => {
          if (acc.find((x) => x.link === it.link)) return acc;
          acc.push(it);
          return acc;
        }, [])
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, MAX_ITEMS)
        .map(({ title, link, date, source }) => ({
          title,
          link,
          date,
          source,
        }));
      out[ward.id] = {
        cachedAt: new Date(now).toISOString(),
        query: q,
        items,
      };
      fetched++;
      if (fetched % 20 === 0) {
        console.log(`  · ${fetched} fetched / ${wards.length} total`);
      }
    } catch (e) {
      console.warn(
        `  ! ${ward.id}: ${(e instanceof Error ? e.message : e).slice(0, 100)}`,
      );
      // always record SOMETHING so the file holds an entry per seed ward —
      // either the stale cache, or an empty entry that next run can retry.
      out[ward.id] = cachedEntry ?? {
        cachedAt: new Date(now).toISOString(),
        query: q,
        items: [],
        error: String(e?.message ?? e).slice(0, 120),
      };
    }
    await sleep(SLEEP_MS);
  }

  const file = {
    source: "https://news.google.com/rss/search",
    scrapedAt: new Date().toISOString(),
    wards: out,
    notes: `Per-ward crime-related news from Google News RSS. Queried per the ward's distinctive neighbourhood name + ${CITY_NAME[city]} + crime keywords. Items are filtered to last 18 months and to titles containing at least one crime/police/arrest term. Up to ${MAX_ITEMS} per ward.`,
  };
  await fs.writeFile(dest, JSON.stringify(file, null, 2));
  console.log(
    `  → ${dest} (fetched=${fetched}, cached=${cached}, skipped=${skipped})`,
  );
}

async function main() {
  const arg = process.argv[2];
  const cities = arg ? [arg] : Object.keys(CITY_NAME);
  for (const c of cities) {
    if (!CITY_NAME[c]) {
      console.error(`unknown city: ${c}`);
      continue;
    }
    await ingestCity(c);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
