#!/usr/bin/env node
// Scrapes the Gurugram Police Proclaimed Offenders page (CrPC §82 list) into
// data/cities/gurugram/absconders.json. Only the name and the FIR / police
// station reference are kept — father's name and address shown in the source
// table are intentionally stripped to align with our DPDP-minimum naming
// policy (same posture as the Delhi scraper).
//
// Source: https://gurgaon.haryanapolice.gov.in/proclaimed-offenders
// Run:    node scripts/ingest_gurugram_absconders.mjs
//
// The page is an ASP.NET WebForms GridView paginated via `__doPostBack`. We
// load page 1 with a plain GET, then walk pages 2..N by POSTing the form
// with `__EVENTTARGET = gvProclaimedOffenders` and
// `__EVENTARGUMENT = Page$N`, carrying `__VIEWSTATE` /
// `__VIEWSTATEGENERATOR` forward from the previous response (a fresh
// VIEWSTATE is rendered on every page).
//
// One curl invocation per page, with a 700ms sleep in between. We hand
// `curl` a cookie jar so the ASP.NET session sticks. If a page errors out
// (timeout / 5xx / redirect to the site's error page), we bail and record
// what we got so far rather than guessing.

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import os from "node:os";

const PAGE_URL =
  "https://gurgaon.haryanapolice.gov.in/proclaimed-offenders";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

const ROW_OPEN = /<div\s+class="missingBox\s+proclaimedOffBox"\s*>/g;

function safeId(name, caseRef, seq) {
  return (
    "gurugram-" +
    crypto
      .createHash("sha1")
      .update(`gurugram:${name}:${caseRef}:${seq}`)
      .digest("hex")
      .slice(0, 10)
  );
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num) =>
      String.fromCodePoint(parseInt(num, 10)),
    );
}

