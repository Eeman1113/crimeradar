"use client";

// Address / landmark search box that hits Nominatim, biased to the active
// city's bounding box. Emits {lat, lng, label} on select — the caller decides
// what to do next (typically: point-in-polygon to find the ward).
//
// Re-exports findWardAtLatLng from lib/locate so existing imports targeted
// at this module also work; new code should prefer importing from lib/locate.

import { LoaderCircle, MapPin, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { getCity, type CityId } from "@/lib/cities";

export { findWardAtLatLng } from "@/lib/locate";
export type { WardFeatureCollection, WardHit } from "@/lib/locate";

const DEBOUNCE_MS = 300;
// Nominatim ToS: max 1 request per second per IP. We enforce a soft floor
// in addition to the input debounce in case the user keeps typing past 300ms.
const MIN_INTERVAL_MS = 1000;
const MAX_RESULTS = 8;

export type AddressSearchHit = {
  lat: number;
  lng: number;
  label: string;
};

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
};

export type AddressSearchProps = {
  cityId: CityId;
  onSelect: (hit: AddressSearchHit) => void;
  placeholder?: string;
  className?: string;
  // Optional: override input id (used to wire up an external <label>).
  inputId?: string;
};

export default function AddressSearch({
  cityId,
  onSelect,
  placeholder,
  className,
  inputId,
}: AddressSearchProps) {
  const city = getCity(cityId);
  const reactId = useId();
  const listboxId = `${reactId}-listbox`;
  const fieldId = inputId ?? `${reactId}-input`;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  // Refs for rate-limit gate, request cancellation, and DOM focus.
  const lastFetchAtRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const viewbox = useMemo(() => {
    if (!city) return null;
    const [[w, s], [e, n]] = city.bounds;
    // Nominatim viewbox is lon,lat,lon,lat in left,top,right,bottom order.
    return `${w},${n},${e},${s}`;
  }, [city]);

  const runSearch = useCallback(
    async (q: string) => {
      if (!viewbox) return;
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastFetchAtRef.current));
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
        if (controller.signal.aborted) return;
      }
      lastFetchAtRef.current = Date.now();

      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", q);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("countrycodes", "in");
      url.searchParams.set("viewbox", viewbox);
      url.searchParams.set("bounded", "1");
      url.searchParams.set("limit", String(MAX_RESULTS));
      url.searchParams.set("addressdetails", "0");
      url.searchParams.set("dedupe", "1");

      setLoading(true);
      setError(null);
      try {
        // NOTE: Browsers forbid setting User-Agent via fetch; Nominatim's ToS
        // is satisfied by the Referer header the browser sends automatically.
        // We pass an Accept-Language hint and a stable App referer comment via
        // the email/x-app params Nominatim recognises.
        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Language": navigator.language || "en",
          },
          signal: controller.signal,
          // No credentials; Nominatim is a public endpoint.
          credentials: "omit",
          referrerPolicy: "strict-origin-when-cross-origin",
        });
        if (!res.ok) throw new Error(`nominatim_http_${res.status}`);
        const data = (await res.json()) as NominatimResult[];
        if (controller.signal.aborted) return;
        setResults(Array.isArray(data) ? data.slice(0, MAX_RESULTS) : []);
        setOpen(true);
        setActiveIdx(data && data.length > 0 ? 0 : -1);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setResults([]);
        setOpen(true);
        setActiveIdx(-1);
        setError("Couldn't reach the address service. Try again in a moment.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [viewbox],
  );

  // Debounce keystrokes -> runSearch.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setLoading(false);
      setError(null);
      setActiveIdx(-1);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(q);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function pick(r: NominatimResult) {
    const hit: AddressSearchHit = {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      label: r.display_name,
    };
    if (Number.isFinite(hit.lat) && Number.isFinite(hit.lng)) {
      onSelect(hit);
      setQuery(shortLabel(r.display_name));
      setOpen(false);
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (open && activeIdx >= 0 && activeIdx < results.length) {
        e.preventDefault();
        pick(results[activeIdx]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActiveIdx(-1);
      }
    }
  }

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIdx(-1);
    setError(null);
    inputRef.current?.focus();
  }

  const showDropdown =
    open &&
    (loading ||
      error !== null ||
      results.length > 0 ||
      query.trim().length >= 3);

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full", className)}
      role="combobox"
      aria-expanded={showDropdown}
      aria-haspopup="listbox"
      aria-owns={listboxId}
    >
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        />
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || query.trim().length >= 3) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={
            placeholder ?? `Search ${city?.name ?? "city"} address or landmark`
          }
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            activeIdx >= 0 ? `${listboxId}-opt-${activeIdx}` : undefined
          }
          className={cn(
            "h-10 w-full rounded-md border border-input bg-background pl-9 pr-9",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        />
        {loading ? (
          <LoaderCircle
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
          />
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear address search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-auto",
            "rounded-md border border-border bg-popover text-popover-foreground shadow-md",
            "py-1 text-sm",
          )}
        >
          {error ? (
            <li
              role="presentation"
              className="px-3 py-2 text-xs text-amber-600 dark:text-amber-400"
            >
              {error}
            </li>
          ) : loading && results.length === 0 ? (
            <li role="presentation" className="px-3 py-2 text-xs text-muted-foreground">
              Searching…
            </li>
          ) : results.length === 0 ? (
            <li role="presentation" className="px-3 py-2 text-xs text-muted-foreground">
              No matches in {city?.name ?? "this city"}.
            </li>
          ) : (
            results.map((r, i) => {
              const primary = shortLabel(r.display_name);
              const secondary = secondaryLabel(r.display_name);
              const active = i === activeIdx;
              return (
                <li
                  key={r.place_id}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={active}
                  // Use mousedown so we beat the input's blur and don't close
                  // the list before the click registers.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(r);
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 px-3 py-2",
                    active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                  )}
                >
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{primary}</span>
                    {secondary ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {secondary}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

// --- helpers ---

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function shortLabel(displayName: string): string {
  const idx = displayName.indexOf(",");
  return idx === -1 ? displayName : displayName.slice(0, idx);
}

function secondaryLabel(displayName: string): string {
  const idx = displayName.indexOf(",");
  if (idx === -1) return "";
  return displayName.slice(idx + 1).trim();
}
