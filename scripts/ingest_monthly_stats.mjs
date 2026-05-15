#!/usr/bin/env node
// Fetches the most recent Mumbai Police monthly crime stats PDF, parses it,
// extracts city-aggregate YTD counts per crime category, maps them to our
// internal taxonomy, and writes data/cities/mumbai/monthly_stats.json.
//
// Source: https://mumbaipolice.gov.in/CrimeStatistics
// Run:    node scripts/ingest_monthly_stats.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const INDEX_URL = "https://mumbaipolice.gov.in/CrimeStatistics";
const UA = "CrimeRadarBot/0.1 contact: legal@crimeradar.example";

// Marathi month names → 1..12 (used to label the snapshot)
const MR_MONTHS = {
  जानेवारी: 1, फेब्रुवारी: 2, मार्च: 3, एप्रिल: 4,
  मे: 5, जून: 6, जुलै: 7, ऑगस्ट: 8,
  सप्टेंबर: 9, ऑक्टोबर: 10, नोव्हेंबर: 11, डिसेंबर: 12,
};

// Maps Mumbai Police IPC table row labels → our internal categories.
// Keys are substrings; matching is case-insensitive and whitespace-tolerant.
const IPC_CATEGORY_MAP = [
  ["murder", "assault"],
  ["att.to.c.murder", "assault"],
  ["dacoity", "robbery"],
  ["prep.for dacoity", "robbery"],
  ["robbery chain snatching", "theft"],
  ["att.to.c.robbery", "robbery"],
  ["robbery", "robbery"], // last so the more-specific rows above win
  ["extortion", "other"],
  ["h.b.t.day", "burglary"],
  ["h.b.t.night", "burglary"],
  ["m.v.thefts", "theft"],
  ["thefts.", "theft"],
  ["snatching", "theft"],
  ["hurt", "assault"],
  ["riots.", "other"],
  ["rape", "sexual_offence"],
  ["sexual offences", "sexual_offence"],
  ["molestation", "harassment"],
  ["other i.p.c.", "other"],
];

function classify(label) {
  const norm = label.toLowerCase().trim();
  for (const [needle, cat] of IPC_CATEGORY_MAP) {
    if (norm.includes(needle)) return cat;
  }
  return null;
}