function clean(s) {
  return decodeEntities(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Pull the value cell that follows a labelled <td class="missPerLab"> cell
// for the given label (plain text — we escape it for the regex here).
function fieldFromCard(card, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    String.raw`<td[^>]*class="missPerLab[^"]*"[^>]*>\s*` +
      escaped +
      String.raw`\s*</td>\s*<td[^>]*class="missPerDet[^"]*"[^>]*>([\s\S]*?)</td>`,
    "i",
  );
  const m = card.match(re);
  return m ? clean(m[1]) : "";
}

// Extract hidden form fields from a rendered page. We need __VIEWSTATE,
// __VIEWSTATEGENERATOR, and (when present) __VIEWSTATEENCRYPTED for the
// next postback.
function extractHidden(html) {
  const out = {};
  const re =
    /<input[^>]+type="hidden"[^>]+name="([^"]+)"[^>]*?value="([^"]*)"[^>]*>/g;
  // Also try the opposite attribute order
  const re2 =
    /<input[^>]+name="([^"]+)"[^>]+type="hidden"[^>]*?value="([^"]*)"[^>]*>/g;
  let m;
  while ((m = re.exec(html))) out[m[1]] = m[2];
  while ((m = re2.exec(html))) {
    if (!(m[1] in out)) out[m[1]] = m[2];
  }
  return out;
}

// Slice the page into individual <div class="missingBox proclaimedOffBox">
// blocks so we can pull labelled fields cleanly. ASP.NET renders these in
// a flat sequence inside the GridView; the closing </div></div> structure
// is deep but consistent.
function splitCards(html) {
  const starts = [];
  let m;
  ROW_OPEN.lastIndex = 0;
  while ((m = ROW_OPEN.exec(html))) starts.push(m.index);
  if (!starts.length) return [];
  // The "PagerStyle" row terminates the GridView region; treat its index
  // as the end-of-cards boundary so the last card doesn't trail off into
  // pagination markup.
  const pagerIdx = html.indexOf('class="PagerStyle"');
  const end = pagerIdx > 0 ? pagerIdx : html.length;
  const cards = [];
  for (let i = 0; i < starts.length; i++) {
    const s = starts[i];
    const e = i + 1 < starts.length ? starts[i + 1] : end;
    cards.push(html.slice(s, e));
  }
  return cards;
}

function parsePage(html) {
  return splitCards(html)
    .map((card) => {
      const name = fieldFromCard(card, "Accused Name");
      const firNo = fieldFromCard(card, "FIR No.");
      // PS values in this data already arrive prefixed (e.g. "PS City",
      // "PS Manesar"); leave them as-is to avoid "PS PS …".
      const ps = fieldFromCard(card, "FIR Filed at P. S.");
      const section = fieldFromCard(card, "Under Section");
      const caseRef = [firNo && `FIR ${firNo}`, ps]
        .filter(Boolean)
        .join(" • ");
      return {
        name,
        caseRef,
        section,
      };
    })
    .filter((r) => r.name && r.name.length >= 2);
}

// Discover the page count from the GridView pager (<tr class="PagerStyle">
// row, which renders the page number list). Returns 1 if no pager found.
function detectPageCount(html) {
  const pager = html.match(/<tr\s+class="PagerStyle"[^>]*>([\s\S]*?)<\/tr>/);
  if (!pager) return 1;
  const nums = [...pager[1].matchAll(/Page\$(\d+)/g)].map((m) =>
    Number(m[1]),
  );
  // The current page renders as a <span>N</span> inside the pager, so add
  // it from there too.
  const cur = [...pager[1].matchAll(/<span[^>]*>(\d+)<\/span>/g)].map((m) =>
    Number(m[1]),
  );
  const all = [...nums, ...cur].filter((n) => Number.isFinite(n));
  if (!all.length) return 1;
  return Math.max(...all);
}

// curl wrapper. Throws on non-2xx. We use a cookie jar so the ASP.NET
// session cookie is reused across page fetches.
function curlReq({ method, body, cookieJar }) {
  const args = [
    "-sS",
    "--compressed",
    "-A",
    UA,
    "-H",
    "Accept: text/html",
    "-c",
    cookieJar,
    "-b",
    cookieJar,
    "--max-time",
    "45",
    "-w",
    "\n__HTTP_CODE__%{http_code}__",
  ];
  if (method === "POST") {
    args.push(
      "-H",
      "Content-Type: application/x-www-form-urlencoded",
      "-H",
      `Referer: ${PAGE_URL}`,
      "--data-binary",
      `@${body}`,
    );
  }
  args.push(PAGE_URL);
  const r = spawnSync("curl", args, {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(`curl exit ${r.status}: ${r.stderr.slice(0, 200)}`);
  }
  const out = r.stdout;
  const tag = out.lastIndexOf("\n__HTTP_CODE__");
  if (tag < 0) throw new Error("curl: missing status tag");
  const html = out.slice(0, tag);
  const code = Number(
    out
      .slice(tag + "\n__HTTP_CODE__".length)
      .replace(/__$/, "")
      .trim(),
  );
  if (code < 200 || code >= 300) {
    throw new Error(`HTTP ${code} from ${PAGE_URL}`);
  }
  // If we got bounced to the site's generic error page, surface it.
  if (/Object Moved|errorhtmlpage\.html/i.test(html.slice(0, 800))) {
    throw new Error("server returned error page");
  }
  return html;
}

function buildPostBody(hidden, pageNum) {
  // ASP.NET expects every form field that was on the page; we send back
  // the hidden state plus blank defaults for the search inputs. Only the
  // GridView postback target/argument is set per page.
  const data = {
    ...hidden,
    __EVENTTARGET:
      "ctl00$ContentPlaceHolder1$ProclaimedOffenders1$gvProclaimedOffenders",
    __EVENTARGUMENT: `Page$${pageNum}`,
    "ctl00$ContentPlaceHolder1$UserContentSearch1$txtKeyword$LiteText": "",
    "ctl00$ContentPlaceHolder1$UserContentSearch1$rlstSearch": "1",
    "ctl00$ContentPlaceHolder1$ProclaimedOffenders1$ddlZone": "",
    "ctl00$ContentPlaceHolder1$ProclaimedOffenders1$ddlSyear": "",
    "ctl00$ContentPlaceHolder1$ProclaimedOffenders1$txtPoliceStation": "",
    "ctl00$ContentPlaceHolder1$ProclaimedOffenders1$txtFirNo": "",
    "ctl00$ContentPlaceHolder1$ProclaimedOffenders1$txtName": "",
  };
  return Object.entries(data)
    .map(
      ([k, v]) =>
        encodeURIComponent(k) + "=" + encodeURIComponent(v ?? ""),
    )
    .join("&");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ggn-po-"));
  const cookieJar = path.join(tmp, "cookies.txt");
  const bodyFile = path.join(tmp, "post.txt");

  const all = [];
  const seen = new Set();
  const errors = [];
  let pagesFetched = 0;
  let totalPages = null;

  let html;
  try {
    html = curlReq({ method: "GET", cookieJar });
  } catch (e) {
    errors.push(`page 1 fetch failed: ${e.message}`);
    html = null;
  }

  if (html) {
    pagesFetched = 1;
    totalPages = detectPageCount(html);
    for (const row of parsePage(html)) {
      const key = `${row.name}::${row.caseRef}`;
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(row);
    }

    let curHidden = extractHidden(html);

    const stopAt = totalPages ?? 1;
    for (let p = 2; p <= stopAt; p++) {
      await sleep(700);
      try {
        await fs.writeFile(bodyFile, buildPostBody(curHidden, p));
        const next = curlReq({ method: "POST", body: bodyFile, cookieJar });
        pagesFetched++;
        const rows = parsePage(next);
        if (!rows.length) {
          errors.push(`page ${p}: 0 rows parsed`);
          break;
        }
        for (const row of rows) {
          const key = `${row.name}::${row.caseRef}`;
          if (seen.has(key)) continue;
          seen.add(key);
          all.push(row);
        }
        curHidden = extractHidden(next);
      } catch (e) {
        errors.push(`page ${p}: ${e.message}`);
        break;
      }
    }
  }

  // Clean up temp files
  try {
    await fs.rm(tmp, { recursive: true, force: true });
  } catch {}

  const absconders = all.map((r, i) => {
    const id = safeId(r.name, r.caseRef, i);
    const out = {
      id,
      sourceUrl: PAGE_URL,
      name: r.name.toUpperCase(),
      isOrganisation: false,
    };
    if (r.caseRef) out.caseRef = r.caseRef;
    if (r.section) out.section = r.section;
    return out;
  });

  const pageNote =
    totalPages != null
      ? `Scraper paginates ${pagesFetched} of ${totalPages} pages.`
      : `Scraper failed on the first page; no data fetched.`;
  const errNote = errors.length
    ? ` Encountered: ${errors.join("; ")}.`
    : "";

  const payload = {
    source: PAGE_URL,
    scrapedAt: new Date().toISOString(),
    count: absconders.length,
    absconders,
    notes:
      "Names republished from the Gurugram Police Proclaimed Offenders web table (CrPC §82). We store only the name, the FIR / police-station reference, and the IPC section — father's name, address, age and sex shown on the source page are intentionally stripped to align with our DPDP-minimum naming policy. " +
      pageNote +
      errNote,
  };

  const dest = path.join(
    process.cwd(),
    "data",
    "cities",
    "gurugram",
    "absconders.json",
  );
  await fs.writeFile(dest, JSON.stringify(payload, null, 2));
  console.log(
    `wrote ${absconders.length} gurugram absconders (${pagesFetched}/${totalPages ?? "?"} pages) → ${dest}`,
  );
  if (errors.length) {
    console.warn(`with ${errors.length} warnings:`);
    for (const e of errors) console.warn("  -", e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
