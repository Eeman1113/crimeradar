#!/usr/bin/env node
// Ingests NCRB "Crime in India" megacity crime-head totals into
// data/cities/<id>/monthly_stats.json for every NCRB-19 megacity that
// is registered in data/cities.manifest.json.
//
// NCRB publishes Crime in India annually (latest 2022, released Dec 2023).
// Table "Crime in Mega Cities" covers 19 cities (population >1M, 2011
// census). The Excel format varies between releases — this script takes
// a CSV the user has exported from the official Excel, with the standard
// columns: "City", "Crime Head", "<year> Cases" (and optionally rate).
//
// Usage:
//   node scripts/ingest_ncrb.mjs --csv ncrb_megacities_2022.csv --year 2022
//
// Optional:
//   --source <url>     URL of the source Excel/PDF (recorded in each output)
//   --index-url <url>  NCRB landing page URL (default below)
//   --dry-run          parse + summarise, write nothing
//
// CSV expectations (case-insensitive header match):
//   Column "City"        — e.g. "Mumbai", "Delhi UT", "Bengaluru"
//   Column "Crime Head"  — e.g. "Theft", "Murder"
//   Column "Cases" / "Total Cases" / "Total" — incident count
//
// Cities are matched by name → manifest id via a hand-coded alias map.
// Unknown cities are skipped with a warning so future NCRB additions
// (e.g. if NCRB grows the list) don't crash the script.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = resolve(ROOT, "data/cities.manifest.json");
const DEFAULT_INDEX_URL = "https://www.ncrb.gov.in/crime-in-india.html";

// Cities skipped by default because they have a fresher city-specific
// monthly scraper (Mumbai/Bangalore monthly, Chennai/Delhi annual via
// state portals). Pass --include-fresh to override.
const SKIP_BY_DEFAULT = new Set(["mumbai", "bangalore", "chennai", "delhi"]);

// NCRB-spelling → manifest id. Updated when NCRB renames a city or we
// onboard another megacity.
const NCRB_NAME_TO_ID = {
  "ahmedabad": "ahmedabad",
  "bengaluru": "bangalore",
  "bangalore": "bangalore",
  "chennai": "chennai",
  "coimbatore": "coimbatore",
  "delhi": "delhi",
  "delhi ut": "delhi",
  "ghaziabad": "ghaziabad",
  "hyderabad": "hyderabad",
  "indore": "indore",
  "jaipur": "jaipur",
  "kanpur": "kanpur",
  "kochi": "kochi",
  "kolkata": "kolkata",
  "kozhikode": "kozhikode",
  "lucknow": "lucknow",
  "mumbai": "mumbai",
  "mumbai commr.": "mumbai",
  "nagpur": "nagpur",
  "patna": "patna",
  "pune": "pune",
  "surat": "surat",
};

// Map NCRB crime heads → CrimeRadar internal categories. Lowercased on
// lookup; matching is exact after lowercasing and stripping punctuation.
// When NCRB adds a head we don't recognise it falls through to "other"
// with a warning.
const HEAD_MAP = {
  "theft": "theft",
  "auto theft": "theft",
  "other theft": "theft",
  "burglary": "burglary",
  "house breaking": "burglary",
  "house-breaking": "burglary",
  "robbery": "robbery",
  "dacoity": "robbery",
  "preparation and assembly for dacoity": "robbery",
  "murder": "assault",
  "attempt to murder": "assault",
  "attempt to commit murder": "assault",
  "culpable homicide not amounting to murder": "assault",
  "riots": "assault",
  "acid attack": "assault",
  "attempt to acid attack": "assault",
  "grievous hurt": "assault",
  "rape": "sexual_offence",
  "attempt to commit rape": "sexual_offence",
  "assault on women with intent to outrage her modesty": "sexual_offence",
  "assault on women with intent to outrage modesty": "sexual_offence",
  "insult to modesty of women": "harassment",
  "insult to the modesty of women": "harassment",
  "sexual harassment": "harassment",
  "stalking": "harassment",
  "voyeurism": "harassment",
  "cruelty by husband or his relatives": "harassment",
  "kidnapping and abduction": "kidnapping",
  "kidnapping & abduction": "kidnapping",
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const k = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) args[k] = true;
    else {
      args[k] = next;
      i++;
    }
  }
  return args;
}

function parseCsv(text) {
  const rows = [];
  let cur = [""];
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; }
      else if (c === '"') q = false;
      else cur[cur.length - 1] += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") cur.push("");
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        if (cur.length > 1 || cur[0] !== "") rows.push(cur);
        cur = [""];
      } else cur[cur.length - 1] += c;
    }
  }
  if (cur.length > 1 || cur[0] !== "") rows.push(cur);
  return rows;
}

