# CrimeRadar

Mumbai ward-level safety map. Estimated risk scores per BMC ward with a
night-time multiplier, plus the Mumbai Police Absconder List republished with
attribution.

**Live data:**

- City-level YTD crime counts from
  [Mumbai Police monthly statistics](https://mumbaipolice.gov.in/CrimeStatistics)
  — refreshed daily.
- Absconder names from the
  [Mumbai Police Absconder List](https://mumbaipolice.gov.in/absconder_list)
  (CrPC §82) — refreshed daily.

**Editorial:** per-ward relative weights (used to apportion the city totals to
each of the 24 wards) are hand-built and documented on `/methodology`.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · MapLibre GL JS ·
@turf/boolean-point-in-polygon · Recharts · pdf-parse (pure-JS).

## Local dev

```bash
npm install
node scripts/ingest_absconders.mjs    # refresh data/absconders.json
node scripts/ingest_monthly_stats.mjs # refresh data/monthly_stats.json
npm run build
npm run start -- -p 3000
```

Open <http://localhost:3000>.

## Data refresh

A GitHub Actions workflow (`.github/workflows/ingest.yml`) runs both ingest
scripts daily at 00:30 UTC and commits the updated JSON. Vercel (if connected)
redeploys automatically on the push.

Manual trigger:

```bash
gh workflow run ingest.yml
```

## Disclaimers

Risk scores are **estimates**, not safety guarantees. See `/legal` for the
naming policy, takedown contact, and DPDP notice. See `/methodology` for the
exact formula, data sources, and limitations.
