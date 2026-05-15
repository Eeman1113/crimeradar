#!/usr/bin/env node
// Backfills the full history of Mumbai Police monthly crime statistics.
// Walks the index page to enumerate every Cstat PDF, parses each one for
// THIS-MONTH and YTD totals per category, and writes a time-series JSON
// at data/cities/mumbai/monthly_stats_history.json.
//
// Run: node scripts/ingest_mumbai_history.mjs
//   first run downloads everything (~100 PDFs, slow). Subsequent runs are
//   incremental: only new (year, month) entries are fetched.

import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const INDEX_URL = "https://mumbaipolice.gov.in/CrimeStatistics";
const UA = "CrimeRadarBot/0.1 contact: legal@crimeradar.example";
const DEST = path.join(
  process.cwd(),
  "data",
  "cities",
  "mumbai",
  "monthly_stats_history.json",
);

// ─── parser, copied from ingest_monthly_stats.mjs and trimmed ───
const ANCHOR_MAP = [
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

function readBlockFromText(text, fromIdx) {
  const window = text.slice(fromIdx, fromIdx + 400);
  let cleaned = window.replace(/\([^)]*\)/g, " ");
  cleaned = cleaned.replace(/u\/s\s+\d[\d., ]*/gi, " ");
  cleaned = cleaned.replace(/Sec\.?\s+\d[\d., ]*/gi, " ");
  return (cleaned.match(/\d+/g) ?? []).map(Number);
}

function extractTotals(text, columnIdx) {
  const lc = text.toLowerCase();
  const totals = {};
  const matched = new Set();
  const used = [];
  const isUsed = (p) => used.some((u) => Math.abs(u - p) < 30);
  for (const anchor of ANCHOR_MAP) {
    let from = 0;
    while (from < lc.length) {
      const idx = lc.indexOf(anchor.needle, from);
      if (idx < 0) break;
      from = idx + anchor.needle.length;
      if (isUsed(idx)) continue;
      const ctx = text
        .slice(Math.max(0, idx - 30), idx + 300)
        .toLowerCase();
      if (/with pocso/.test(ctx)) continue;
      if (
        anchor.needle === "murder" &&
        /(dowry|other reasons|love affair|illicit)/.test(ctx)
      )
        continue;
      if (anchor.needle === "molestation") continue;
      const block = readBlockFromText(text, idx);
      if (block.length <= columnIdx) continue;
      const v = block[columnIdx];
      if (!Number.isFinite(v) || v < 0 || v > 1_000_000) continue;
      used.push(idx);
      if (PREFER_TOTAL.has(anchor.cat)) {
        if (anchor.needle.startsWith("total ")) {
          totals[anchor.cat] = v;
          matched.add(anchor.cat + ":total");
        } else if (!matched.has(anchor.cat + ":total")) {
          totals[anchor.cat] = totals[anchor.cat] ?? v;
        }
      } else {
        const key = anchor.cat + ":" + anchor.needle;
        if (matched.has(key)) continue;
        matched.add(key);
        totals[anchor.cat] = (totals[anchor.cat] ?? 0) + v;
      }
      break;
    }
  }
  return totals;
}

// ─── index parsing ───
const MR_MONTHS = {
  जानेवारी: 1, फेब्रुवारी: 2, मार्च: 3, एप्रिल: 4,
  मे: 5, जून: 6, जुलै: 7, ऑगस्ट: 8,
  सप्टेंबर: 9, ऑक्टोबर: 10, नोव्हेंबर: 11, डिसेंबर: 12,
};

function parseIndex(html) {
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = trRe.exec(html))) {
    const link = m[1].match(
      /href="(https:\/\/mumbaipolice\.gov\.in\/files\/Cstat\/(\d+)\.pdf)"/,
    );
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
  let yearText = m[2];
  if (/[०-९]/.test(yearText)) {
    yearText = yearText.replace(/[०-९]/g, (d) =>
      String("०१२३४५६७८९".indexOf(d)),
    );
  }
  const month = MR_MONTHS[m[1].trim()];
  if (!month) return null;
  return { year: parseInt(yearText, 10), month };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return res.text();
}

async function fetchBytes(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function loadExisting() {
  try {
    const buf = await fs.readFile(DEST, "utf8");
    return JSON.parse(buf);
  } catch {
    return { scrapedAt: null, months: [] };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const existing = await loadExisting();
  const seen = new Map(
    existing.months.map((m) => [`${m.year}-${m.month}`, m]),
  );

  console.log(`existing months: ${seen.size}`);
  const indexHtml = await fetchText(INDEX_URL);
  const idx = parseIndex(indexHtml);
  const targets = [];
  for (const row of idx) {
    const ym = labelToYearMonth(row.label);
    if (!ym) continue;
    const key = `${ym.year}-${ym.month}`;
    if (seen.has(key)) continue;
    targets.push({ ...row, ...ym });
  }
  console.log(`new months to fetch: ${targets.length}`);

  let success = 0;
  let failed = 0;
  for (const t of targets) {
    try {
      const bytes = await fetchBytes(t.pdfUrl);
      const parser = new PDFParse({ data: bytes });
      const result = await parser.getText();
      const text =
        result.text ??
        (result.pages || []).map((p) => p.text || "").join("\n");
      const currentMonth = extractTotals(text, 0); // 1st number in row = CM-R
      const ytd = extractTotals(text, 4); // 5th number = YTD-R
      if (Object.keys(currentMonth).length === 0) {
        console.warn(`  #${t.pdfId} ${t.year}-${t.month}: no data parsed`);
        failed++;
        continue;
      }
      seen.set(`${t.year}-${t.month}`, {
        year: t.year,
        month: t.month,
        pdfId: t.pdfId,
        source: t.pdfUrl,
        currentMonth,
        ytd,
      });
      success++;
      console.log(
        `  ✓ #${t.pdfId} ${t.year}-${String(t.month).padStart(2, "0")} (${success}/${targets.length})`,
      );
      await sleep(300); // be nice to mumbaipolice.gov.in
    } catch (e) {
      failed++;
      console.warn(`  ✗ #${t.pdfId} ${t.year}-${t.month}: ${e.message}`);
    }
  }

  // sort ascending by (year, month)
  const months = [...seen.values()].sort(
    (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month),
  );

  const out = {
    source: INDEX_URL,
    scrapedAt: new Date().toISOString(),
    count: months.length,
    months,
    notes:
      "Time-series of Mumbai Police monthly crime stats. `currentMonth` = the month's own registered counts (block[0]); `ytd` = year-to-date registered through this month (block[4]). Backfilled from /files/Cstat/<id>.pdf, one entry per (year, month). Categories normalised to internal taxonomy.",
  };

  await fs.mkdir(path.dirname(DEST), { recursive: true });
  await fs.writeFile(DEST, JSON.stringify(out, null, 2));
  console.log(
    `wrote ${months.length} months → ${DEST} (success=${success}, failed=${failed})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
