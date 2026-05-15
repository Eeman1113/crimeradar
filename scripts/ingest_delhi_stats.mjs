#!/usr/bin/env node
// Extracts Delhi annual crime statistics from the "Crime In Delhi" PDF
// published at delhipolice.gov.in/statistics. The PDF is a wide table of
// 2011-2022 annual totals per crime head; we pull the latest FULL year
// (2021) and write data/cities/delhi/monthly_stats.json.
//
// This is a one-shot snapshot — Delhi Police hasn't refreshed this PDF
// since 2022. Re-runs are idempotent and pick up whatever is current on
// the source URL.
//
// Run: node scripts/ingest_delhi_stats.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const SOURCE_URL =
  "https://delhipolice.gov.in/Images/HTMLfiles/Crime%20In%20Delhi(2).pdf";
const UA = "CrimeRadarBot/0.1 contact: legal@crimeradar.example";

// Each PDF row: <LABEL> <2011> <2012> ... <2021> <2022-partial> <2021-partial>
// 13 numbers per row. We use index 10 = 2021 (latest full year).
const YEAR_INDEX = 10;
const REPORTED_YEAR = 2021;

// Map Delhi Police crime heads to our internal taxonomy. Multi-head categories
// (e.g. theft = snatching + mv + other) sum across rows.
const ROW_MAP = [
  { needle: "DACOITY", cat: "robbery" },
  { needle: "MURDER", cat: "assault", excluding: ["ATT"] },
  { needle: "ATT. TO MURDER", cat: "assault" },
  { needle: "ROBBERY", cat: "robbery" },
  { needle: "RIOT", cat: "other" },
  { needle: "KID. FOR RANSOM", cat: "kidnapping" },
  { needle: "RAPE", cat: "sexual_offence" },
  { needle: "SNATCHING", cat: "theft" },
  { needle: "HURT", cat: "assault" },
  { needle: "BURGLARY", cat: "burglary" },
  { needle: "M.V.THEFT", cat: "theft" },
  { needle: "HOUSE THEFT", cat: "burglary" }, // closer to burglary than to theft
  { needle: "OTHER THEFT", cat: "theft" },
  { needle: "M. O. WOMEN", cat: "harassment" },
  { needle: "OTHER KID./ABD", cat: "kidnapping" },
  { needle: "OTHER IPC", cat: "other" },
];

async function fetchPdf(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function extractTotals(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const totals = {};

  for (const { needle, cat, excluding } of ROW_MAP) {
    const matched = lines.find((l) => {
      if (!l.toUpperCase().includes(needle)) return false;
      if (excluding && excluding.some((e) => l.toUpperCase().includes(e + ".")))
        return false;
      return true;
    });
    if (!matched) continue;
    // strip the label, take all numbers from the rest
    const after = matched.slice(matched.toUpperCase().indexOf(needle) + needle.length);
    const nums = (after.match(/\d+/g) ?? []).map(Number);
    if (nums.length <= YEAR_INDEX) continue;
    const v = nums[YEAR_INDEX];
    if (!Number.isFinite(v) || v < 0 || v > 1_000_000) continue;
    totals[cat] = (totals[cat] ?? 0) + v;
  }
  return totals;
}

async function main() {
  const pdfBytes = await fetchPdf(SOURCE_URL);
  const parser = new PDFParse({ data: pdfBytes });
  const result = await parser.getText();
  const text =
    result.text ?? (result.pages || []).map((p) => p.text || "").join("\n");
  const totals = extractTotals(text);
  if (Object.keys(totals).length < 4) {
    throw new Error(
      `Parser only extracted ${Object.keys(totals).length} categories — schema may have shifted.`,
    );
  }

  const out = {
    source: SOURCE_URL,
    indexUrl: "https://delhipolice.gov.in/statistics",
    publishedFor: { year: REPORTED_YEAR },
    windowKind: "year",
    scrapedAt: new Date().toISOString(),
    cityWideYtdTotals: totals,
    notes: `Annual ${REPORTED_YEAR} totals for Delhi (the latest full year in delhipolice.gov.in/statistics, which has not been refreshed since 2022). Categories mapped to our internal taxonomy: theft = Snatching + MV Theft + Other Theft; assault = Murder + Att.Murder + Hurt; burglary = Burglary + House Theft; kidnapping = Kidnapping for Ransom + Other Kid./Abd; harassment = Molestation of Women; sexual_offence = Rape; robbery = Robbery + Dacoity; other = Riot + Other IPC.`,
  };

  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    "delhi",
    "monthly_stats.json",
  );
  await fs.writeFile(dest, JSON.stringify(out, null, 2));
  console.log("delhi totals:", totals);
  console.log(`wrote → ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