async function fetchIndex() {
  const res = await fetch(INDEX_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fetch ${INDEX_URL} -> ${res.status}`);
  return res.text();
}

function parseIndex(html) {
  // pull table rows with a label and a Cstat/<id>.pdf link
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = trRe.exec(html))) {
    const link = m[1].match(/href="(https:\/\/mumbaipolice\.gov\.in\/files\/Cstat\/(\d+)\.pdf)"/);
    if (!link) continue;
    const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
      c[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
    );
    const label = cells.find((c) => /माहे/.test(c)) ?? "";
    rows.push({ pdfId: link[2], pdfUrl: link[1], label });
  }
  return rows;
}

function labelToYearMonth(label) {
  const m = label.match(/([ऀ-ॿ]+)[ ,]+(\d{4}|[०-९]{4})/);
  if (!m) return null;
  const monthName = m[1].trim();
  let yearText = m[2];
  if (/[०-९]/.test(yearText)) {
    yearText = yearText.replace(/[०-९]/g, (d) =>
      String("०१२३४५६७८९".indexOf(d)),
    );
  }
  const month = MR_MONTHS[monthName];
  if (!month) return null;
  return { year: parseInt(yearText, 10), month };
}

async function fetchPdf(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

// Pull YTD (current-year-to-date REGISTERED) per IPC row.
// Strategy: per line, find a category anchor substring, then in the text AFTER
// the anchor, pull the run of numeric tokens. Column layout (after sr.no. and
// label) is: [CM-R CM-D PM-R PM-D YTD-R YTD-D pctDet prevY-R prevY-D pctDet
//             sign diff]. YTD-R is index 4 in that number list.
//
// We also pull the "Total Rape Cases" and "Total Kidnapping Cases" rows from
// the second (crime-against-women) table so kidnapping is counted even though
// it doesn't appear in the IPC head table directly.
const ANCHOR_MAP = [
  // most-specific first
  { needle: "robbery chain snatching", cat: "theft" },
  { needle: "att.to.c.murder", cat: "assault" },
  { needle: "att.to.c.robbery", cat: "robbery" },
  { needle: "prep.for dacoity", cat: "robbery" },
  { needle: "m.v.thefts", cat: "theft" },
  { needle: "h.b.t.day", cat: "burglary" },
  { needle: "h.b.t.night", cat: "burglary" },
  { needle: "total rape cases", cat: "sexual_offence" },
  { needle: "total kidnapping cases", cat: "kidnapping" },
  { needle: "outraging modesty", cat: "harassment" },
  { needle: "intended insult to modesty", cat: "harassment" },
  { needle: "sexual offences", cat: "sexual_offence" },
  { needle: "molestation", cat: "harassment" },
  // generic last
  { needle: "murder", cat: "assault" },
  { needle: "dacoity", cat: "robbery" },
  { needle: "robbery", cat: "robbery" },
  { needle: "extortion", cat: "other" },
  { needle: "thefts.", cat: "theft" },
  { needle: "snatching", cat: "theft" },
  { needle: "hurt", cat: "assault" },
  { needle: "riots", cat: "other" },
  { needle: "rape", cat: "sexual_offence" },
  { needle: "other i.p.c", cat: "other" },
];

const PREFER_TOTAL = new Set(["sexual_offence", "kidnapping"]);

function dataNumbers(line) {
  // strip parentheticals and IPC section refs so they don't pollute the
  // numeric sequence; what remains is the actual data block.
  let cleaned = line.replace(/\([^)]*\)/g, " ");
  // also strip any "/74 , 75, 76, 77, 78 BNS)" trailing fragments left after
  // wrapped parens are joined back together — they look like "[/]?\dd?, ..."
  cleaned = cleaned.replace(/u\/s\s+\d[\d., ]*/gi, " ");
  cleaned = cleaned.replace(/Sec\.?\s+\d[\d., ]*/gi, " ");
  return (cleaned.match(/\d+/g) ?? []).map(Number);
}

function readBlockFromText(text, fromIdx) {
  // From `fromIdx`, walk forward gathering numeric tokens (with parens and
  // section refs stripped) until we have 11 numbers — that's the YTD row.
  // Stop if we run into the next row-start (a "N Label" sr.no. signature)
  // after the first 100 chars so we don't bleed into the next entry.
  const window = text.slice(fromIdx, fromIdx + 400);
  let cleaned = window.replace(/\([^)]*\)/g, " ");
  cleaned = cleaned.replace(/u\/s\s+\d[\d., ]*/gi, " ");
  cleaned = cleaned.replace(/Sec\.?\s+\d[\d., ]*/gi, " ");
  return (cleaned.match(/\d+/g) ?? []).map(Number);
}

function extractIpcTotals(text) {
  const lc = text.toLowerCase();
  const totals = {};
  const matched = new Set();
  // track byte positions already attributed to a row so we don't pull the
  // same physical row in via two different anchors.
  const used = [];
  const isUsed = (pos) => used.some((u) => Math.abs(u - pos) < 30);

  for (const anchor of ANCHOR_MAP) {
    let from = 0;
    while (from < lc.length) {
      const idx = lc.indexOf(anchor.needle, from);
      if (idx < 0) break;
      from = idx + anchor.needle.length;
      if (isUsed(idx)) continue;

      const ctxLine = text
        .slice(Math.max(0, idx - 30), idx + 300)
        .toLowerCase();
      if (/with pocso/.test(ctxLine)) continue;
      if (
        anchor.needle === "murder" &&
        /(dowry|other reasons|love affair|illicit)/.test(ctxLine)
      )
        continue;
      // The IPC table's "Molestation" row is the same crime as the
      // women-table's "Outraging Modesty"; skip it to avoid double-count.
      if (anchor.needle === "molestation") continue;

      const block = readBlockFromText(text, idx);
      if (block.length < 5) continue;
      // We started scanning AT the anchor (label stripped) so the first
      // number is CM-R and YTD-R is block[4] for both sr.no.'d and
      // sub-total rows.
      const ytd = block[4];
      if (!Number.isFinite(ytd) || ytd < 0 || ytd > 1_000_000) continue;

      used.push(idx);

      if (PREFER_TOTAL.has(anchor.cat)) {
        if (anchor.needle.startsWith("total ")) {
          totals[anchor.cat] = ytd;
          matched.add(anchor.cat + ":total");
        } else if (!matched.has(anchor.cat + ":total")) {
          totals[anchor.cat] = totals[anchor.cat] ?? ytd;
        }
      } else {
        const key = anchor.cat + ":" + anchor.needle;
        if (matched.has(key)) continue;
        matched.add(key);
        totals[anchor.cat] = (totals[anchor.cat] ?? 0) + ytd;
      }
      // each anchor only fires once across the doc — the most-specific
      // instance wins (we walk top-to-bottom and ANCHOR_MAP is most-specific
      // first via the `used[]` guard on overlapping positions).
      break;
    }
  }
  return totals;
}

async function main() {
  const html = await fetchIndex();
  const idx = parseIndex(html);
  if (idx.length === 0) throw new Error("no monthly stats PDFs found");
  // pick the highest pdfId (newest)
  idx.sort((a, b) => Number(b.pdfId) - Number(a.pdfId));
  const latest = idx[0];
  const ym = labelToYearMonth(latest.label) ?? null;
  console.log(`latest stats PDF: #${latest.pdfId}  ${latest.label}`);

  const pdfBytes = await fetchPdf(latest.pdfUrl);
  const parser = new PDFParse({ data: pdfBytes });
  const result = await parser.getText();
  const text = result.text ?? (result.pages || []).map((p) => p.text || "").join("\n");
  const totals = extractIpcTotals(text);

  const out = {
    source: latest.pdfUrl,
    indexUrl: INDEX_URL,
    publishedFor: ym, // { year, month } if parseable
    scrapedAt: new Date().toISOString(),
    cityWideYtdTotals: totals,
    notes:
      "Year-to-date city-aggregate counts (registered IPC + BNS cases) extracted from the most-recent Mumbai Police monthly crime statistics PDF. Categories normalised to CrimeRadar's internal taxonomy. Counts are city-wide; the per-ward apportioning happens in lib/wards.ts using BMC ward population weights.",
  };
  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    "mumbai",
    "monthly_stats.json",
  );
  await fs.writeFile(dest, JSON.stringify(out, null, 2));
  console.log("totals:", totals);
  console.log(`wrote → ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
