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

const PROXY_BASE =
  process.env.NEXT_PUBLIC_NEWS_PROXY_URL ??
  "https://crimeradar-news.workers.dev";
const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_ITEMS = 4;

// First distinctive token of the ward's neighbourhood string (falls back to
// the ward name). Matches scripts/ingest_ward_news.mjs's query logic so the
// realtime fetch surfaces the same kind of articles the weekly cron does.
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
  const cacheKey = `crimeradar.news.live.${query}`;

  const [state, setState] = useState<FetchState>({ kind: "loading" });
  const [, setTick] = useState(0); // forces relative-time re-render
  const aborted = useRef(false);

  // Re-render the "X min ago" label every 30 seconds without re-fetching.
  useEffect(() => {
    if (state.kind !== "ok") return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [state.kind]);

  useEffect(() => {
    aborted.current = false;

    // 1) Warm cache hit — skip the network entirely.
    const cached = readCache(cacheKey);
    if (cached) {
      setState({ kind: "ok", items: cached.items.slice(0, MAX_ITEMS), fetchedAt: cached.fetchedAt });
      return;
    }

    setState({ kind: "loading" });

    // 2) Live fetch with an abort + soft timeout.
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

    const url = `${PROXY_BASE}?q=${encodeURIComponent(query)}&limit=${MAX_ITEMS}`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { items?: NewsItem[] }) => {
        if (aborted.current) return;
        const items = Array.isArray(data?.items) ? data.items.slice(0, MAX_ITEMS) : [];
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
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-1.5">
            <Newspaper className="h-4 w-4 text-emerald-500" />
            Live news
            <span className="relative ml-1 inline-flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          </CardTitle>
          {state.kind === "ok" ? (
            <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap mt-0.5">
              updated {relativeTime(state.fetchedAt)}
            </span>
          ) : null}
        </div>
        <CardDescription className="text-xs">
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
                  className="group block rounded-md border bg-card p-3 text-sm hover:bg-accent hover:border-foreground/20 transition-[background-color,border-color] duration-200"
                  onClick={() =>
                    posthog.capture("realtime_news_clicked", {
                      city,
                      ward_id: wardId,
                      source: item.source ?? null,
                      url: item.link,
                    })
                  }
                >
                  <p className="font-medium leading-snug">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                    {item.source ? <span>{item.source}</span> : null}
                    {item.date ? (
                      <span>
                        {item.source ? " · " : null}
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
                      className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity duration-200"
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
