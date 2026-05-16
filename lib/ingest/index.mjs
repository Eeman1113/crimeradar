// Shared helpers for scripts/ingest_*.mjs. Pure Node ESM, no TS, no deps.
//
// The 16 ingest scripts all converge on the same I/O shape:
//   data/cities/{cityId}/monthly_stats.json            ← single snapshot
//   data/cities/{cityId}/monthly_stats_history.json    ← time-series
//
// Each script's interesting work is fetching + parsing a specific city's
// source. The write/dedupe/validate plumbing is what's duplicated. This
// module owns that plumbing. Migration is incremental: scripts opt in one
// at a time by importing these helpers.

import fs from "node:fs/promises";
import path from "node:path";

const VALID_CATEGORIES = new Set([
  "theft",
  "assault",
  "robbery",
  "burglary",
  "sexual_offence",
  "kidnapping",
  "harassment",
  "other",
]);

const VALID_WINDOW_KINDS = new Set(["month", "ytd", "year"]);

function cityDir(cityId) {
  if (!cityId || typeof cityId !== "string" || !/^[a-z0-9_-]+$/.test(cityId)) {
    throw new Error(
      `invalid cityId: ${JSON.stringify(cityId)} (must be lowercase alnum / _ / -)`,
    );
  }
  return path.join(process.cwd(), "data", "cities", cityId);
}

// Stable JSON.stringify: object keys are emitted in sorted order at every
// depth. Arrays preserve their order (caller decides the array order — that's
// often semantically meaningful, e.g. months ascending).
function stableStringify(value, indent = 2) {
  const seen = new WeakSet();
  const walk = (v) => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) throw new Error("cycle in payload");
    seen.add(v);
    if (Array.isArray(v)) return v.map(walk);
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = walk(v[k]);
    return out;
  };
  return JSON.stringify(walk(value), null, indent);
}

/**
 * Validate a single-snapshot monthly_stats payload. Throws on bad shape so
 * the caller's script exits with a useful error instead of writing garbage.
 *
 * Required:
 *   source         : non-empty string (URL of the source doc)
 *   scrapedAt      : ISO timestamp string
 *   windowKind     : "month" | "ytd" | "year"
 *   cityWideYtdTotals : { [cat in VALID_CATEGORIES]?: finite non-negative int }
 *
 * Optional:
 *   indexUrl, publishedFor { year, month? }, notes
 */
export function validateMonthlyStats(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("payload must be an object");
  }
  if (typeof payload.source !== "string" || !payload.source) {
    throw new Error("payload.source must be a non-empty string");
  }
  if (typeof payload.scrapedAt !== "string" || Number.isNaN(Date.parse(payload.scrapedAt))) {
    throw new Error("payload.scrapedAt must be an ISO timestamp string");
  }
  if (!VALID_WINDOW_KINDS.has(payload.windowKind)) {
    throw new Error(
      `payload.windowKind must be one of ${[...VALID_WINDOW_KINDS].join("/")}, got ${payload.windowKind}`,
    );
  }
  const totals = payload.cityWideYtdTotals;
  if (!totals || typeof totals !== "object") {
    throw new Error("payload.cityWideYtdTotals must be an object");
  }
  for (const [cat, v] of Object.entries(totals)) {
    if (!VALID_CATEGORIES.has(cat)) {
      throw new Error(`unknown category in cityWideYtdTotals: ${cat}`);
    }
    if (!Number.isFinite(v) || v < 0 || v > 10_000_000 || !Number.isInteger(v)) {
      throw new Error(`bad count for ${cat}: ${v}`);
    }
  }
  if (Object.keys(totals).length === 0) {
    throw new Error("cityWideYtdTotals is empty — parser produced no rows");
  }
  if (payload.publishedFor !== undefined) {
    const p = payload.publishedFor;
    if (!p || typeof p !== "object") {
      throw new Error("publishedFor must be an object when present");
    }
    if (!Number.isInteger(p.year) || p.year < 2000 || p.year > 2100) {
      throw new Error(`bad publishedFor.year: ${p.year}`);
    }
    if (p.month !== undefined && (!Number.isInteger(p.month) || p.month < 1 || p.month > 12)) {
      throw new Error(`bad publishedFor.month: ${p.month}`);
    }
  }
  return payload;
}