function num(s) {
  const n = Number((s ?? "").toString().replace(/[,\s]/g, "").replace(/-+$/, "0"));
  return Number.isFinite(n) ? n : 0;
}

function normHead(s) {
  return s.toLowerCase().replace(/[.,;:]/g, "").replace(/\s+/g, " ").trim();
}

function findColIndex(headers, candidates) {
  const norm = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const i = norm.indexOf(c.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
}

function loadManifestIds() {
  const m = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  return new Set(m.map((c) => c.id));
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.csv) {
    console.error("--csv <path> required (CSV exported from NCRB megacity table)");
    process.exit(1);
  }
  if (!args.year) {
    console.error("--year <YYYY> required");
    process.exit(1);
  }
  const year = Number(args.year);
  const sourceUrl = args.source ?? `https://www.ncrb.gov.in/crime-in-india-${year}`;
  const indexUrl = args["index-url"] ?? DEFAULT_INDEX_URL;
  const manifestIds = loadManifestIds();

  const csvPath = resolve(args.csv);
  if (!existsSync(csvPath)) throw new Error(`CSV not found: ${csvPath}`);
  const rows = parseCsv(readFileSync(csvPath, "utf8")).filter((r) => r.length > 1);
  if (rows.length < 2) throw new Error("CSV has no data rows");

  const headers = rows[0];
  const cityCol = findColIndex(headers, ["City", "Megacity", "Mega City"]);
  const headCol = findColIndex(headers, ["Crime Head", "Head", "Offence", "Offense"]);
  const casesCol = findColIndex(headers, ["Cases", "Total Cases", "Total", "Incidents", `${year}`, `Total ${year}`]);
  if (cityCol < 0 || headCol < 0 || casesCol < 0) {
    throw new Error(
      `expected CSV with columns: City, Crime Head, Cases (or year). Found headers: ${headers.join(" | ")}`,
    );
  }

  // city id → CrimeCategory → total
  const totals = new Map();
  const unmappedCities = new Set();
  const unmappedHeads = new Set();

  for (const r of rows.slice(1)) {
    const cityRaw = (r[cityCol] ?? "").trim().toLowerCase();
    const headRaw = normHead(r[headCol] ?? "");
    const cases = num(r[casesCol]);
    if (!cityRaw || !headRaw) continue;
    const cityId = NCRB_NAME_TO_ID[cityRaw];
    if (!cityId) {
      unmappedCities.add(cityRaw);
      continue;
    }
    if (!manifestIds.has(cityId)) {
      // City present in NCRB but not yet in our manifest — skip silently
      // (it'll get picked up once onboarded).
      continue;
    }
    if (SKIP_BY_DEFAULT.has(cityId) && !args["include-fresh"]) {
      continue;
    }
    let cat = HEAD_MAP[headRaw];
    if (!cat) {
      cat = "other";
      unmappedHeads.add(r[headCol]);
    }
    if (!totals.has(cityId)) totals.set(cityId, {});
    totals.get(cityId)[cat] = (totals.get(cityId)[cat] ?? 0) + cases;
  }

  if (unmappedCities.size) {
    console.warn(`skipped ${unmappedCities.size} NCRB city name(s) not in alias map:`, [...unmappedCities].join(", "));
  }
  if (unmappedHeads.size) {
    console.warn(`bucketed ${unmappedHeads.size} unrecognised head(s) into "other":`, [...unmappedHeads].slice(0, 10).join(", "));
  }

  const scrapedAt = new Date().toISOString();
  let wrote = 0;
  for (const [cityId, cats] of totals.entries()) {
    const out = {
      source: sourceUrl,
      indexUrl,
      publishedFor: { year },
      windowKind: "year",
      scrapedAt,
      cityWideYtdTotals: cats,
      notes: `Annual city-wide totals (${year}) extracted from NCRB 'Crime in India ${year}' megacity table. Categories normalised to CrimeRadar's internal taxonomy.`,
    };
    const path = join(ROOT, "data/cities", cityId, "monthly_stats.json");
    if (args["dry-run"]) {
      console.log(`[dry] ${cityId}:`, cats);
    } else {
      writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
      console.log(`wrote ${cityId} (${Object.keys(cats).length} cats)`);
      wrote++;
    }
  }
  if (!args["dry-run"]) {
    console.log(`ingest_ncrb: wrote ${wrote} file(s)`);
  }
}

main();
