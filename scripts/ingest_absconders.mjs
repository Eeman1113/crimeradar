#!/usr/bin/env node
// Scrapes https://mumbaipolice.gov.in/absconder_list into
// data/cities/mumbai/absconders.json.
// Run: node scripts/ingest_absconders.mjs

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const LIST_URL = "https://mumbaipolice.gov.in/absconder_list";
const UA = "CrimeRadarBot/0.1 contact: legal@crimeradar.example";

const COMPANY_RE = /\b(LTD|LIMITED|PVT|PRIVATE|COMPANY|CORPORATION|CORP\.?|INC\.?|LLP)\b/i;

function safeId(name, pdfId) {
  return crypto
    .createHash("sha1")
    .update(`${pdfId}:${name}`)
    .digest("hex")
    .slice(0, 12);
}

function parseRows(html) {
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = trRe.exec(html))) {
    const body = m[1];
    const link = body.match(
      /href="(https:\/\/mumbaipolice\.gov\.in\/files\/Absconder\/(\d+)\.pdf)"/,
    );
    if (!link) continue;
    const cells = [...body.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
      c[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );
    const rawName = cells.find(
      (c) => c && /[A-Z]/.test(c) && !/pdf/i.test(c),
    );
    if (!rawName) continue;
    const name = rawName.replace(/\s*urfa\s*/gi, " alias ");
    rows.push({
      id: safeId(name, link[2]),
      pdfId: link[2],
      sourcePdfUrl: link[1],
      name,
      isOrganisation: COMPANY_RE.test(name),
    });
  }
  return rows;
}

async function main() {
  const res = await fetch(LIST_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fetch ${LIST_URL} -> ${res.status}`);
  const html = await res.text();
  const rows = parseRows(html);
  const out = {
    source: LIST_URL,
    scrapedAt: new Date().toISOString(),
    count: rows.length,
    absconders: rows,
    notes:
      "Names republished from Mumbai Police Absconder List (CrPC §82). The listing does not include police-station or charge fields; PDFs are image-based scans, so station/charge data is not extractable without OCR. Each card links to the source PDF.",
  };
  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    "mumbai",
    "absconders.json",
  );
  await fs.writeFile(dest, JSON.stringify(out, null, 2));
  console.log(`wrote ${rows.length} absconders → ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
