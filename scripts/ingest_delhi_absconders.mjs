#!/usr/bin/env node
// Scrapes the Delhi Police Proclaimed Offenders page (CrPC §82 list) into
// data/cities/delhi/absconders.json. Only the name and the FIR/PS reference
// are kept — we deliberately drop father's name and address to align with
// our DPDP-minimum naming policy.
//
// Source: https://delhipolice.ncog.gov.in/Delhi_police/proclaimed.html
// Run:    node scripts/ingest_delhi_absconders.mjs

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const PAGE_URL =
  "https://delhipolice.ncog.gov.in/Delhi_police/proclaimed.html";
const UA = "CrimeRadarBot/0.1 contact: legal@crimeradar.example";

function safeId(name, fir) {
  return crypto
    .createHash("sha1")
    .update(`delhi:${name}:${fir}`)
    .digest("hex")
    .slice(0, 12);
}

function clean(s) {
  return s.replace(/\s+/g, " ").trim();
}

// Match all entries in a section text block. Each entry starts with the
// label "Name of the P.O" or "Name of accused" and runs until the next
// such label. Within an entry we extract the part of the name BEFORE
// "S/o" (so we drop father's name) and the FIR / PS reference if present.
function extractEntries(sectionText, sectionLabel) {
  const labelRe = /Name of (?:the P\.?O|accused)\s+/gi;
  const indices = [];
  let m;
  while ((m = labelRe.exec(sectionText))) indices.push(m.index + m[0].length);
  const out = [];
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i];
    const end = i + 1 < indices.length ? indices[i + 1] : sectionText.length;
    const block = sectionText.slice(start, end);
    // name = everything up to S/o, D/o, W/o, or "Adress"
    const nameMatch = block.match(
      /^([^]*?)(?=\s+(?:S\/o|s\/o|D\/o|d\/o|W\/o|w\/o|Adress|Address|FIR))/,
    );
    let name = nameMatch ? clean(nameMatch[1]) : clean(block.split(" S/o")[0]);
    // strip trailing punctuation/labels
    name = name.replace(/\s*[.,-]+$/, "");
    if (!name || name.length < 3) continue;
    // FIR / PS reference (kept as a citation; serves the role of pdfId in
    // the Mumbai data — a stable handle to the source case)
    const firMatch =
      block.match(/FIR No\.?\s*&?\s*(?:Police Station|PS)?:?\s*([^\n]{3,80})/i) ||
      block.match(/(\d{1,4}\/\d{2,4}[^A-Z]{0,80})/);
    const fir = firMatch ? clean(firMatch[1]).replace(/\s*Name of.*$/i, "") : "";

    out.push({
      id: safeId(name, fir || sectionLabel),
      name: name.toUpperCase(),
      isOrganisation: false,
      caseRef: fir || null,
      section: sectionLabel,
      sourceUrl: PAGE_URL,
    });
  }
  return out;
}

async function main() {
  const res = await fetch(PAGE_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fetch ${PAGE_URL} -> ${res.status}`);
  const html = await res.text();
  const sections = html.split(/<h2[^>]*>/);
  const all = [];
  for (let i = 1; i < sections.length; i++) {
    const s = sections[i];
    const head = clean(s.split("<")[0]);
    const text = clean(s.replace(/<[^>]+>/g, " "));
    const entries = extractEntries(text, head);
    all.push(...entries);
  }
  // de-dup by id
  const seen = new Set();
  const deduped = all.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  const out = {
    source: PAGE_URL,
    scrapedAt: new Date().toISOString(),
    count: deduped.length,
    absconders: deduped,
    notes:
      "Names republished from the Delhi Police Proclaimed Offenders page (CrPC §82). We store only the name and the source case reference (FIR/PS) — father's name and address shown on the source page are intentionally stripped to align with our DPDP-minimum naming policy.",
  };
  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    "delhi",
    "absconders.json",
  );
  await fs.writeFile(dest, JSON.stringify(out, null, 2));
  console.log(`wrote ${deduped.length} delhi absconders → ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
