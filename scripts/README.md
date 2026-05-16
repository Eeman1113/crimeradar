# `scripts/` — ingest scripts

Each `ingest_<city>_<kind>.mjs` script in this folder is a small, single-purpose Node ESM program. They share a common shape:

1. **Fetch** a source document (HTML index page, then one or more PDFs).
2. **Parse** it to extract per-category crime counts.
3. **Validate** the parsed payload.
4. **Write** to `data/cities/{cityId}/monthly_stats.json` (single snapshot) or `data/cities/{cityId}/monthly_stats_history.json` (time-series).

The fetch + parse step is genuinely city-specific — Mumbai Police publishes Marathi-labelled PDFs, KSP publishes a 38-column district table, Delhi Police publishes a multi-year wide table, etc. The **write/validate/dedupe step is identical** across all 16 scripts, and used to be copy-pasted. That plumbing now lives in `lib/ingest/`.

## Using `lib/ingest/`

```js
import {
  writeMonthlyStats,
  appendHistory,
  loadCachedHistory,
  validateMonthlyStats,
} from "../lib/ingest/index.mjs";

// Single snapshot (the common case — most ingest scripts):
await writeMonthlyStats("mumbai", {
  source: "https://mumbaipolice.gov.in/files/Cstat/107.pdf",
  indexUrl: "https://mumbaipolice.gov.in/CrimeStatistics",
  publishedFor: { year: 2026, month: 3 },
  windowKind: "ytd", // "month" | "ytd" | "year"
  scrapedAt: new Date().toISOString(),
  cityWideYtdTotals: { theft: 2264, assault: 1257, ... },
  notes: "...",
});

// Time-series (the history scripts):
const existing = await loadCachedHistory("mumbai");
// ...do fetch + parse, build `months` array...
await appendHistory("mumbai", {
  source: INDEX_URL,
  scrapedAt: new Date().toISOString(),
  months,
  notes: "...",
});
```

### What the helpers do for you

- **`validateMonthlyStats(payload)`** — shape-checks the payload. Throws if `cityWideYtdTotals` is empty, if a category name is unknown, if `windowKind` is wrong, if `scrapedAt` isn't an ISO date, etc. `writeMonthlyStats` calls this automatically; you can call it standalone before write.
- **`writeMonthlyStats(cityId, payload)`** — validates, then writes `data/cities/{cityId}/monthly_stats.json` with deterministic formatting (sorted keys, 2-space indent, trailing newline) so diffs stay clean.
- **`appendHistory(cityId, payload)`** — merges new entries into the existing history file, de-duping by `(year, month, windowKind, category)` and sorting ascending by `(year, month)`. Pre-existing entries win on conflict (pass `opts.overwrite: true` to flip that).
- **`loadCachedHistory(cityId)`** — safely reads the existing history file; returns `{ scrapedAt: null, months: [] }` if missing or malformed.

### Allowed categories (internal taxonomy)

`theft`, `assault`, `robbery`, `burglary`, `sexual_offence`, `kidnapping`, `harassment`, `other`.

If you need a new one, add it to `VALID_CATEGORIES` in `lib/ingest/index.mjs` AND wire it into `lib/risk.ts` / `lib/wards.ts` so the UI knows about it.

### Migration status

`ingest_mumbai_history.mjs` is the pilot — it imports from `lib/ingest/`. The other 15 scripts still do their own file writes; they will be migrated one at a time as we touch them for other reasons. **Don't do a big-bang refactor** — each script has its own quirky source format and we want the helpers to absorb real friction, not invent it.

### Writing a new ingest script

1. Pick a `cityId` matching a folder under `data/cities/`.
2. Copy a structurally similar existing script (e.g. `ingest_chennai_stats.mjs` for a single-snapshot scraper).
3. Replace the bottom-of-file `fs.writeFile(...)` call with `await writeMonthlyStats(cityId, out)` and import the helper.
4. Run `node --check scripts/ingest_<city>_<kind>.mjs` to confirm the syntax.
5. Do **not** add the script to any `npm run` target — ingest scripts are run manually by the maintainer; CI does not have network access to police sites.
