import { SEEDS, STATS_JSON, HISTORY_JSON, NEWS_JSON, type WardSeed } from "./wards.generated";

import { normalizeScores, rawScore, rawWomenScore } from "./risk";
import { absconderFileSources } from "./absconders";
import {
  CRIME_CATEGORY_LABELS,
  type CrimeBreakdown,
  type CrimeCategory,
  type DataQuality,
  type Ward,
} from "./types";
import type { CityId } from "./cities";

type WardSeedFile = WardSeed[];

type MonthlyStats = {
  source: string | null;
  indexUrl?: string;
  publishedFor: { year: number; month?: number } | null;
  windowKind?: "ytd" | "month" | "year";
  scrapedAt: string | null;
  cityWideYtdTotals: Partial<Record<CrimeCategory, number>>;
  notes?: string;
};

const STATS = STATS_JSON as Record<CityId, MonthlyStats>;

const FALLBACK_SEEDED_AT = "2026-05-15";

const CATS: CrimeCategory[] = [
  "theft",
  "robbery",
  "assault",
  "sexual_offence",
  "harassment",
  "kidnapping",
  "burglary",
  "other",
];

function calibrate(
  seed: WardSeedFile,
  stats: MonthlyStats | undefined,
): { breakdowns: CrimeBreakdown[]; quality: DataQuality } {
  const totals = stats?.cityWideYtdTotals ?? {};
  const seedTotalsByCat: Partial<Record<CrimeCategory, number>> = {};
  for (const cat of CATS) {
    seedTotalsByCat[cat] = seed.reduce(
      (acc, w) => acc + (w.breakdown[cat] ?? 0),
      0,
    );
  }
  const scale: Partial<Record<CrimeCategory, number>> = {};
  let calibratedAny = false;
  for (const cat of CATS) {
    const real = totals[cat];
    const seedSum = seedTotalsByCat[cat] ?? 0;
    if (real != null && seedSum > 0) {
      scale[cat] = real / seedSum;
      calibratedAny = true;
    } else {
      scale[cat] = 1;
    }
  }
  const breakdowns = seed.map((w) => {
    const out: CrimeBreakdown = {};
    for (const cat of CATS) {
      const s = scale[cat] ?? 1;
      out[cat] = Math.round((w.breakdown[cat] ?? 0) * s);
    }
    return out;
  });
  return {
    breakdowns,
    quality: calibratedAny ? "calibrated" : "seeded",
  };
}

function buildWardsFor(city: CityId): Ward[] {
  const seed = SEEDS[city];
  if (seed.length === 0) return [];
  const stats = STATS[city];
  const { breakdowns, quality } = calibrate(seed, stats);
  const popPerK = seed.map((w) => w.population / 1000);
  const rawsDay = breakdowns.map((b, i) => rawScore(b, popPerK[i], false));
  const rawsNight = breakdowns.map((b, i) => rawScore(b, popPerK[i], true));
  const rawsWomenDay = breakdowns.map((b, i) =>
    rawWomenScore(b, popPerK[i], false),
  );
  const rawsWomenNight = breakdowns.map((b, i) =>
    rawWomenScore(b, popPerK[i], true),
  );
  const day = normalizeScores(rawsDay);
  const night = normalizeScores(rawsNight);
  const womenDay = normalizeScores(rawsWomenDay);
  const womenNight = normalizeScores(rawsWomenNight);
  return seed.map((w, i) => ({
    id: w.id,
    name: w.name,
    neighborhoods: w.neighborhoods,
    population: w.population,
    breakdown: breakdowns[i],
    topConcerns: w.topConcerns,
    riskScore: day[i],
    riskScoreNight: night[i],
    riskScoreWomen: womenDay[i],
    riskScoreWomenNight: womenNight[i],
    dataQuality: quality,
  }));
}

const WARDS_BY_CITY: Record<CityId, Ward[]> = Object.fromEntries(
  CITY_IDS.map((id) => [id, buildWardsFor(id)]),
) as Record<CityId, Ward[]>;

const WARD_INDEX: Record<CityId, Map<string, Ward>> = Object.fromEntries(
  (Object.keys(WARDS_BY_CITY) as CityId[]).map((c) => [
    c,
    new Map(WARDS_BY_CITY[c].map((w) => [w.id, w])),
  ]),
) as Record<CityId, Map<string, Ward>>;

export function listWards(city: CityId): Ward[] {
  return WARDS_BY_CITY[city] ?? [];
}

export function getWard(city: CityId, id: string): Ward | undefined {
  return WARD_INDEX[city]?.get(id);
}

