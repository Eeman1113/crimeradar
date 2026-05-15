"use client";

import { MapPin, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";
import { Button } from "@/components/ui/button";
import { withBase } from "@/lib/site";
import { wardSlug } from "@/lib/wards";
import { getCity, type CityId } from "@/lib/cities";

type WardCollection = FeatureCollection<
  Polygon | MultiPolygon,
  Record<string, unknown>
>;

export default function LocateMeButton({ city }: { city: CityId }) {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function locate() {
    const cfg = getCity(city)!;
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Geolocation isn't available in this browser.");
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
        return;
      }
      const isNight = params.get("night") === "1";
      const qs = isNight ? "?night=1" : "";
      router.push(
        `${withBase(`/${city}/ward/${wardSlug(wardId)}`)}${qs}` as never,
      );
    } catch (err) {
      setStatus("error");
      const e = err as GeolocationPositionError | Error;
      setMessage(
        "code" in e
          ? e.code === 1
            ? "Location permission denied."
            : "Couldn't get a location fix."
          : "Couldn't get a location fix.",
      );
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={locate}
        disabled={status === "locating"}
        size="sm"
        className="gap-2"
      >
        {status === "locating" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {status === "locating" ? "Locating…" : "Use my location"}
      </Button>
      {message ? (
        <p className="text-xs text-amber-600 dark:text-amber-400 max-w-xs">
          {message}
        </p>
      ) : null}
    </div>
  );
}
