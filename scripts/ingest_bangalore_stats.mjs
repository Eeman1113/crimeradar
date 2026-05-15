#!/usr/bin/env node
// Pulls the "Bengaluru city" column from the most-recent KSP Monthly Crime
// Review PDF (district-wise table on printed page 18). Writes to
// data/cities/bangalore/monthly_stats.json.
//
// The PDF's index page lists every monthly review; we find the newest URL,
// fetch the PDF, and extract the district-wise table — which is the only
// place Bengaluru-specific (not state-wide) numbers appear.
//
// Sources:
//   https://ksp.karnataka.gov.in/new-page/Monthly%20Crime%20Review/en
//   https://ksp.karnataka.gov.in/storage/pdf-files/<NAME>.pdf
//
// Run: node scripts/ingest_bangalore_stats.mjs

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const INDEX_URL =
  "https://ksp.karnataka.gov.in/new-page/Monthly%20Crime%20Review/en";
const UA = "CrimeRadarBot/0.1 contact: legal@crimeradar.example";

// District order in the table header on the PDF's district-wise page. The
// header column for Bengaluru city is index 4 (Bagalkot, Ballari, Belagavi
// City, Belagavi Dist, Bengaluru city, …).
const BENGALURU_CITY_IDX = 4;

// Map (sl no / crime head) → our taxonomy bucket. We pin each row to its
// printed sr.no. so "5a SNATCHING" doesn't also collide with "3a CHAIN
// SNATCHING", and "16 Motor vehicles" / "5 THEFT" don't overlap.
const CATEGORY_MAP = [
  { sr: "1", row: "MURDER", cat: "assault" },
  { sr: "2", row: "DACOITY", cat: "robbery" },
  { sr: "3", row: "ROBBERY", cat: "robbery" },
  { sr: "3a", row: "CHAIN SNATCHING", cat: "theft" },
  { sr: "4a", row: "BURGLARY - DAY", cat: "burglary" },
  { sr: "4b", row: "BURGLARY - NIGHT", cat: "burglary" },
  { sr: "5", row: "THEFT", cat: "theft" },
  { sr: "5a", row: "SNATCHING", cat: "theft" },
  { sr: "6", row: "RIOTS", cat: "other" },
  { sr: "7", row: "CASES OF HURT", cat: "assault" },
  { sr: "8", row: "Spl & Local laws", cat: "other" },
  { sr: "9a", row: "RAPE", cat: "sexual_offence" },
  { sr: "9b", row: "DOWRY DEATHS", cat: "assault" },
  { sr: "10", row: "POCSO", cat: "sexual_offence" },
  { sr: "11", row: "SC ST & POA Act", cat: "other" },
  { sr: "16", row: "Motor vehicles", cat: "theft" },
  { sr: "17", row: "NDPS Cases", cat: "other" },
];

// Marathi/Kannada months not needed; KSP uses English month names in URLs.
const MR_MONTHS = {
  JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6,
  JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
};

function curlGet(url, binary = false) {
  const args = ["-sSL", "-A", UA, "--max-time", "120", url];
  const r = spawnSync("curl", args, {
    encoding: binary ? "buffer" : "utf8",
    maxBuffer: 150 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(
      `curl ${url} -> exit ${r.status}: ${
        binary ? "(binary)" : (r.stderr || "").slice(0, 200)
      }`,
    );
  }
  return r.stdout;
}

function findLatestPdf(html) {
  // gather all (month, year, url) triples from the index page, return newest
  const links = [
    ...html.matchAll(
      /href="(https:\/\/ksp\.karnataka\.gov\.in\/storage\/pdf-files\/[^"]+\.pdf)"/g,
    ),
  ].map((m) => m[1]);
  const dated = [];
  for (const url of links) {
    const decoded = decodeURIComponent(url);
    const m = decoded.match(/CRIME REVIEW[^A-Z]*([A-Z]+)[^0-9]+(\d{4})/);
    if (!m) continue;
    const month = MR_MONTHS[m[1].toUpperCase()];
    const year = parseInt(m[2], 10);
    if (!month || !year) continue;
    dated.push({ url, month, year, key: year * 12 + month });
  }
  dated.sort((a, b) => b.key - a.key);
  return dated[0] ?? null;
}

