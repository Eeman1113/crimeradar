# Contributing to CrimeRadar

CrimeRadar is a static Next.js site that visualises ward-level crime risk for Indian cities. Ward boundaries, population, and per-category counts are committed as JSON/GeoJSON; risk scores are derived at build time. The codebase ships as a GitHub Pages export — there is no server runtime, no live API, and no database. Contributions usually fall into one of three buckets: adding a new city, refreshing data for an existing city, or improving the UI / methodology pages.

## Adding a city

The flow is fully driven by `data/cities.manifest.json`. Don't hand-edit `lib/cities.generated.ts`, `lib/wards.generated.ts`, or `lib/absconders.generated.ts` — they're regenerated from the manifest.

1. Drop the ward GeoJSON into `public/geo/<city>_wards.geojson`. Every feature must carry a stable identifier under a single property key (the `wardIdKey`).
2. Run `node scripts/add_city.mjs` with the city's metadata (id, name, state, state code, tier, geojson path, ward id key, unit label, population). It validates the GeoJSON, computes bounds + center, appends an entry to `data/cities.manifest.json`, stubs `data/cities/<id>/{monthly_stats,monthly_stats_history,ward_news,absconders}.json`, and writes `data/cities/<id>/wards-raw.ts` via `scripts/generate_ward_seed.mjs`. It is idempotent; re-running with the same inputs is safe.
3. `add_city.mjs` invokes `scripts/codegen_cities.mjs` at the end, which validates the manifest (id format, tier enum, required fields, no duplicates) and rewrites the three `lib/*.generated.ts` files. You can also run `npm run codegen:cities` directly when you've edited the manifest by hand.
4. Commit the GeoJSON, the manifest change, the new `data/cities/<id>/` directory, and the regenerated `lib/*.generated.ts` files together.

## Data-source citation rules

Every record in `data/cities/<id>/*.json` must include both a real upstream URL and a `scrapedAt` ISO date. `lib/wards.ts` walks `source` / `indexUrl` / per-month `source` / news `source` / absconder file URLs to populate the "sources cited" and "domains" counts on the methodology page — entries without a parseable URL get dropped from the domain count. Concretely:

- `monthly_stats.json` and `monthly_stats_history.json`: `source` must point at the actual police PDF/CSV/page you pulled the numbers from. `scrapedAt` is the date you fetched it.
- `ward_news.json`: `source` is the feed URL (e.g. a Google News RSS query); `scrapedAt` is when it was fetched.
- `absconders.json`: `source` must be the official police list (CrPC §82 proclaimed-offenders pages, etc.). Naming policy is strict — see `/legal` and the methodology page.
- Editorial / placeholder strings are allowed only when no URL exists yet, and they should still be specific enough to attribute.

## Calibrated vs seeded data contract

Per-ward incident counts are never invented from thin air at runtime, but they are also not raw observations. `lib/wards.ts::calibrate` takes the editorial per-ward `breakdown` from `wards-raw.ts` and rescales each category by `realCityTotal / seedCityTotal` whenever the city's `monthly_stats.json` provides a real `cityWideYtdTotals[category]`.

- If at least one category has a real total, the ward set is tagged `dataQuality: "calibrated"` — the absolute scale comes from the police source, but the relative split across wards is editorial.
- If no real totals exist for any category, the seed values flow through unscaled and the wards are tagged `dataQuality: "seeded"` — both the scale and the split are editorial.

`app/methodology/page.tsx` documents this distinction verbatim. When you add or update data, keep the contract intact: don't fabricate a `cityWideYtdTotals` entry without a real source URL, and don't mark something `calibrated` by editing the generated file.

## Pull-request checklist

- `npx tsc --noEmit` (or `npm run typecheck` if defined) passes locally.
- No live scrapers added to runtime code or CI. Scrapers belong in `scripts/` / `workers/` and run out-of-band; the site itself reads only committed JSON.
- `data/cities.manifest.json` regenerated through `scripts/add_city.mjs` or `scripts/codegen_cities.mjs` — no hand edits to `lib/*.generated.ts`.
- New JSON entries carry a real source URL and `scrapedAt` date.
- `CLAUDE.md` and `.claude/` are not staged. They're gitignored and must stay that way; don't `git add -f` them.

## Style notes

- TypeScript is strict — no `any`, no implicit `any`, no `// @ts-ignore` without an adjacent comment explaining why.
- Tailwind v4 with the CSS-first config in `app/globals.css`. Prefer utility classes; reach for `components/ui/*` (shadcn) primitives before writing bespoke CSS.
- This is not the Next.js you might remember from older docs — read `node_modules/next/dist/docs/` for the version that's actually installed before adjusting routing, caching, or data-fetching patterns. Heed deprecation notices.
- Avoid wiring `next build` into pre-commit or other local hooks. The full build is heavy; for CI parity rely on `tsc --noEmit` plus targeted lint/test runs. Production builds are handled by `.github/workflows/deploy.yml` on push to `main`.
