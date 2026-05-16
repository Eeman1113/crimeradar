// Cloudflare Worker — fetches Google News RSS and re-emits as CORS-enabled
// JSON for client-side consumption from eeman1113.github.io/crimeradar/.
//
// Endpoint:  GET https://crimeradar-news.workers.dev?q=<encoded>&limit=<n>
// Response:  { items: [{ title, link, source, date }] }
//
// Deploy:    cd workers/news-proxy && npx wrangler deploy
//
// Caching:   Cloudflare's edge cache holds successful responses for 10 min
//            via the Cache-Control header. Keeps Google News load light
//            even if many users hit the same ward at once.

export interface Env {}

const ALLOWED_ORIGINS = new Set([
  "https://eeman1113.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

// Soft tag — items that pass this get prioritised, but we no longer
// gate on it. Google News's own ranking + our query suffix already does
// most of the relevance work; gating an extra regex on top kills
// otherwise-useful headlines that just happen to not include one of
// these literal tokens.
const CRIME_TAGS =
  /\b(crime|arrest|theft|robber|burglar|assault|molest|rape|kidnap|murder|police|stab|sexual|harass|stalk|chain.?snatch|fraud|scam|attack|killed|raid|booked|fir)/i;
const MAX_AGE_MS = 24 * 30 * 86_400_000; // ~24 months — wider net
const MAX_ITEMS_HARD_CAP = 8;

function corsHeaders(origin: string | null): HeadersInit {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://eeman1113.github.io";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=600, s-maxage=600",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

function pick(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return "";
  return decodeEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function parseRSS(xml: string): Array<{ title: string; link: string; source: string; date: string | null }> {
  const items: Array<{ title: string; link: string; source: string; date: string | null }> = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const title = pick(block, "title");
    const link = pick(block, "link");
    const pub = pick(block, "pubDate");
    // Google News RSS includes the publisher inside <source>; some entries
    // pack it after " - " in the title. Prefer the explicit <source> tag.
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const sourceFromTag = sourceMatch ? decodeEntities(sourceMatch[1]).trim() : "";
    const tail = title.match(/ - ([^-]+)$/);
    const sourceFromTitle = tail ? tail[1].trim() : "";
    const source = sourceFromTag || sourceFromTitle || "";
    const cleanTitle = sourceFromTitle ? title.replace(/ - [^-]+$/, "").trim() : title;
    const dateMs = pub ? Date.parse(pub) : NaN;
    items.push({
      title: cleanTitle,
      link,
      source,
      date: Number.isFinite(dateMs) ? new Date(dateMs).toISOString() : null,
    });
  }
  return items;
}

async function handle(request: Request): Promise<Response> {
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: corsHeaders(origin),
    });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(
    MAX_ITEMS_HARD_CAP,
    Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "4", 10) || 4),
  );
  if (!q || q.length > 200) {
    return new Response(JSON.stringify({ error: "bad_query" }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  // Strip a trailing literal-OR clause if the client included one — we'll
  // re-add a leaner version below. Lets old + new clients share one Worker.
  const baseQuery = q.replace(/\s*\([^)]*\)\s*$/, "").trim();

  async function fetchRss(query: string): Promise<Array<ReturnType<typeof parseRSS>[number]>> {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CrimeRadarBot/1.0; +https://eeman1113.github.io/crimeradar/)",
        Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.5",
      },
      cf: { cacheTtl: 600, cacheEverything: true },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    return parseRSS(await res.text());
  }

  function process(items: ReturnType<typeof parseRSS>) {
    const now = Date.now();
    return items
      .filter((it) => it.title && it.link)
      .filter((it) => {
        if (!it.date) return true;
        return now - Date.parse(it.date) < MAX_AGE_MS;
      })
      .reduce<typeof items>((acc, it) => {
        if (!acc.some((x) => x.link === it.link)) acc.push(it);
        return acc;
      }, [])
      // Crime-tagged items first, then everything else by recency.
      .sort((a, b) => {
        const aT = CRIME_TAGS.test(a.title) ? 1 : 0;
        const bT = CRIME_TAGS.test(b.title) ? 1 : 0;
        if (aT !== bT) return bT - aT;
        const aD = a.date ? Date.parse(a.date) : 0;
        const bD = b.date ? Date.parse(b.date) : 0;
        return bD - aD;
      })
      .slice(0, limit);
  }

  // Two-pass: nudge toward crime first, then plain "<token> <city>".
  // The plain pass surfaces something for sleepy small-town wards where
  // the crime-tagged query returns nothing.
  let primary: ReturnType<typeof parseRSS> = [];
  try {
    primary = await fetchRss(
      `${baseQuery} (crime OR arrest OR police OR fir OR theft OR rape OR murder OR molest OR kidnap OR robber OR assault OR accident)`,
    );
  } catch {
    /* fall through to the broad query */
  }

  let processed = process(primary);
  if (processed.length === 0) {
    try {
      const fallback = await fetchRss(baseQuery);
      processed = process(fallback);
    } catch {
      /* swallow and return [] */
    }
  }

  return new Response(JSON.stringify({ items: processed }), {
    status: 200,
    headers: corsHeaders(origin),
  });
}

export default {
  fetch: handle,
} satisfies ExportedHandler<Env>;
