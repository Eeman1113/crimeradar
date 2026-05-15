"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

type WardCollection = FeatureCollection<
  Polygon | MultiPolygon,
  { gid: number; name: string }
>;

export default function LocateMeButton() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function locate() {
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
      const res = await fetch("/geo/bmc_wards.geojson");
      const fc = (await res.json()) as WardCollection;
      const pt = { type: "Point" as const, coordinates: [lon, lat] };
      let wardId: string | null = null;
      for (const f of fc.features as Feature<
        Polygon | MultiPolygon,
        { name: string }
      >[]) {
        if (booleanPointInPolygon(pt, f)) {
          wardId = f.properties.name;
          break;
        }
      }
      if (!wardId) {
        setStatus("error");
        setMessage(
          "You appear to be outside the BMC ward boundaries (this MVP only covers central Mumbai).",
        );
        return;
      }
      const isNight = params.get("night") === "1";
      const qs = isNight ? "?night=1" : "";
      router.push(`/ward/${encodeURIComponent(wardId)}${qs}` as never);
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
      <button
        type="button"
        onClick={locate}
        disabled={status === "locating"}
        className="inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        <span aria-hidden>📍</span>
        {status === "locating" ? "Locating…" : "Use my location"}
      </button>
      {message ? (
        <p className="text-xs text-amber-400 max-w-xs">{message}</p>
      ) : null}
    </div>
  );
}