// URL slug for a ward id. Ward IDs can contain slashes ("M/E"), spaces
// ("Kempegowda Ward"), parens, etc. We normalise to lowercase ascii with
// dashes, and keep a per-city reverse map so the static export round-trips.
export function wardSlug(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_INDEX: Record<CityId, Map<string, Ward>> = Object.fromEntries(
  (Object.keys(WARDS_BY_CITY) as CityId[]).map((c) => {
    const m = new Map<string, Ward>();
    for (const w of WARDS_BY_CITY[c]) {
      m.set(wardSlug(w.id), w);
    }
    return [c, m];
  }),
) as Record<CityId, Map<string, Ward>>;

export function wardFromSlug(city: CityId, slug: string): Ward | undefined {
  return SLUG_INDEX[city]?.get(slug);
}

export function dataSeededAt(city: CityId): string {
  return (
    STATS[city]?.scrapedAt?.slice(0, 10) ?? FALLBACK_SEEDED_AT
  );
}

export function monthlyStatsMeta(city: CityId) {
  const s = STATS[city];
  return {
    source: s?.source ?? null,
    publishedFor: s?.publishedFor ?? null,
    windowKind: s?.windowKind ?? "ytd",
    scrapedAt: s?.scrapedAt ?? null,
    totals: s?.cityWideYtdTotals ?? {},
  };
}

type MonthHistoryEntry = {
  year: number;
  month: number;
  pdfId?: string;
  source?: string;
  currentMonth: Partial<Record<CrimeCategory, number | null>>;
  ytd: Partial<Record<CrimeCategory, number | null>>;
};
type HistoryFile = {
  source: string | null;
  scrapedAt: string | null;
  count: number;
  months: MonthHistoryEntry[];
  notes?: string;
};

const HISTORIES = HISTORY_JSON as Record<CityId, HistoryFile>;

export type SearchIndexEntry = {
  city: CityId;
  cityName: string;
  wardId: string;
  wardSlug: string;
  name: string;
  neighborhoods: string;
  score: number;
  scoreNight: number;
  scoreWomen: number;
};

const SEARCH_INDEX: SearchIndexEntry[] = (
  Object.keys(WARDS_BY_CITY) as CityId[]
).flatMap((c) =>
  WARDS_BY_CITY[c].map((w) => ({
    city: c,
    cityName: c.charAt(0).toUpperCase() + c.slice(1),
    wardId: w.id,
    wardSlug: w.id.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase(),
    name: w.name,
    neighborhoods: w.neighborhoods,
    score: w.riskScore,
    scoreNight: w.riskScoreNight,
    scoreWomen: w.riskScoreWomen,
  })),
);

export function searchWards(query: string, limit = 12): SearchIndexEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEARCH_INDEX.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.neighborhoods.toLowerCase().includes(q) ||
      e.cityName.toLowerCase().includes(q),
  ).slice(0, limit);
}

export type CitySearchHit = { id: CityId; name: string; state: string };

import { CITIES, CITY_IDS } from "./cities";

