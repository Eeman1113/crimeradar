"use client";

import { useEffect, useRef } from "react";
import maplibregl, {
  type FilterSpecification,
  type Map as MlMap,
  type MapMouseEvent,
} from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import posthog from "posthog-js";
import type { Ward } from "@/lib/types";
import { withBase } from "@/lib/site";
import { wardSlug } from "@/lib/wards";
import { getCity, type CityId } from "@/lib/cities";

export type WardMapOverlay = {
  id: string;
  geojson: GeoJSON.FeatureCollection;
  visible: boolean;
  style?: Record<string, unknown>;
};

type Props = {
  city: CityId;
  wards: Ward[];
  /**
   * Optional extra MapLibre overlay layers (e.g. CCTV, patrol routes,
   * helplines). Each entry becomes a `geojson` source + a layer keyed by
   * `id`. Future-proofing stub — left undefined renders nothing extra and
   * preserves prior behavior.
   */
  overlays?: WardMapOverlay[];
};

const STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";
const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";

// Some GeoJSONs (notably ESRI Living Atlas) give us verbose ward names
// like "Shimla (M Corp.) - Ward No.3" or "Gandhinagar (Corporation) Ward
// No. 6" — fine for the detail page header but unreadable on a 10px
// label. Compact them down to "Ward 3" / "Ward 6" while leaving
// neighborhood-style names ("Mulund (East & West)", "Babu Jagjivan Ram
// Ward", numbered "A"/"B" letters) untouched.
function shortMapLabel(name: string, fallbackId: string): string {
  if (!name) return fallbackId;
  // Match a trailing "Ward [No.] <token>" — extract token, prefix "Ward".
  const m = name.match(/Ward\s+(?:No\.?\s*)?([A-Za-z0-9]+)\s*$/i);
  if (m) return `Ward ${m[1]}`;
  // Drop "<City> (<anything>) - " or "<City> (<anything>) " prefix when
  // followed by something meaningful afterwards.
  const stripped = name
    .replace(/^[^()]+\([^)]+\)\s*-?\s*/, "")
    .trim();
  if (stripped && stripped.length < name.length) return stripped;
  return name;
}

