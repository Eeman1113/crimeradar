#!/usr/bin/env node
// Pulls the Chennai row from Tamil Nadu Police 2023 crime CSVs hosted by
// OpenCity and writes data/cities/chennai/monthly_stats.json (annual
// snapshot, not monthly — Chennai data is annual).
//
// Sources:
//   https://data.opencity.in/dataset/tamil-nadu-crime-data-2023
//   tn_2023_ipc_sll_2021_23_totals.csv         — district totals
//   tn_2023_crimes_against_women.csv            — per-district CAW breakdown
//   tn_2023_muder_homicide_negligence.csv       — per-district murder breakdown
//
// Run: node scripts/ingest_chennai_stats.mjs

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const UA = "CrimeRadarBot/0.1 contact: legal@crimeradar.example";

const TOTALS_CSV =
  "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/899d2a98-20fc-4627-b202-a04a5aef387e/download/tn_2023_ipc_sll_2021_23_totals.csv";
const CAW_CSV =
  "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/65ec76d5-44dc-4b69-ade3-95c2f9b4b813/download/tn_2023_crimes_against_women.csv";
const MURDER_CSV =
  "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/155446ea-d156-4738-908c-30b1bba80234/download/tn_2023_muder_homicide_negligence.csv";

function curlGet(url) {
  const r = spawnSync("curl", ["-sSL", "-A", UA, "--max-time", "30", url], {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(`curl ${url} -> ${r.stderr}`);
  return r.stdout;
}

function parseCsv(text) {
  // very small CSV parser that handles double-quoted fields with embedded
  // commas / newlines. Good enough for these well-formed files.
  const rows = [];
  let cur = [""];
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur[cur.length - 1] += '"';
          i++;
        } else inQuote = false;
      } else cur[cur.length - 1] += c;
    } else {
      if (c === '"') inQuote = true;
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
  const n = Number((s ?? "").toString().replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function findRow(rows, districtName) {
  for (const r of rows) {
    const d = (r[1] ?? "").trim().toLowerCase();
    if (d === districtName.toLowerCase()) return r;
  }
  return null;
}

function indexOfHeader(rows, header) {
  return rows[0].findIndex((h) => h.trim() === header);
}

async function main() {
  const totalsText = curlGet(TOTALS_CSV);
  const cawText = curlGet(CAW_CSV);
  const murderText = curlGet(MURDER_CSV);

  const totals = parseCsv(totalsText);
  const caw = parseCsv(cawText);
  const murder = parseCsv(murderText);

  const tRow = findRow(totals, "Chennai");
  const cRow = findRow(caw, "Chennai");
  const mRow = findRow(murder, "Chennai");
  if (!tRow || !cRow) throw new Error("Chennai row missing from a CSV");

  // totals CSV: pull IPC 2023 + SLL 2023 + Total 2023
  const ipcIdx = indexOfHeader(totals, "IPC 2023");
  const sllIdx = indexOfHeader(totals, "SLL 2023");
  const totalIPC = num(tRow[ipcIdx]);
  const totalSLL = num(tRow[sllIdx]);

  // crimes-against-women CSV — pull incidents (I) columns we care about
  const idx = (h) => indexOfHeader(caw, h);
  const womenAssault = num(cRow[idx("Assault on Women - I")]);
  const outragingModesty = num(
    cRow[idx("Assault on Women with Intent to Outrage her Modesty - Incidents (I)")],
  );
  const sexHarass = num(cRow[idx("Sexual Harrassment Total - I")]);
  const stalking = num(cRow[idx("Stalking - I")]);
  const rape = num(cRow[idx("Rape (Sec 376) - I")]);
  const attRape = num(cRow[idx("Attempt to Commit Rape (Sec.376/511) - I")]);

  // murder CSV — first column after district is "Murder - I"
  let murderCount = 0;
  if (mRow) {
    const mIdx = indexOfHeader(murder, "Murder - I");
    if (mIdx > 0) murderCount = num(mRow[mIdx]);
  }

  // Map to our taxonomy. Values that aren't in the CSV are left out — the
  // calibrate() step in lib/wards.ts falls back to seed for those.
  const totals_taxonomy = {
    assault: womenAssault + murderCount,
    sexual_offence: rape + attRape,
    harassment: outragingModesty + sexHarass + stalking,
    // theft / robbery / kidnapping / burglary / other not in this CSV;
    // we leave them out so calibrate() keeps the seed values (which are 0
    // because Chennai has no seed yet — meaning the page shows no per-ward
    // data, only the city-level numbers).
  };

  const out = {
    source: TOTALS_CSV,
    extraSources: [CAW_CSV, MURDER_CSV],
    indexUrl: "https://data.opencity.in/dataset/tamil-nadu-crime-data-2023",
    publishedFor: { year: 2023 },
    windowKind: "year",
    scrapedAt: new Date().toISOString(),
    cityWideYtdTotals: totals_taxonomy,
    cityTotals: {
      ipc_2023: totalIPC,
      sll_2023: totalSLL,
      total_2023: totalIPC + totalSLL,
    },
    notes:
      "Annual 2023 figures for Chennai district, pulled from OpenCity-hosted Tamil Nadu Police CSVs (no 2024/2025 published yet at scrape time). Categories mapped to CrimeRadar taxonomy: assault = Assault on Women + Murder; sexual_offence = Rape + Attempt; harassment = Outraging Modesty + Sexual Harassment + Stalking. Theft / robbery / kidnapping / burglary are not present in the women-crime CSV.",
  };

  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    "chennai",
    "monthly_stats.json",
  );
  await fs.writeFile(dest, JSON.stringify(out, null, 2));
  console.log("chennai totals:", totals_taxonomy);
  console.log(
    `IPC 2023: ${totalIPC}, SLL 2023: ${totalSLL}, total: ${totalIPC + totalSLL}`,
  );
  console.log(`wrote → ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