export function searchCities(query: string, limit = 12): CitySearchHit[] {
  const q = query.trim().toLowerCase();
  const all: CitySearchHit[] = CITY_IDS.map((id) => ({
    id,
    name: CITIES[id].name,
    state: CITIES[id].state,
  }));
  if (!q) return all.slice(0, limit);
  return all
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export type NewsItem = {
  title: string;
  link: string;
  date: string | null;
  source: string;
};
type WardNewsEntry = {
  cachedAt: string;
  query: string;
  items: NewsItem[];
};
type WardNewsFile = {
  source: string;
  scrapedAt: string | null;
  wards: Record<string, WardNewsEntry>;
  notes?: string;
};

const NEWS = NEWS_JSON as Record<CityId, WardNewsFile>;

export function wardNews(city: CityId, wardId: string): NewsItem[] {
  return NEWS[city]?.wards?.[wardId]?.items ?? [];
}

export function wardNewsScrapedAt(city: CityId): string | null {
  return NEWS[city]?.scrapedAt ?? null;
}

export function monthlyHistory(city: CityId): MonthHistoryEntry[] {
  return HISTORIES[city]?.months ?? [];
}

export function historyMeta(city: CityId) {
  const h = HISTORIES[city];
  return {
    source: h?.source ?? null,
    scrapedAt: h?.scrapedAt ?? null,
    count: h?.count ?? 0,
  };
}

export function cityDataQuality(city: CityId): DataQuality | "empty" {
  const ws = WARDS_BY_CITY[city];
  if (!ws || ws.length === 0) return "empty";
  return ws[0].dataQuality;
}

export type DynamicConcern = {
  text: string;
  detail?: string;
};

export function dynamicWardConcerns(
  city: CityId,
  ward: Ward,
): DynamicConcern[] {
  const out: DynamicConcern[] = [];
  const entries = (Object.entries(ward.breakdown) as [CrimeCategory, number][])
    .filter(([, v]) => (v ?? 0) > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);

  if (total === 0) {
    out.push({
      text: "No category-level incident data available for this ward yet.",
    });
    return out;
  }

  const popK = Math.max(ward.population / 1000, 1);
  const fmt = (n: number) => n.toLocaleString("en-IN");

  const [topCat, topVal] = entries[0];
  const topPct = Math.round((topVal / total) * 100);
  out.push({
    text: `${CRIME_CATEGORY_LABELS[topCat]} drives ${topPct}% of reported incidents`,
    detail: `${fmt(topVal)} of ${fmt(total)} cases (YTD)`,
  });

  if (entries.length > 1 && entries[1][1] > 0) {
    const [secCat, secVal] = entries[1];
    const secPct = Math.round((secVal / total) * 100);
    out.push({
      text: `${CRIME_CATEGORY_LABELS[secCat]} is next at ${secPct}%`,
      detail: `${fmt(secVal)} cases`,
    });
  }

  const cityWards = WARDS_BY_CITY[city] ?? [];
  if (cityWards.length > 1) {
    const ranked = [...cityWards].sort((a, b) => b.riskScore - a.riskScore);
    const rank = ranked.findIndex((w) => w.id === ward.id) + 1;
    if (rank > 0) {
      out.push({
        text: `Daytime risk ranks #${rank} of ${cityWards.length} in ${
          city.charAt(0).toUpperCase() + city.slice(1)
        }`,
        detail: `Score ${ward.riskScore}/100`,
      });
    }
  }

  const rate = total / popK;
  out.push({
    text: `≈ ${rate.toFixed(1)} reported incidents per 1,000 residents`,
    detail: `Population ≈ ${fmt(ward.population)}`,
  });

  const nightDelta = ward.riskScoreNight - ward.riskScore;
  if (nightDelta >= 5) {
    const nightCats = (
      Object.entries(ward.breakdown) as [CrimeCategory, number][]
    )
      .filter(
        ([c, v]) =>
          (v ?? 0) > 0 &&
          (c === "sexual_offence" ||
            c === "assault" ||
            c === "robbery" ||
            c === "harassment"),
      )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([c]) => CRIME_CATEGORY_LABELS[c].toLowerCase());
    out.push({
      text: `Night-time risk is ${nightDelta} points higher than daytime`,
      detail: nightCats.length
        ? `Most night-weighted: ${nightCats.join(", ")}`
        : undefined,
    });
  }

  const womenDelta = ward.riskScoreWomen - ward.riskScore;
  if (womenDelta >= 5) {
    const harass = ward.breakdown.harassment ?? 0;
    const sex = ward.breakdown.sexual_offence ?? 0;
    out.push({
      text: `Women's safety score is ${womenDelta} points higher than the general score`,
      detail: `${fmt(harass)} harassment + ${fmt(sex)} sexual offence cases`,
    });
  }

  return out;
}

// Hand-curated additional sources that aren't captured in the per-city JSON
// `source` fields — these are upstream of the JSONs (e.g. the GeoJSON repos
// we pulled ward boundaries from). Listed here so they get counted in the
// methodology page's "sources cited" tag.
const ADDITIONAL_SOURCES: string[] = [
  "https://github.com/datameet/Municipal_Spatial_Data",
  "https://data.opencity.in/dataset/gurugram-wards-map",
];

export function dataSourcesSummary(): {
  urls: number;
  domains: number;
  cities: number;
} {
  const urls = new Set<string>();
  const domains = new Set<string>();

  const addUrl = (raw: string | null | undefined) => {
    if (!raw || typeof raw !== "string") return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    urls.add(trimmed);
    try {
      const host = new URL(trimmed).hostname.toLowerCase().replace(/^www\./, "");
      if (host) domains.add(host);
    } catch {
      // non-URL strings (e.g. "GBN Police press releases via @noidapolice")
      // still count as a unique source string, just not toward domain count.
    }
  };

  const cityIds = Object.keys(WARDS_BY_CITY) as CityId[];
  for (const c of cityIds) {
    const s = STATS[c];
    addUrl(s?.source);
    addUrl(s?.indexUrl);

    const h = HISTORIES[c];
    addUrl(h?.source);
    for (const m of h?.months ?? []) {
      addUrl(m.source);
    }

    const n = NEWS[c];
    addUrl(n?.source);
  }

  for (const u of absconderFileSources()) addUrl(u);
  for (const u of ADDITIONAL_SOURCES) addUrl(u);

  return { urls: urls.size, domains: domains.size, cities: cityIds.length };
}