export default function WardMap({ city, wards, overlays }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const isNight = params.get("night") === "1";
  const isWomen = params.get("women") === "1";
  const { resolvedTheme } = useTheme();
  const styleUrl = resolvedTheme === "light" ? STYLE_LIGHT : STYLE_DARK;
  const riskKey = isWomen
    ? isNight
      ? "risk_women_night"
      : "risk_women"
    : isNight
      ? "risk_night"
      : "risk";
  const cityCfg = getCity(city);
  const cityLabel = cityCfg?.name ?? city;
  const nightQs = isNight ? "?night=1" : "";

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const cfg = getCity(city)!;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      bounds: cfg.bounds,
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      maxZoom: 16,
      minZoom: 9,
    });
    mapRef.current = map;
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.on("load", async () => {
      const res = await fetch(withBase(cfg.geojson));
      const geo = (await res.json()) as FeatureCollection;

      const wardById = new Map(wards.map((w) => [w.id, w]));
      const wardIdKey = cfg.wardIdKey;
      const enriched: FeatureCollection = {
        ...geo,
        features: geo.features.map((f) => {
          const raw =
            (f.properties as Record<string, unknown> | null)?.[wardIdKey];
          const id = raw != null ? String(raw) : "";
          const w = wardById.get(id);
          // Prefer the ward's human-readable name (compacted) over the
          // raw GeoJSON id — which is an internal ESRI objectid like
          // "10145" for many cities.
          const label = shortMapLabel(w?.name ?? "", id);
          return {
            ...f,
            properties: {
              ...(f.properties ?? {}),
              ward_id: id,
              ward_label: label,
              neighborhoods: w?.neighborhoods ?? "",
              risk: w?.riskScore ?? -1,
              risk_night: w?.riskScoreNight ?? -1,
              risk_women: w?.riskScoreWomen ?? -1,
              risk_women_night: w?.riskScoreWomenNight ?? -1,
            },
          };
        }),
      };

      map.addSource("wards", { type: "geojson", data: enriched });

      const fillColor: maplibregl.DataDrivenPropertyValueSpecification<string> =
        [
          "case",
          ["<", ["coalesce", ["get", riskKey], -1], 0],
          "#3f3f46",
          [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", riskKey], 0],
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
          ],
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
            0.55,
          ],
        },
      });
      map.addLayer({
        id: "wards-outline",
        type: "line",
        source: "wards",
        paint: { "line-color": "#0f172a", "line-width": 0.5 },
      });

      const hasScores = wards.length > 0;
      if (hasScores) {
        map.addLayer({
          id: "wards-label",
          type: "symbol",
          source: "wards",
          layout: {
            "text-field": [
              "concat",
              ["coalesce", ["get", "ward_label"], ""],
              "\n",
              ["to-string", ["coalesce", ["get", riskKey], 0]],
            ],
            "text-size": 10,
            "text-font": ["Noto Sans Regular"],
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#f4f4f5",
            "text-halo-color": "#09090b",
            "text-halo-width": 1.2,
          },
          minzoom: 11,
        });
      }

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

      map.on(
        "mousemove",
        "wards-fill",
        (
          e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] },
        ) => {
          const f = e.features?.[0];
          if (!f) return;
          map.getCanvas().style.cursor = "pointer";
          const fid = f.id != null ? String(f.id) : null;
          setHover(fid);
          const p = f.properties as Record<string, unknown> | null;
          const score = (p?.[riskKey] as number | undefined) ?? -1;
          const modeLabel = isWomen
            ? isNight
              ? " (women · night)"
              : " (women)"
            : isNight
              ? " (night)"
              : "";
          const scoreLine =
            score != null && score >= 0
              ? `<div style="margin-top:4px"><strong>${score}</strong> / 100${modeLabel}</div>`
              : `<div style="margin-top:4px;opacity:0.7;font-size:11px">No risk data yet</div>`;
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:system-ui;color:#0f172a">
                <div style="font-weight:600">${p?.ward_label ?? p?.ward_id ?? ""}</div>
                <div style="font-size:11px;max-width:200px">${p?.neighborhoods ?? ""}</div>
                ${scoreLine}
              </div>`,
            )
            .addTo(map);
        },
      );

      map.on("mouseleave", "wards-fill", () => {
        map.getCanvas().style.cursor = "";
        setHover(null);
        popup.remove();
      });

      // Future-proofing: render any caller-supplied overlay layers on top
      // of the ward fills. Skipped silently when no overlays are passed.
      if (overlays && overlays.length > 0) {
        for (const ov of overlays) {
          if (!ov.visible) continue;
          const srcId = `overlay-${ov.id}`;
          const layerId = `overlay-${ov.id}-layer`;
          if (map.getSource(srcId) || map.getLayer(layerId)) continue;
          map.addSource(srcId, { type: "geojson", data: ov.geojson });
          map.addLayer({
            id: layerId,
            type: "fill",
            source: srcId,
            paint: {
              "fill-color": "#0ea5e9",
              "fill-opacity": 0.25,
              ...(ov.style ?? {}),
            },
          });
        }
      }

      if (hasScores) {
        map.on(
          "click",
          "wards-fill",
          (
            e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] },
          ) => {
            const f = e.features?.[0];
            const props = f?.properties as { ward_id?: string; risk?: number } | null;
            const id = props?.ward_id;
            if (!id) return;
            posthog.capture("ward_clicked_from_map", { city, ward_id: id, risk_score: props?.risk ?? null });
            const qs = isNight ? "?night=1" : "";
            // Next.js router prefixes basePath itself — don't wrap with withBase.
            router.push(
              `/${city}/ward/${wardSlug(id)}/${qs}` as never,
            );
          },
        );
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  // Swap basemap style when the theme flips.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(styleUrl, { diff: false });
    // setStyle drops our wards source/layers; re-add on style.load
    map.once("style.load", () => {
      // trigger the original setup again by clearing the map ref and forcing
      // re-mount via a no-op state — simpler: just re-create the map below.
    });
  }, [styleUrl]);

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
      map.setPaintProperty("wards-fill", "fill-color", [
        "case",
        ["<", ["coalesce", ["get", riskKey], -1], 0],
        "#3f3f46",
        [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", riskKey], 0],
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
        ],
      ] as unknown as FilterSpecification);
      if (map.getLayer("wards-label")) {
        map.setLayoutProperty("wards-label", "text-field", [
          "concat",
          ["coalesce", ["get", "ward_label"], ""],
          "\n",
          ["to-string", ["coalesce", ["get", riskKey], 0]],
        ] as unknown as FilterSpecification);
      }
    }
  }, [riskKey]);

  // Pick the same risk score the map paints with, so the sr-only list
  // and the map stay in sync when ?night=1 / ?women=1 toggle.
  const srRisk = (w: Ward): number =>
    isWomen
      ? isNight
        ? w.riskScoreWomenNight
        : w.riskScoreWomen
      : isNight
        ? w.riskScoreNight
        : w.riskScore;

  return (
    <>
      <div
        ref={containerRef}
        role="region"
        aria-label={`Ward risk map for ${cityLabel}`}
        className="w-full h-full rounded-lg overflow-hidden border bg-card"
        style={{ minHeight: 400 }}
      />
      {/* Screen-reader equivalent of the map (WCAG 1.1.1 / 2.1.1).
          Hidden visually but becomes visible & focusable on tab. */}
      <ul aria-label={`Wards in ${cityLabel} with risk scores`} className="sr-only">
        {wards.map((w) => {
          const score = srRisk(w);
          const scoreText = score >= 0 ? `${score} of 100` : "no data";
          return (
            <li key={w.id}>
              <Link
                href={`/${city}/ward/${wardSlug(w.id)}/${nightQs}` as never}
                className="focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-card focus:text-foreground focus:px-3 focus:py-2 focus:rounded focus:border focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {w.name} — risk {scoreText}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
