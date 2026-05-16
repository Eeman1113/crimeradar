/**
 * News source registry.
 *
 * Single source of truth for where ward-level crime news is pulled from.
 * Scrapers are intentionally NOT wired here — this file only declares which
 * outlets we want to cover, in which languages, and for which cities.
 *
 * When adding a new outlet:
 *   - Prefer official RSS over scraping HTML.
 *   - Fill `coverageCities` with city slugs that exist under data/cities/<slug>.
 *   - Keep `license` honest; "tos:<url>" is acceptable while we audit.
 *
 * TODO(news): Real RSS URLs for most Indian-language outlets need to be
 * confirmed by the data team before we point a scraper at them. Entries with
 * `rssUrl: null` are placeholders so downstream code can enumerate the
 * registry without crashing.
 */

export type NewsLanguage =
  | 'en'
  | 'hi'
  | 'bn'
  | 'ta'
  | 'te'
  | 'mr'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'pa'
  | 'or'
  | 'as'
  | 'ur';

export interface NewsSource {
  /** Stable slug used as a primary key in caches and joins. */
  id: string;
  /** Human-readable outlet name. */
  name: string;
  /** ISO 639-1 code for the outlet's primary publishing language. */
  language: NewsLanguage;
  /** Canonical RSS feed URL, or `null` when not yet confirmed. */
  rssUrl?: string | null;
  /** Optional URL template / regex for HTML scraping fallback. */
  htmlPattern?: string | null;
  /** City slugs (matching data/cities/<slug>) this outlet covers meaningfully. */
  coverageCities: string[];
  /** License or usage-rights summary. Use "tos:<url>" if only ToS applies. */
  license: string;
}

export const NEWS_SOURCES: NewsSource[] = [
  // --- English aggregator currently in production ---
  {
    id: 'google_news_en',
    name: 'Google News (English)',
    language: 'en',
    // Used as a per-ward search; final URL is assembled at scrape time with
    // the ward query, e.g. https://news.google.com/rss/search?q=<query>&hl=en-IN
    rssUrl: 'https://news.google.com/rss/search',
    coverageCities: ['*'],
    license: 'tos:https://news.google.com/intl/en/about/copyright.html',
  },

  // --- Tamil ---
  {
    id: 'dinamalar',
    name: 'Dinamalar',
    language: 'ta',
    // TODO(news): confirm category-specific RSS for crime/city desks.
    rssUrl: 'https://www.dinamalar.com/rss.xml',
    coverageCities: ['chennai', 'coimbatore'],
    license: 'tos:https://www.dinamalar.com/',
  },
  {
    id: 'dinathanthi',
    name: 'Daily Thanthi (Dinathanthi)',
    language: 'ta',
    // TODO(news): Dinathanthi does not appear to publish a public RSS feed;
    // confirm with editorial or fall back to HTML scrape.
    rssUrl: null,
    htmlPattern: 'https://www.dailythanthi.com/News/{city}',
    coverageCities: ['chennai', 'coimbatore'],
    license: 'tos:https://www.dailythanthi.com/',
  },

  // --- Hindi ---
  {
    id: 'dainik_bhaskar',
    name: 'Dainik Bhaskar',
    language: 'hi',
    // TODO(news): Bhaskar exposes per-state RSS; pick the city's state feed
    // when wiring the scraper. Root listing kept here for discovery.
    rssUrl: 'https://www.bhaskar.com/rss-v1--category-1061.xml',
    coverageCities: [
      'delhi',
      'jaipur',
      'bhopal',
      'indore',
      'lucknow',
      'kanpur',
      'patna',
      'raipur',
      'ranchi',
      'chandigarh',
      'gurugram',
      'noida',
    ],
    license: 'tos:https://www.bhaskar.com/',
  },
  {
    id: 'dainik_jagran',
    name: 'Dainik Jagran',
    language: 'hi',
    rssUrl: 'https://www.jagran.com/rss/news/national.xml',
    coverageCities: [
      'delhi',
      'lucknow',
      'kanpur',
      'patna',
      'ranchi',
      'noida',
      'gurugram',
      'dehradun',
    ],
    license: 'tos:https://www.jagran.com/',
  },

  // --- Bengali ---
  {
    id: 'anandabazar_patrika',
    name: 'Anandabazar Patrika',
    language: 'bn',
    // TODO(news): ABP previously offered RSS at /rssfeed/* — verify still live.
    rssUrl: 'https://www.anandabazar.com/rssfeeds/1-rss.xml',
    coverageCities: ['kolkata'],
    license: 'tos:https://www.anandabazar.com/',
  },

  // --- Telugu ---
  {
    id: 'eenadu',
    name: 'Eenadu',
    language: 'te',
    // TODO(news): no canonical RSS; will need HTML scrape per district page.
    rssUrl: null,
    htmlPattern: 'https://www.eenadu.net/telugu-news/ap-top-news',
    coverageCities: ['hyderabad', 'amaravati'],
    license: 'tos:https://www.eenadu.net/',
  },
  {
    id: 'sakshi',
    name: 'Sakshi',
    language: 'te',
    // TODO(news): confirm RSS — Sakshi has published feeds historically but
    // they move; treat as best-effort until validated.
    rssUrl: 'https://www.sakshi.com/rss.xml',
    coverageCities: ['hyderabad', 'amaravati'],
    license: 'tos:https://www.sakshi.com/',
  },

  // --- Marathi ---
  {
    id: 'daily_pakshik',
    name: 'Daily Pakshik',
    language: 'mr',
    // TODO(news): outlet listed by Lakshmi/Sara — locate official RSS or
    // sitemap; placeholder kept so the id is reserved.
    rssUrl: null,
    coverageCities: ['mumbai', 'pune', 'nagpur'],
    license: 'tos:tbd',
  },
  {
    id: 'lokmat',
    name: 'Lokmat',
    language: 'mr',
    rssUrl: 'https://www.lokmat.com/rss/mumbai.xml',
    coverageCities: ['mumbai', 'pune', 'nagpur'],
    license: 'tos:https://www.lokmat.com/',
  },

  // --- Gujarati ---
  {
    id: 'mid_day_gujarati',
    name: 'Mid-Day Gujarati',
    language: 'gu',
    // TODO(news): Mid-Day's Gujarati edition RSS URL needs confirmation;
    // English edition feed exists but is out of scope here.
    rssUrl: null,
    htmlPattern: 'https://www.gujaratimidday.com/news/{city}-news',
    coverageCities: ['ahmedabad', 'surat', 'gandhinagar', 'mumbai'],
    license: 'tos:https://www.gujaratimidday.com/',
  },

  // --- Malayalam ---
  {
    id: 'mathrubhumi',
    name: 'Mathrubhumi',
    language: 'ml',
    rssUrl: 'https://www.mathrubhumi.com/api/v1/feeds/rss/news',
    coverageCities: ['kochi', 'thiruvananthapuram'],
    license: 'tos:https://www.mathrubhumi.com/',
  },

  // --- Kannada ---
  {
    id: 'vijay_karnataka',
    name: 'Vijay Karnataka',
    language: 'kn',
    rssUrl: 'https://vijaykarnataka.com/rssfeedsdefault.cms',
    coverageCities: ['bangalore'],
    license: 'tos:https://vijaykarnataka.com/',
  },
];
