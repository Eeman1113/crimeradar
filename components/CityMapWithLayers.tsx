"use client";

// Thin client wrappers that bridge wave-2 components into the server-rendered
// city page. The city page is a Server Component (generateStaticParams +
// async params), so anything that needs React state or function props has to
// live in a "use client" boundary.
//
// Two wrappers are exported here to avoid creating multiple new files:
//   - CityMapWithLayers: owns LayerToggle <-> WardMap overlay state
//   - CityAddressSearch: owns AddressSearch -> findWardAtLatLng -> router push

import { AlertCircle, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import LayerToggle from "@/components/LayerToggle";
import WardMap, { type WardMapOverlay } from "@/components/Map/WardMap";
import AddressSearch, {
  findWardAtLatLng,
  type AddressSearchHit,
  type WardFeatureCollection,
} from "@/components/AddressSearch";
import { getCity, type CityId } from "@/lib/cities";
import {
  loadLayersForCity,
  type LayerKind,
  type OverlayLayer,
} from "@/lib/layers";
import { withBase } from "@/lib/site";
import type { Ward } from "@/lib/types";
import { wardSlug } from "@/lib/wards";

type MapProps = {
  city: CityId;
  wards: Ward[];
};

export default function CityMapWithLayers({ city, wards }: MapProps) {
  const [activeKinds, setActiveKinds] = useState<Set<LayerKind>>(
    () => new Set(),
  );
  const [overlays, setOverlays] = useState<WardMapOverlay[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (activeKinds.size === 0) {
      setOverlays([]);
      return;
    }
    const kinds = Array.from(activeKinds);
    loadLayersForCity(city, kinds)
      .then((layers: OverlayLayer[]) => {
        if (cancelled) return;
        setOverlays(
          layers.map((l) => ({
            id: l.id,
            geojson: l.geojson,
            visible: true,
            style: l.color
              ? { "fill-color": l.color, "fill-opacity": 0.35 }
              : undefined,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setOverlays([]);
      });
    return () => {
      cancelled = true;
    };
  }, [city, activeKinds]);

  return (
    <>
      <Suspense fallback={null}>
        <LayerToggle onChange={setActiveKinds} />
      </Suspense>
      <div className="h-[60vh] min-h-[300px] max-h-[640px] sm:h-[60vh] sm:min-h-[400px] lg:h-[65vh] lg:min-h-[440px] lg:max-h-[720px]">
        <Suspense fallback={<MapSkeleton />}>
          <WardMap city={city} wards={wards} overlays={overlays} />
        </Suspense>
      </div>
    </>
  );
}

type AddrProps = {
  city: CityId;
  className?: string;
};

// Lazily-fetched + cached ward GeoJSON per city so repeat lookups don't re-hit
// the network. Module-level so a navigation away and back keeps the cache.
const wardGeoCache = new Map<string, Promise<WardFeatureCollection>>();
function loadWardGeo(city: CityId): Promise<WardFeatureCollection> {
  const cfg = getCity(city);
  if (!cfg) return Promise.reject(new Error("unknown_city"));
  const cached = wardGeoCache.get(city);
  if (cached) return cached;
  const p = fetch(withBase(cfg.geojson))
    .then((res) => {
      if (!res.ok) throw new Error(`geojson_http_${res.status}`);
      return res.json() as Promise<WardFeatureCollection>;
    })
    .catch((err) => {
      // Don't poison the cache on failure — next attempt should retry.
      wardGeoCache.delete(city);
      throw err;
    });
  wardGeoCache.set(city, p);
  return p;
}

export function CityAddressSearch({ city, className }: AddrProps) {
  const router = useRouter();
  const cfg = getCity(city);
  const [status, setStatus] = useState<"idle" | "resolving" | "miss" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const onSelect = useCallback(
    async (hit: AddressSearchHit) => {
      if (!cfg) return;
      setStatus("resolving");
      setMessage(null);
      try {
        const geo = await loadWardGeo(city);
        const match = findWardAtLatLng(hit.lat, hit.lng, geo, cfg.wardIdKey);
        if (match) {
          setStatus("idle");
          router.push(`/${city}/ward/${wardSlug(match.wardId)}/` as never);
          return;
        }
        setStatus("miss");
        setMessage("No ward match — try a closer landmark.");
      } catch {
        setStatus("error");
        setMessage("Couldn't load ward data. Try again in a moment.");
      }
    },
    [cfg, city, router],
  );

  return (
    <div className={className}>
      <AddressSearch cityId={city} onSelect={onSelect} />
      {status === "miss" || status === "error" ? (
        <p
          role="status"
          className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400"
        >
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{message}</span>
        </p>
      ) : status === "resolving" ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>Finding your ward…</span>
        </p>
      ) : null}
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="w-full h-full rounded-lg bg-muted border animate-pulse [animation-duration:1800ms]" />
  );
}
