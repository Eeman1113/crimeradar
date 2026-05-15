"use client";

import { AlertCircle, LoaderCircle, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import posthog from "posthog-js";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";
import { Button } from "@/components/ui/button";
import { CITIES, CITY_IDS, type CityId } from "@/lib/cities";
import { useI18n } from "@/lib/i18n/provider";
import { withBase } from "@/lib/site";
import { wardSlug } from "@/lib/wards";

type WardCollection = FeatureCollection<
  Polygon | MultiPolygon,
  Record<string, unknown>
>;

// Cheap bounds-only filter: which city's bounding box contains (lat, lon)?
function cityForPoint(lon: number, lat: number): CityId[] {
  const hits: CityId[] = [];
  for (const id of CITY_IDS) {
    const [[w, s], [e, n]] = CITIES[id].bounds;
    if (lon >= w && lon <= e && lat >= s && lat <= n) hits.push(id);
  }
  return hits;
}

export default function LocateAnywhereButton() {
  const router = useRouter();
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function locate() {
    posthog.capture("locate_anywhere_clicked");
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Geolocation isn't available in this browser.");
      posthog.capture("locate_anywhere_error", { reason: "geolocation_unavailable" });
      return;
    }
    setStatus("locating");
    setMessage(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 30_000,
        });
      });
      const { latitude: lat, longitude: lon } = pos.coords;

      const candidates = cityForPoint(lon, lat);
      if (candidates.length === 0) {
        setStatus("error");
        setMessage(
          "You're outside our 6 supported cities (Mumbai, Bangalore, Delhi, Chennai, Hyderabad, Kolkata). Pick a city below to browse it manually.",
        );
        posthog.capture("locate_anywhere_error", { reason: "outside_coverage" });
        return;
      }

      // For each candidate city, fetch its GeoJSON and check point-in-polygon.
      // Usually the bounding-box filter narrows it to one city already.
      for (const city of candidates) {
        const cfg = CITIES[city];
        const res = await fetch(withBase(cfg.geojson));
        const fc = (await res.json()) as WardCollection;
        const pt = { type: "Point" as const, coordinates: [lon, lat] };
        for (const f of fc.features as Feature<
          Polygon | MultiPolygon,
          Record<string, unknown>
        >[]) {
          if (booleanPointInPolygon(pt, f)) {
            const raw = f.properties?.[cfg.wardIdKey];
            if (raw != null) {
              posthog.capture("locate_anywhere_success", { city, ward_id: String(raw) });
              router.push(
                `/${city}/ward/${wardSlug(String(raw))}/` as never,
              );
              return;
            }
          }
        }
      }

      setStatus("error");
      setMessage(
        "Your bounding box matched a city but no specific ward — maybe the boundary data is slightly off at your spot. Pick a city below.",
      );
      posthog.capture("locate_anywhere_error", { reason: "no_ward_match" });
    } catch (err) {
      setStatus("error");
      const e = err as GeolocationPositionError | Error;
      const reason = "code" in e ? (e.code === 1 ? "permission_denied" : "fix_failed") : "unknown";
      setMessage(
        "code" in e
          ? e.code === 1
            ? "Location permission denied. Allow location in your browser settings, or pick a city below."
            : "Couldn't get a location fix. Try again or pick a city below."
          : "Couldn't get a location fix.",
      );
      posthog.capture("locate_anywhere_error", { reason });
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 w-full sm:w-auto">
      <Button
        onClick={locate}
        disabled={status === "locating"}
        size="lg"
        className="gap-2 w-full sm:w-auto h-11"
      >
        {status === "locating" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {status === "locating" ? t("home_cta_locating") : t("home_cta_button")}
      </Button>
      {message ? (
        <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400 max-w-md">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
}
