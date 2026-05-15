"use client";

import { useEffect, useRef } from "react";
import maplibregl, {
  type FilterSpecification,
  type Map as MlMap,
  type MapMouseEvent,
} from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { useRouter, useSearchParams } from "next/navigation";
import type { Ward } from "@/lib/types";
import { withBase } from "@/lib/site";
import { wardSlug } from "@/lib/wards";

const MUMBAI_BOUNDS: [[number, number], [number, number]] = [
  [72.75, 18.85],
  [73.05, 19.32],
];

type Props = {
  wards: Ward[];
};

export default function WardMap({ wards }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const isNight = params.get("night") === "1";

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      bounds: MUMBAI_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      maxZoom: 16,
      minZoom: 9,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", async () => {
      const res = await fetch(withBase("/geo/bmc_wards.geojson"));
      const geo = (await res.json()) as FeatureCollection;

      const wardById = new Map(wards.map((w) => [w.id, w]));
      const enriched: FeatureCollection = {
        ...geo,
        features: geo.features.map((f) => {
          const id = (f.properties as { name?: string } | null)?.name ?? "";
          const w = wardById.get(id);
          return {
            ...f,
            properties: {
              ...(f.properties ?? {}),
              ward_id: id,
              neighborhoods: w?.neighborhoods ?? "",
              risk: w?.riskScore ?? 0,
              risk_night: w?.riskScoreNight ?? 0,
            },
          };
        }),
      };

      map.addSource("wards", { type: "geojson", data: enriched });

      const fillColor: maplibregl.DataDrivenPropertyValueSpecification<string> = [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", isNight ? "risk_night" : "risk"], 0],
        0,
        "#14532d",
        25,
        "#65a30d",
        50,
        "#f59e0b",
        75,
        "#ea580c",
        100,
        "#dc2626",
      ];

      map.addLayer({
        id: "wards-fill",
        type: "fill",
        source: "wards",
        paint: {
          "fill-color": fillColor,
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.85,
            0.6,
          ],
        },
      });
      map.addLayer({
        id: "wards-outline",
        type: "line",
        source: "wards",
        paint: { "line-color": "#0f172a", "line-width": 1 },
      });
      map.addLayer({
        id: "wards-label",
        type: "symbol",
        source: "wards",
        layout: {
          "text-field": [
            "concat",
            ["coalesce", ["get", "name"], ""],
            "\n",
            ["to-string", ["coalesce", ["get", isNight ? "risk_night" : "risk"], 0]],
          ],
          "text-size": 11,
          "text-font": ["Noto Sans Regular"],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#f4f4f5",
          "text-halo-color": "#09090b",
          "text-halo-width": 1.2,
        },
      });

      let hoverId: string | null = null;
      const setHover = (id: string | null) => {
        if (hoverId === id) return;
        if (hoverId) {
          map.setFeatureState(
            { source: "wards", id: hoverId as unknown as number },
            { hover: false },
          );
        }
        if (id) {
          map.setFeatureState(
            { source: "wards", id: id as unknown as number },
            { hover: true },
          );
        }
        hoverId = id;
      };

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
      });

      map.on("mousemove", "wards-fill", (e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        const f = e.features?.[0];
        if (!f) return;
        map.getCanvas().style.cursor = "pointer";
        const fid = f.id != null ? String(f.id) : null;
        setHover(fid);
        const p = f.properties as {
          ward_id?: string;
          neighborhoods?: string;
          risk?: number;
          risk_night?: number;
        } | null;
        const score = isNight ? p?.risk_night : p?.risk;
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:system-ui;color:#0f172a">
              <div style="font-weight:600">Ward ${p?.ward_id ?? ""}</div>
              <div style="font-size:11px;max-width:200px">${p?.neighborhoods ?? ""}</div>
              <div style="margin-top:4px"><strong>${score ?? 0}</strong> / 100 ${isNight ? "(night)" : ""}</div>
            </div>`,
          )
          .addTo(map);
      });

      map.on("mouseleave", "wards-fill", () => {
        map.getCanvas().style.cursor = "";
        setHover(null);
        popup.remove();
      });

      map.on("click", "wards-fill", (e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        const f = e.features?.[0];
        const id = (f?.properties as { ward_id?: string } | null)?.ward_id;
        if (!id) return;
        const qs = isNight ? "?night=1" : "";
        router.push(`${withBase(`/ward/${wardSlug(id)}`)}${qs}` as never);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep colors / labels / click target in sync with night toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      const handler = () => updatePaint();
      map?.once("load", handler);
      return;
    }
    updatePaint();
    function updatePaint() {
      if (!map || !map.getLayer("wards-fill")) return;
      const key = isNight ? "risk_night" : "risk";
      map.setPaintProperty("wards-fill", "fill-color", [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", key], 0],
        0,
        "#14532d",
        25,
        "#65a30d",
        50,
        "#f59e0b",
        75,
        "#ea580c",
        100,
        "#dc2626",
      ] as unknown as FilterSpecification);
      map.setLayoutProperty("wards-label", "text-field", [
        "concat",
        ["coalesce", ["get", "name"], ""],
        "\n",
        ["to-string", ["coalesce", ["get", key], 0]],
      ] as unknown as FilterSpecification);
    }
  }, [isNight]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden border border-zinc-800"
      style={{ minHeight: 400 }}
    />
  );
}