/**
 * Write a monthly_stats.json snapshot for a city.
 *
 *   await writeMonthlyStats("mumbai", payload);
 *
 * Options:
 *   opts.validate (default true) — run validateMonthlyStats first
 *   opts.dest                     — override destination path (mostly for tests)
 */
export async function writeMonthlyStats(cityId, payload, opts = {}) {
  const { validate = true, dest } = opts;
  if (validate) validateMonthlyStats(payload);
  const target = dest ?? path.join(cityDir(cityId), "monthly_stats.json");
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, stableStringify(payload, 2) + "\n");
  return target;
}

/**
 * Read the existing history file. Returns a fresh empty shape if the file is
 * missing or malformed — callers can treat this as "first run".
 */
export async function loadCachedHistory(cityId, opts = {}) {
  const target = opts.dest ?? path.join(cityDir(cityId), "monthly_stats_history.json");
  try {
    const buf = await fs.readFile(target, "utf8");
    const parsed = JSON.parse(buf);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.months)) {
      return { scrapedAt: null, months: [] };
    }
    return parsed;
  } catch {
    return { scrapedAt: null, months: [] };
  }
}

// History entries are keyed by (year, month?, windowKind, category-set-fingerprint).
// For the common (year, month) → totals shape we collapse "category" into a
// per-entry object, so the dedupe key is really (year, month, windowKind).
function entryKey(entry) {
  const y = entry.year ?? "";
  const m = entry.month ?? "";
  const w = entry.windowKind ?? entry.window ?? "";
  const cat = entry.category ?? "";
  return `${y}|${m}|${w}|${cat}`;
}

/**
 * Append entries to monthly_stats_history.json, de-duping by
 * (year, month, windowKind, category) and sorting ascending by (year, month).
 *
 *   await appendHistory("mumbai", { source, months: [...] });
 *
 * `payload.months` is the array of new entries to merge. Any entry already
 * present (same dedupe key) is left untouched — earlier writes are the
 * trusted baseline. Pass `opts.overwrite = true` to flip that.
 *
 * The on-disk shape:
 *   { source, scrapedAt, count, months: [...] sorted asc, notes? }
 */
export async function appendHistory(cityId, payload, opts = {}) {
  const { overwrite = false, dest, notes } = opts;
  if (!payload || !Array.isArray(payload.months)) {
    throw new Error("payload.months must be an array");
  }
  const target = dest ?? path.join(cityDir(cityId), "monthly_stats_history.json");
  const existing = await loadCachedHistory(cityId, { dest: target });

  const merged = new Map();
  for (const e of existing.months) merged.set(entryKey(e), e);
  for (const e of payload.months) {
    const k = entryKey(e);
    if (overwrite || !merged.has(k)) merged.set(k, e);
  }

  const months = [...merged.values()].sort((a, b) => {
    const ay = (a.year ?? 0) * 12 + (a.month ?? 0);
    const by = (b.year ?? 0) * 12 + (b.month ?? 0);
    if (ay !== by) return ay - by;
    // tie-break on windowKind so output is fully deterministic
    return String(a.windowKind ?? a.window ?? "").localeCompare(
      String(b.windowKind ?? b.window ?? ""),
    );
  });

  const out = {
    source: payload.source ?? existing.source ?? null,
    scrapedAt: payload.scrapedAt ?? new Date().toISOString(),
    count: months.length,
    months,
    ...(notes !== undefined
      ? { notes }
      : payload.notes !== undefined
        ? { notes: payload.notes }
        : existing.notes !== undefined
          ? { notes: existing.notes }
          : {}),
  };

  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, stableStringify(out, 2) + "\n");
  return { dest: target, count: months.length, added: months.length - existing.months.length };
}

export const __testing = { stableStringify, entryKey, VALID_CATEGORIES };
