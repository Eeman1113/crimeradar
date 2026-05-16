"use client";

import { MapPin, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useI18n } from "@/lib/i18n/provider";
import { withBase } from "@/lib/site";
import { wardSlug } from "@/lib/wards";
import { getCity, type CityId } from "@/lib/cities";

type WardCollection = FeatureCollection<
  Polygon | MultiPolygon,
  Record<string, unknown>
>;

export default function LocateMeButton({ city }: { city: CityId }) {
  const router = useRouter();
  const { t } = useI18n();
  const params = useSearchParams();
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function locate() {
    posthog.capture("locate_me_clicked", { city });
    const cfg = getCity(city)!;
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Geolocation isn't available in this browser.");
      posthog.capture("locate_me_error", { city, reason: "geolocation_unavailable" });
      return;
    }
    setStatus("locating");
    setMessage(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 30_000,
        });
      });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const res = await fetch(withBase(cfg.geojson));
      const fc = (await res.json()) as WardCollection;
      const pt = { type: "Point" as const, coordinates: [lon, lat] };
      let wardId: string | null = null;
      for (const f of fc.features as Feature<
        Polygon | MultiPolygon,
        Record<string, unknown>
      >[]) {
        if (booleanPointInPolygon(pt, f)) {
          const raw = f.properties?.[cfg.wardIdKey];
          if (raw != null) wardId = String(raw);
          break;
        }
      }
      if (!wardId) {
        setStatus("error");
        setMessage(
          `You appear to be outside the ${cfg.name} ${cfg.unit} boundaries.`,
        );
        posthog.capture("locate_me_error", { city, reason: "outside_boundaries" });
        return;
      }
      posthog.capture("locate_me_success", { city, ward_id: wardId });
      const isNight = params.get("night") === "1";
      const qs = isNight ? "?night=1" : "";
      // Next.js router prefixes basePath itself — don't wrap with withBase.
      router.push(
        `/${city}/ward/${wardSlug(wardId)}/${qs}` as never,
      );
    } catch (err) {
      setStatus("error");
      const e = err as GeolocationPositionError | Error;
      const reason = "code" in e ? (e.code === 1 ? "permission_denied" : "fix_failed") : "unknown";
      setMessage(
        "code" in e
          ? e.code === 1
            ? "Location permission denied."
            : "Couldn't get a location fix."
          : "Couldn't get a location fix.",
      );
      posthog.capture("locate_me_error", { city, reason });
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 w-full sm:w-auto sm:shrink-0">
      <Button
        onClick={locate}
        disabled={status === "locating"}
        aria-label={t("city_use_location")}
        title={t("city_use_location")}
        className="gap-2 w-full sm:w-auto h-10 sm:h-9"
      >
        {status === "locating" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {status === "locating" ? t("city_locating") : t("city_use_location")}
      </Button>
      {message ? (
        <p className="text-xs text-amber-600 dark:text-amber-400 max-w-xs">
          {message}
        </p>
      ) : null}
    </div>
  );
}
