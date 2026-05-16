# Changelog

All notable changes to CrimeRadar are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-16

Initial public release. CrimeRadar is a ward-level safety map for Indian cities,
built as a Next.js 16 (App Router) static export hosted on GitHub Pages.

### Added

- **43 cities across 28 states + 6 union territories** — onboarded via a
  manifest-driven city registry (`data/cities.manifest.json`) with codegen
  emitting `lib/cities.generated.ts`, `lib/wards.generated.ts`, and
  `lib/absconders.generated.ts` at prebuild time.
- **Ward-level heatmap** — per-ward risk scores apportioned from real
  city-wide NCRB / state-police totals via a tier model (central / inner /
  outer / peripheral bands), then calibrated so category sums match the
  official city number.
- **Real city-aggregate totals for all 43 cities** — sourced from NCRB
  "Crime in India 2022" megacity + district tables, the NCRB 2023 expanded
  34-city table, and state-police commissionerate reports for capitals.
- **Multi-year history (NCRB 2019–2023)** — annual trend line chart for the
  8 non-Mumbai megacities; Mumbai gets a 42-month 2023–2026 series.
- **Real per-ward populations for 26 of 43 cities** — Census 2011 plus
  published municipal voter/ward demographics where they predate Census.
- **13 languages** — English plus 12 Indic locales (Hindi, Bengali, Tamil,
  Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese,
  Urdu). City names sourced from Wikipedia interlanguage links; UI strings
  from a hand-maintained dictionary.
- **Night-time multiplier toggle** and **Women's Safety Lens** — separate
  risk scoring that filters to women-targeted offence categories.
- **Day-vs-night delta chart** per ward.
- **Absconder / Proclaimed Offender lists for 5 cities** — Mumbai, Delhi,
  Kolkata, Pune, Gurugram — republished with attribution from official
  police sources.
- **Compare page** — all 43 cities side-by-side with per-100k bar chart
  and crime-mix radar chart; quick-selects for All / With stats / Clear,
  with geometry-only cities muted.
- **Cross-city ward search** with a searchable city picker in the header.
- **Live news on ward pages** — Cloudflare Worker (`crimeradar-news`)
  aggregating Hindustan Times and Times of India city feeds, with a
  two-pass query and an `allorigins.win` no-infra fallback.
- **Weekly ward news** — Google News RSS per ward (≤4 items, last 18
  months, keyword-filtered for crime/police/arrest terms) with
  neighborhood-name extraction.
- **Reminder feature** on ward pages.
- **/methodology** page with source-count stat tiles and contact email.
- **/legal** page with naming policy, takedown contact, and DPDP notice.
- **Data freshness panel** surfacing each city's source URL and year.
- **PostHog analytics** wired across the app (token + host passed through
  on the GitHub Pages build).
- **GitHub Actions workflows** — `ingest_news.yml` (weekly, all manifest
  cities, 90-min timeout for the 43-city sweep), `ingest_stats.yml`
  (monthly + `workflow_dispatch` NCRB CSV ingest), `ingest.yml` (weekly
  absconder refresh for 5 cities), and `deploy.yml` (push-to-main static
  export to GitHub Pages).
- **City onboarding tooling** — `scripts/add_city.mjs` validates the ward
  GeoJSON, registers the city in the manifest, stubs the four data JSON
  files, generates the ward seed, and re-runs codegen.
- **NCRB ingest tooling** — `scripts/ingest_ncrb.mjs` for megacity and
  state-capital CSV tables.
- **Mobile UX pass** — larger tap targets, iOS niceties, visible toggle
  labels, mobile polish on the news section.
- **City page layout** — map column stretches to fill row height on `lg`;
  map + sidebar capped at ~65vh with the sidebar scrolling internally and
  its scrollbar hidden.
- **Map labels** — strip verbose city prefix; prefer ward name over ESRI
  feature id.
- **README** — rewritten for the current 43-city scope with 7 screenshots.

[Unreleased]: https://github.com/eeman1113/crimeradar/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/eeman1113/crimeradar/releases/tag/v0.1.0
