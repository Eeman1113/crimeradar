"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Newspaper } from "lucide-react";
import posthog from "posthog-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type NewsItem = {
  title: string;
  link: string;
  source?: string | null;
  date?: string | null;
};

type FetchState =
  | { kind: "loading" }
  | { kind: "ok"; items: NewsItem[]; fetchedAt: number }
  | { kind: "error" };

// News proxy. Defaults to the Cloudflare Worker deployed from
// workers/news-proxy/ — see its README for redeploy instructions.
// Override with NEXT_PUBLIC_NEWS_PROXY_URL for local dev / forks
// (e.g. point at https://api.allorigins.win/raw as a no-infra fallback).
//
// Two proxy shapes are auto-detected:
//   - Worker JSON:    `${base}?q=<query>&limit=<n>`  → {items}
//   - Passthrough:    `${base}?url=<encoded target>` → raw RSS
const PROXY_BASE =
  process.env.NEXT_PUBLIC_NEWS_PROXY_URL ??
  "https://crimeradar-news.eeman-majumder.workers.dev";
const PROXY_MODE: "passthrough" | "worker" =
  PROXY_BASE.includes("allorigins") || PROXY_BASE.includes("corsproxy")
    ? "passthrough"
    : "worker";

const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_ITEMS = 4;
const FRESHNESS_MS = 24 * 30 * 86_400_000; // ~24 months

function firstToken(s: string): string {
  return (s.split(/[,\s]+/).find(Boolean) ?? "").trim();
}

function buildQuery(args: {
  cityName: string;
  wardName: string;
  neighborhoods: string;
}): string {
  const distinctive = firstToken(args.neighborhoods) || firstToken(args.wardName);
  const terms =
    "(crime OR arrest OR theft OR robbery OR assault OR molestation OR rape OR kidnap OR murder OR police)";
  return `${distinctive} ${args.cityName} ${terms}`;
}