// Parse the district-wise table. The page reads:
//   <header rows: district names, vertical-ish>
//   <row idx> <CRIME HEAD WORDS> <num> <num> ... <num> <total>
// 38 districts + Total = 39 numbers per data row.
//
// Our strategy: identify data rows by looking for "<digit(s)> WORD WORD ... <39+ numbers>",
// then take the 5th number (index 4 = Bengaluru city).
function extractFromDistrictTable(pageText) {
  const rawLines = pageText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // For each row anchor, look for the label on any line and concatenate
  // following lines until we have ≥ 39 numeric tokens (38 districts + total).
  // This handles labels that wrap (e.g. "9a RAPE (Sec.376,\n376(A) to 376 (D) ...")
  // and rows where the numbers themselves overflow to another line.
  const out = {};
  for (const { sr, row, cat } of CATEGORY_MAP) {
    const labelRe = new RegExp(
      `^${sr.replace(/[.]/g, "\\.")}\\s+${row.replace(
        /[()*+?.|[\]\\]/g,
        (c) => "\\" + c,
      )}\\b`,
      "i",
    );
    for (let i = 0; i < rawLines.length; i++) {
      if (!labelRe.test(rawLines[i])) continue;
      // Build a window of up to 3 lines starting at this label, stop early
      // when we have enough numbers.
      let window = rawLines[i];
      // strip "<sr> <row label>" prefix from the matched line; what remains is
      // a mix of either the data block or a section-ref continuation
      let afterLabel = rawLines[i].replace(labelRe, "").trim();
      // strip noise that pollutes the number stream: parenthetical section
      // refs (Sec.376), bare section refs like "376(A) to 376 (D)", "Sec. 64"
      const cleanNums = (s) => {
        let c = s.replace(/\([^)]*\)/g, " ");
        c = c.replace(/Sec\.?\s+\d[\d., ]*/gi, " ");
        // "376(A) to 376 (D)" leftovers — anything like "<digits>(<letter>)"
        c = c.replace(/\d+\([^)]*\)/g, " ");
        // standalone "u/s 376" or "376/511" section pairs at the start
        c = c.replace(/^\s*(?:\d{2,4}(?:\/\d{1,4})*\s+)+(?=\D|0\b)/, " ");
        return (c.match(/\d+/g) ?? []).map(Number);
      };
      let nums = cleanNums(afterLabel);
      let k = 1;
      while (nums.length < 39 && k < 4 && i + k < rawLines.length) {
        afterLabel += " " + rawLines[i + k];
        nums = cleanNums(afterLabel);
        k++;
      }
      // The table layout is "38 districts + state total" = 39 trailing numbers.
      // Some labels wrap and pull in leading IPC section refs (e.g. "376") that
      // we can't easily strip; counting backward from the state-total is more
      // robust.
      if (nums.length < 39) continue;
      const v = nums[nums.length - 39 + BENGALURU_CITY_IDX];
      if (!Number.isFinite(v) || v < 0 || v > 100000) continue;
      out[cat] = (out[cat] ?? 0) + v;
      void window;
      break; // first hit wins for this row
    }
  }
  return out;
}

async function main() {
  const indexHtml = curlGet(INDEX_URL);
  const latest = findLatestPdf(indexHtml);
  if (!latest) throw new Error("no monthly review PDFs found on KSP index");
  console.log(
    `latest: ${latest.url}  (${latest.month}/${latest.year})`,
  );
  const pdfBytes = curlGet(latest.url, true);
  const parser = new PDFParse({ data: pdfBytes });
  const result = await parser.getText();
  const pages = result.pages || [];

  // Locate the actual district-wise table page (not the table-of-contents
  // page that just mentions it). A real data page must contain "Bengaluru
  // city" AND a "MURDER" row.
  let target = null;
  for (let i = 0; i < pages.length; i++) {
    const t = pages[i].text || "";
    if (
      /Bengaluru city/i.test(t) &&
      /MURDER/i.test(t) &&
      /DISTRICT-WISE REPORTED CASES/i.test(t)
    ) {
      target = t;
      console.log(`district-wise table on pdf page ${i + 1}`);
      break;
    }
  }
  if (!target) throw new Error("district-wise table data page not found");

  const totals = extractFromDistrictTable(target);
  const out = {
    source: latest.url,
    indexUrl: INDEX_URL,
    publishedFor: { year: latest.year, month: latest.month },
    scrapedAt: new Date().toISOString(),
    cityWideYtdTotals: totals,
    notes:
      "Single-month (not year-to-date) counts for Bengaluru city, extracted from the district-wise summary table of the most-recent KSP Monthly Crime Review. Category mapping: theft = Theft + Snatching + Chain Snatching + MV Theft; assault = Hurt + Murder + Dowry Deaths; robbery = Robbery + Dacoity; burglary = Day + Night; sexual_offence = Rape + POCSO; harassment and kidnapping rows are not present in this district table (KSP publishes those only state-wide) so they remain blank.",
  };

  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    "bangalore",
    "monthly_stats.json",
  );
  await fs.writeFile(dest, JSON.stringify(out, null, 2));
  console.log("bangalore totals:", totals);
  console.log(`wrote → ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
