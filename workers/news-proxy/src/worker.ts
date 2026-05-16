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

// Per-city HT + TOI section feeds. Both outlets publish slug-based RSS
// per city — we hit them in parallel with Google News and filter to
// items whose title mentions the ward's distinctive token. Cities the
// outlets don't cover (NE/UT capitals, smaller cities) silently fall
// through to Google News-only.
const CITY_FEEDS: Record<string, string[]> = {
  mumbai: [
    "https://www.hindustantimes.com/feeds/rss/cities/mumbai-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/mumbai/rssfeedstopstories.cms",
  ],
  delhi: [
    "https://www.hindustantimes.com/feeds/rss/cities/delhi-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/delhi/rssfeedstopstories.cms",
  ],
  bangalore: [
    "https://www.hindustantimes.com/feeds/rss/cities/bengaluru-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/bengaluru/rssfeedstopstories.cms",
  ],
  chennai: [
    "https://www.hindustantimes.com/feeds/rss/cities/chennai-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/chennai/rssfeedstopstories.cms",
  ],
  kolkata: [
    "https://www.hindustantimes.com/feeds/rss/cities/kolkata-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/kolkata/rssfeedstopstories.cms",
  ],
  hyderabad: [
    "https://www.hindustantimes.com/feeds/rss/cities/hyderabad-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/hyderabad/rssfeedstopstories.cms",
  ],
  pune: [
    "https://www.hindustantimes.com/feeds/rss/cities/pune-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/pune/rssfeedstopstories.cms",
  ],
  ahmedabad: [
    "https://www.hindustantimes.com/feeds/rss/cities/ahmedabad-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/ahmedabad/rssfeedstopstories.cms",
  ],
  gurugram: [
    "https://www.hindustantimes.com/feeds/rss/cities/gurugram-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/gurgaon/rssfeedstopstories.cms",
  ],
  noida: [
    "https://www.hindustantimes.com/feeds/rss/cities/noida-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/noida/rssfeedstopstories.cms",
  ],
  lucknow: [
    "https://www.hindustantimes.com/feeds/rss/cities/lucknow-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/lucknow/rssfeedstopstories.cms",
  ],
  jaipur: [
    "https://www.hindustantimes.com/feeds/rss/cities/jaipur-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/jaipur/rssfeedstopstories.cms",
  ],
  patna: [
    "https://timesofindia.indiatimes.com/city/patna/rssfeedstopstories.cms",
  ],
  bhopal: [
    "https://timesofindia.indiatimes.com/city/bhopal/rssfeedstopstories.cms",
  ],
  bhubaneswar: [
    "https://timesofindia.indiatimes.com/city/bhubaneswar/rssfeedstopstories.cms",
  ],
  chandigarh: [
    "https://www.hindustantimes.com/feeds/rss/cities/chandigarh-news/rssfeed.xml",
    "https://timesofindia.indiatimes.com/city/chandigarh/rssfeedstopstories.cms",
  ],
  indore: [
    "https://timesofindia.indiatimes.com/city/indore/rssfeedstopstories.cms",
  ],
  kanpur: [
    "https://timesofindia.indiatimes.com/city/kanpur/rssfeedstopstories.cms",
  ],
  nagpur: [
    "https://timesofindia.indiatimes.com/city/nagpur/rssfeedstopstories.cms",
  ],
  kochi: [
    "https://timesofindia.indiatimes.com/city/kochi/rssfeedstopstories.cms",
  ],
  thiruvananthapuram: [
    "https://timesofindia.indiatimes.com/city/thiruvananthapuram/rssfeedstopstories.cms",
  ],
  ranchi: [
    "https://timesofindia.indiatimes.com/city/ranchi/rssfeedstopstories.cms",
  ],
  guwahati: [
    "https://timesofindia.indiatimes.com/city/guwahati/rssfeedstopstories.cms",
  ],
};

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
  const cityId = (url.searchParams.get("city") ?? "").trim().toLowerCase();
  const wardToken = (url.searchParams.get("token") ?? "").trim();
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
    return parseRSS(await fetchRaw(url));
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

  // ---- Source 1: Google News (broad + crime-leaning) ----
  const gnewsPromise = fetchRss(
    `${baseQuery} (crime OR arrest OR police OR fir OR theft OR rape OR murder OR molest OR kidnap OR robber OR assault OR accident)`,
  ).catch(() => [] as ReturnType<typeof parseRSS>);

  // ---- Sources 2..n: HT / TOI per-city section feeds ----
  // We pull the whole city feed then filter to items mentioning the ward
  // token (case-insensitive). This catches local stories the Google News
  // search may have missed for a given ward.
  const tokenLc = (wardToken || baseQuery.split(/\s+/)[0] || "").toLowerCase();
  const cityFeeds = (CITY_FEEDS[cityId] ?? []).map((u) =>
    fetchRaw(u)
      .then(parseRSS)
      .then((items) =>
        tokenLc
          ? items.filter((it) => it.title.toLowerCase().includes(tokenLc))
          : items,
      )
      .catch(() => [] as ReturnType<typeof parseRSS>),
  );

  const results = await Promise.all([gnewsPromise, ...cityFeeds]);
  const merged = results.flat();

  let processed = process(merged);

  // Fallback: if nothing turned up, retry Google News with a broad
  // unfiltered query so smaller wards still see *something*.
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

async function fetchRaw(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CrimeRadarBot/1.0; +https://eeman1113.github.io/crimeradar/)",
      Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.5",
    },
    cf: { cacheTtl: 600, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.text();
}

export default {
  fetch: handle,
} satisfies ExportedHandler<Env>;
