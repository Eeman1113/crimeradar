#!/usr/bin/env node
// Scrapes the West Bengal CID Most Wanted Criminals list into
// data/cities/kolkata/absconders.json. Walks pagination until no "Next" link.
//
// Source: https://cid.wb.gov.in/cid_records/wanted_criminals
// Run:    node scripts/ingest_kolkata_absconders.mjs

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const BASE = "https://cid.wb.gov.in/cid_records/wanted_criminals";
const UA = "CrimeRadarBot/0.1 contact: legal@crimeradar.example";
const MAX_PAGES = 20;

// WB CID's TLS handshake uses legacy renegotiation that Node's modern undici
// refuses; curl tolerates it.
function curlGet(url) {
  const r = spawnSync(
    "curl",
    ["-sSL", "-A", UA, "--max-time", "30", url],
    { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
  );
  if (r.status !== 0) {
    throw new Error(`curl ${url} -> exit ${r.status}: ${r.stderr.slice(0, 300)}`);
  }
  return r.stdout;
}

function safeId(name, alias) {
  return crypto
    .createHash("sha1")
    .update(`kolkata:${name}:${alias ?? ""}`)
    .digest("hex")
    .slice(0, 12);
}

function clean(s) {
  return s.replace(/\s+/g, " ").trim();
}

function extract(html) {
  // The page renders entries as a flat sequence of plain "Name: X Alias: Y Age : N Father's Name : Z" snippets.
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  const text = body
    ? body[1]
        .replace(/<script[\s\S]*?<\/script>/g, " ")
        .replace(/<style[\s\S]*?<\/style>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
    : "";
  const entryRe =
    /Name:\s*([^A]+?)\s+Alias:\s*([^A]+?)\s+Age\s*:\s*[^F]+?Father['’]s Name\s*:\s*[^A-Z]*/g;
  const out = [];
  let m;
  while ((m = entryRe.exec(text))) {
    const name = clean(m[1]);
    const alias = clean(m[2]).replace(/\s*nil\s*$/i, "");
    if (!name || name.length < 2) continue;
    out.push({
      id: safeId(name, alias),
      name: name.toUpperCase(),
      isOrganisation: false,
      caseRef: alias && alias.toLowerCase() !== "nil" ? `alias ${alias}` : null,
      section: "Most Wanted (WB CID)",
      sourceUrl: BASE,
    });
  }
  return out;
}

function hasNextPage(html, currentPage) {
  // crude detection — look for a link or button with the next page number
  const next = currentPage + 1;
  return new RegExp(`page=${next}\\b|>\\s*${next}\\s*<`, "i").test(html);
}

async function main() {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = page === 1 ? BASE : `${BASE}?page=${page}`;
    let html;
    try {
      html = curlGet(url);
    } catch (e) {
      console.warn(`fetch ${url} failed: ${(e instanceof Error ? e.message : e)}`);
      break;
    }
    const entries = extract(html);
    if (entries.length === 0 && page > 1) break;
    all.push(...entries);
    console.log(`page ${page}: +${entries.length} entries (total ${all.length})`);
    if (!hasNextPage(html, page)) break;
  }
  // de-dup
  const seen = new Set();
  const deduped = all.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  const out = {
    source: BASE,
    scrapedAt: new Date().toISOString(),
    count: deduped.length,
    absconders: deduped,
    notes:
      "Names republished from the West Bengal CID Most Wanted Criminals page. We store only the name and alias (when meaningful) — father's name and age shown on the source page are intentionally stripped to align with our DPDP-minimum naming policy. This list is West Bengal-wide; Kolkata City Police does not separately publish a public absconder list, so the city page surfaces this state-level list.",
  };
  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    "kolkata",
    "absconders.json",
  );
  await fs.writeFile(dest, JSON.stringify(out, null, 2));
  console.log(`wrote ${deduped.length} kolkata absconders → ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
