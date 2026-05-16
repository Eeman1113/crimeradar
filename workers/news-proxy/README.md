# crimeradar-news (Cloudflare Worker)

Tiny CORS-enabled proxy that lets the static GH Pages site fetch
Google News RSS at runtime. Powers `<RealtimeNewsSection>` on the
ward detail page.

## Endpoint

```
GET https://crimeradar-news.workers.dev?q=<encoded query>&limit=<1..8>
→ { "items": [{ "title", "link", "source", "date" }] }
```

The client never hits `news.google.com` directly — the browser would
block it with a CORS error. The Worker fetches server-side, parses
the RSS, filters for crime terms (same regex as the weekly cron in
`scripts/ingest_ward_news.mjs`), drops items older than 18 months,
and returns JSON with `Access-Control-Allow-Origin` set to the GH
Pages site (or localhost during dev).

## Deploy

```bash
cd workers/news-proxy
npx wrangler login          # one-time
npx wrangler deploy
```

Wrangler will create the worker on its first deploy and pin it to
the URL above. No DB, no KV, no secrets — pure edge fetch + parse.

## Edge cache

Successful upstream responses are cached at the Cloudflare edge for
10 minutes (`cf.cacheTtl: 600`), so a popular ward (e.g. Mumbai's
Andheri) shared across many users only hits Google News once every
10 minutes. The client also caches in `sessionStorage` for 15
minutes to avoid re-fetching on navigation.

## Cost

Cloudflare Workers free tier: 100,000 requests/day. With both cache
layers active the site can serve well over a million ward-page
views/day on the free tier.

## When the Worker is down

`<RealtimeNewsSection>` swallows network failures silently and
unmounts itself — the existing cached "What to watch for" block
above it stays as the user-visible fallback. No scary error UI.
