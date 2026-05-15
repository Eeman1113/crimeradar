#!/usr/bin/env node
// Scrapes Pune City Police monthly absconder PDFs into
// data/cities/pune/absconders.json.
//
// Source index: https://admin.punepolice.gov.in/absconder_list
// Each row on that index links to a numbered monthly PDF
// (https://admin.punepolice.gov.in/files/Absconder/<N>.pdf). We scrape
// only the latest PDF.
//
// IMPORTANT: As of 2026, every Pune absconder PDF we have inspected
// is typeset in Marathi using the legacy "DV-TTYogesh" Devanagari
// TrueType font. The embedded ToUnicode CMap is an identity-style
// mapping that preserves the font's private byte values rather than
// real Unicode code points — pdf-parse, pdftotext, and pdfjs-dist all
// return garbled Latin-1 text. We have no reliable way to recover the
// person names without a DV-TTYogesh→Devanagari glyph table (and even
// then, transliteration to ASCII would be lossy). Per our policy of
// "never invent names", we surface the source PDF + a clear note
// instead of writing any rows.
//
// Run: node scripts/ingest_pune_absconders.mjs

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const INDEX_URL = "https://admin.punepolice.gov.in/absconder_list";
const PDF_BASE = "https://admin.punepolice.gov.in/files/Absconder";
const UA = "CrimeRadarBot/0.1 contact: legal@crimeradar.example";

const COMPANY_RE = /\b(LTD|LIMITED|PVT|PRIVATE|COMPANY|CORPORATION|CORP\.?|INC\.?|LLP)\b/i;

function safeId(name, pdfId, seq) {
  return crypto
    .createHash("sha1")
    .update(`pune:${pdfId}:${seq}:${name}`)
    .digest("hex")
    .slice(0, 12);
}

// The index page lists each monthly PDF as a relative-path anchor like
//   <a href="https://admin.punepolice.gov.in/files/Absconder/83.pdf" ...>
// in descending order (latest first). We pick the highest numeric id we
// see — that's the most recent month, regardless of the page ordering.
function parseIndex(html) {
  const re = /https:\/\/admin\.punepolice\.gov\.in\/files\/Absconder\/(\d+)\.pdf/g;
  const seen = new Set();
  const ids = [];
  let m;
  while ((m = re.exec(html))) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  ids.sort((a, b) => Number(b) - Number(a));
  return ids;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return res.text();
}

async function fetchPdf(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

// Returns the fraction of "garbled" characters — bytes in the Latin-1
// extended range (0xA0–0xFF) that appear when a Devanagari-glyph font
// is decoded as Latin-1. A ratio over ~0.4 indicates the PDF text is
// not actually English/Marathi-Unicode and cannot be parsed for names.
function garbledRatio(text) {
  let ascii = 0;
  let latinExt = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x41 && cp <= 0x7a) ascii++;
    else if (cp >= 0xa0 && cp <= 0xff) latinExt++;
  }
  const denom = ascii + latinExt;
  if (denom === 0) return 0;
  return latinExt / denom;
}

// Best-effort name extractor for the day a Pune PDF arrives in clean
// Unicode (or English). Looks for lines that read like a Marathi/English
// name: two or more capitalised tokens, no digits, reasonable length.
// We deliberately keep this conservative — if we cannot find at least
// a handful of plausible names, we return [] and let the caller record
// the parse failure in `notes`.
function extractNames(text, pdfId) {
  const out = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const seq = { n: 0 };
  const nameLineRe =
    /^([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,5})(?:\s*(?:alias|urf|@)\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3}))?\s*[,.]?\s*$/;
  for (const line of lines) {
    const m = line.match(nameLineRe);
    if (!m) continue;
    const name = m[2] ? `${m[1]} alias ${m[2]}` : m[1];
    if (name.length < 5 || name.length > 80) continue;
    if (/\b(POLICE|STATION|COURT|PUNE|ABSCONDER|NAME|ADDRESS|FIR|CASE)\b/i.test(name)) continue;
    seq.n += 1;
    out.push({
      id: safeId(name, pdfId, seq.n),
      pdfId: `Absconder/${pdfId}`,
      sourcePdfUrl: `${PDF_BASE}/${pdfId}.pdf`,
      name,
      isOrganisation: COMPANY_RE.test(name),
    });
  }
  return out;
}