function buildFetchUrl(args: {
  query: string;
  city: string;
  token: string;
}): string {
  if (PROXY_MODE === "worker") {
    const p = new URLSearchParams({
      q: args.query,
      city: args.city,
      token: args.token,
      limit: String(MAX_ITEMS),
    });
    return `${PROXY_BASE}?${p.toString()}`;
  }
  const rss = `https://news.google.com/rss/search?q=${encodeURIComponent(args.query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  return `${PROXY_BASE}?url=${encodeURIComponent(rss)}`;
}

function parseRSS(xml: string): NewsItem[] {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xml, "application/xml");
  } catch {
    return [];
  }
  if (doc.querySelector("parsererror")) return [];
  return Array.from(doc.querySelectorAll("item")).map((node) => {
    const titleRaw = node.querySelector("title")?.textContent?.trim() ?? "";
    const link = node.querySelector("link")?.textContent?.trim() ?? "";
    const pubDate = node.querySelector("pubDate")?.textContent?.trim() ?? "";
    const sourceTag = node.querySelector("source")?.textContent?.trim() ?? "";
    // Google News appends " - PublisherName" to titles when no <source> tag.
    const tail = titleRaw.match(/^(.+?)\s+-\s+([^-]+)$/);
    const title = tail ? tail[1].trim() : titleRaw;
    const source = sourceTag || (tail ? tail[2].trim() : "");
    const dateMs = pubDate ? Date.parse(pubDate) : NaN;
    return {
      title,
      link,
      source,
      date: Number.isFinite(dateMs) ? new Date(dateMs).toISOString() : null,
    };
  });
}

function filterAndCap(items: NewsItem[]): NewsItem[] {
  // Trust the Worker's two-pass scoring + freshness filter. Client only
  // dedupes by link and caps. Dropping the crime regex here lets the
  // fallback "wider net" query actually reach the UI when the strict
  // crime-tagged query returns nothing (common for smaller ward names).
  const cutoff = Date.now() - FRESHNESS_MS;
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    if (!it.title || !it.link) continue;
    if (it.date && Date.parse(it.date) < cutoff) continue;
    if (seen.has(it.link)) continue;
    seen.add(it.link);
    out.push(it);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

function relativeTime(ms: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

function readCache(key: string): { items: NewsItem[]; fetchedAt: number } | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.fetchedAt !== "number") return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    if (!Array.isArray(parsed.items)) return null;
    return { items: parsed.items, fetchedAt: parsed.fetchedAt };
  } catch {
    return null;
  }
}

function writeCache(key: string, payload: { items: NewsItem[]; fetchedAt: number }) {
  try {
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export default function RealtimeNewsSection({
  city,
  cityName,
  wardId,
  wardName,
  neighborhoods,
}: {
  city: string;
  cityName: string;
  wardId: string;
  wardName: string;
  neighborhoods: string;
}) {
  const query = useMemo(
    () => buildQuery({ cityName, wardName, neighborhoods }),
    [cityName, wardName, neighborhoods],
  );
  const wardToken = useMemo(
    () => firstToken(neighborhoods) || firstToken(wardName),
    [neighborhoods, wardName],
  );
  const cacheKey = `crimeradar.news.live.${query}`;

  const [state, setState] = useState<FetchState>({ kind: "loading" });
  const [, setTick] = useState(0); // forces relative-time re-render
  const aborted = useRef(false);

  useEffect(() => {
    if (state.kind !== "ok") return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [state.kind]);

  useEffect(() => {
    aborted.current = false;

    const cached = readCache(cacheKey);
    if (cached) {
      setState({
        kind: "ok",
        items: cached.items.slice(0, MAX_ITEMS),
        fetchedAt: cached.fetchedAt,
      });
      return;
    }

    setState({ kind: "loading" });

    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

    fetch(
      buildFetchUrl({ query, city, token: wardToken }),
      { signal: ctrl.signal },
    )
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        if (PROXY_MODE === "worker") {
          const data: { items?: NewsItem[] } = await r.json();
          return Array.isArray(data?.items) ? data.items : [];
        }
        const xml = await r.text();
        return parseRSS(xml);
      })
      .then((rawItems) => {
        if (aborted.current) return;
        const items = filterAndCap(rawItems);
        const payload = { items, fetchedAt: Date.now() };
        writeCache(cacheKey, payload);
        setState({ kind: "ok", ...payload });
      })
      .catch(() => {
        if (aborted.current) return;
        setState({ kind: "error" });
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      aborted.current = true;
      ctrl.abort();
      clearTimeout(timeoutId);
    };
  }, [cacheKey, query]);

  // Hide silently on error or zero items — fall back to the cached
  // "What to watch for" block above this one.
  if (state.kind === "error") return null;
  if (state.kind === "ok" && state.items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <CardTitle className="text-base flex items-center gap-1.5">
            <Newspaper className="h-4 w-4 text-emerald-500 shrink-0" />
            Live news
          </CardTitle>
          {state.kind === "ok" ? (
            <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
              updated {relativeTime(state.fetchedAt)}
            </span>
          ) : null}
        </div>
        <CardDescription className="text-xs text-pretty">
          {state.kind === "loading"
            ? `Fetching recent headlines around ${firstToken(neighborhoods) || wardName}…`
            : `Latest crime-related stories matching “${firstToken(neighborhoods) || wardName}, ${cityName}.”`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.kind === "loading" ? (
          <ul className="flex flex-col gap-2" aria-busy>
            {[0, 1, 2, 3].map((i) => (
              <li
                key={i}
                className="rounded-md border bg-card p-3 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="space-y-2 animate-pulse">
                  <div className="h-3.5 rounded bg-muted/70 w-[88%]" />
                  <div className="h-3 rounded bg-muted/60 w-[62%]" />
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="h-2.5 rounded bg-muted/50 w-16" />
                    <div className="h-2.5 rounded bg-muted/50 w-20" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.items.map((item, i) => (
              <li
                key={item.link}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-md border bg-card p-3 text-sm hover:bg-accent hover:border-foreground/20 active:scale-[0.99] active:bg-accent/70 transition-[background-color,border-color,transform] duration-200 touch-manipulation"
                  onClick={() =>
                    posthog.capture("realtime_news_clicked", {
                      city,
                      ward_id: wardId,
                      source: item.source ?? null,
                      url: item.link,
                    })
                  }
                >
                  <p className="font-medium leading-snug text-pretty">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    {item.source ? (
                      <span className="truncate max-w-[60%]">
                        {item.source}
                      </span>
                    ) : null}
                    {item.date ? (
                      <span className="tabular-nums">
                        {item.source ? "·" : null}{" "}
                        {new Date(item.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    ) : null}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-auto shrink-0 opacity-50 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200"
                      aria-hidden
                    >
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