async function tryParsePdf(pdfId) {
  const url = `${PDF_BASE}/${pdfId}.pdf`;
  const bytes = await fetchPdf(url);
  const parser = new PDFParse({ data: bytes });
  const result = await parser.getText();
  const text = result.text ?? (result.pages || []).map((p) => p.text || "").join("\n");
  const ratio = garbledRatio(text);
  const rows = ratio < 0.4 ? extractNames(text, pdfId) : [];
  return { pdfId, url, text, ratio, rows };
}

async function main() {
  const html = await fetchText(INDEX_URL);
  const ids = parseIndex(html);
  if (ids.length === 0) {
    throw new Error(`no PDF links found on ${INDEX_URL}`);
  }
  console.log(`found ${ids.length} monthly PDFs; latest = #${ids[0]}`);

  // Try the latest PDF. If parsing yields zero usable names (which
  // happens when the PDF uses the legacy DV-TTYogesh Marathi font with
  // no real ToUnicode CMap), fall back to the second-latest before
  // declaring a parse failure.
  const attempts = [];
  let parsed = null;
  for (const id of ids.slice(0, 2)) {
    const r = await tryParsePdf(id);
    attempts.push({ pdfId: id, ratio: r.ratio, rows: r.rows.length });
    console.log(
      `PDF #${id}: garbled-ratio=${r.ratio.toFixed(3)}, name rows extracted=${r.rows.length}`,
    );
    if (r.rows.length > 0) {
      parsed = r;
      break;
    }
  }

  const latestId = ids[0];
  let out;
  if (parsed && parsed.rows.length > 0) {
    // De-dup by id (defensive — sequential ids should already be unique).
    const seen = new Set();
    const deduped = parsed.rows.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    out = {
      source: parsed.url,
      indexUrl: INDEX_URL,
      scrapedAt: new Date().toISOString(),
      count: deduped.length,
      absconders: deduped,
      notes: `Source: Pune City Police monthly absconder list (CrPC §82). Latest PDF parsed: Absconder/${parsed.pdfId}.pdf. Names extracted via heuristic line-level matcher on pdf-parse output; rows whose text could not be confidently identified as a person/organisation name are skipped.`,
    };
  } else {
    // Honest failure: every PDF we tried is typeset in the legacy
    // DV-TTYogesh Marathi font with no usable ToUnicode mapping. We
    // refuse to invent names — write an empty list with a note pointing
    // at the source.
    const tried = attempts
      .map((a) => `#${a.pdfId} (garbled=${a.ratio.toFixed(2)})`)
      .join(", ");
    out = {
      source: `${PDF_BASE}/${latestId}.pdf`,
      indexUrl: INDEX_URL,
      scrapedAt: new Date().toISOString(),
      count: 0,
      absconders: [],
      notes: `Pune City Police publishes monthly absconder PDFs (CrPC §82) at ${INDEX_URL}. As of this scrape the latest PDFs we inspected (${tried}) are typeset in Marathi using the legacy DV-TTYogesh TrueType font whose embedded ToUnicode CMap maps glyphs to their private byte values rather than real Devanagari code points — pdf-parse, pdftotext (poppler) and pdfjs-dist all return garbled Latin-1 text. We have no reliable way to recover person names from these files without a hand-built DV-TTYogesh→Devanagari glyph table, so per our "never invent names" policy we ship an empty list and link to the official PDF. Latest PDF: ${PDF_BASE}/${latestId}.pdf.`,
    };
  }

  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    "pune",
    "absconders.json",
  );
  await fs.writeFile(dest, JSON.stringify(out, null, 2));
  console.log(`wrote ${out.count} pune absconders → ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
