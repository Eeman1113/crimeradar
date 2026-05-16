// Overlay layer types and loaders for CrimeRadar.
//
// Each city can ship a set of GeoJSON overlays (hospitals, schools,
// police stations, helplines, metro stations, streetlight outages, CCTV).
// Data lives in `public/data/layers/{cityId}/{kind}.geojson` so it can be
// served statically alongside the ward GeoJSON.
//
// This module intentionally only defines the architecture — wiring into
// WardMap and the city page lives in a later wave.

export type LayerKind =
  | "hospital"
  | "school"
  | "police_station"
  | "helpline"
  | "metro_station"
  | "streetlight_outage"
  | "cctv";

export interface OverlayLayer {
  id: string;
  kind: LayerKind;
  label: string;
  geojson: GeoJSON.FeatureCollection;
  visible: boolean;
  icon?: string;
  color?: string;
}

// Lucide icon name + a default Tailwind-friendly hex per layer kind.
// Colors are chosen to remain legible on both light and dark map tiles
// and to stay distinct from the red/orange risk-heatmap palette.
export const LAYER_META: Record<
  LayerKind,
  { label: string; icon: string; color: string }
> = {
  hospital: { label: "Hospitals", icon: "Hospital", color: "#dc2626" },
  school: { label: "Schools", icon: "School", color: "#2563eb" },
  police_station: { label: "Police stations", icon: "Shield", color: "#1d4ed8" },
  helpline: { label: "Helplines & OSCs", icon: "Phone", color: "#9333ea" },
  metro_station: { label: "Metro stations", icon: "Train", color: "#059669" },
  streetlight_outage: {
    label: "Streetlight outages",
    icon: "Lightbulb",
    color: "#f59e0b",
  },
  cctv: { label: "CCTV cameras", icon: "Camera", color: "#0891b2" },
};

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

/**
 * Fetch one or more overlay layers for a given city.
 *
 * Missing files (e.g. a city that doesn't yet have a `metro_station.geojson`)
 * resolve to an empty FeatureCollection rather than throwing, so callers
 * can request the full set of `LayerKind`s without guarding each one.
 */
export async function loadLayersForCity(
  cityId: string,
  kinds: LayerKind[],
): Promise<OverlayLayer[]> {
  const results = await Promise.all(
    kinds.map(async (kind): Promise<OverlayLayer> => {
      const meta = LAYER_META[kind];
      const url = `/data/layers/${cityId}/${kind}.geojson`;
      let geojson: GeoJSON.FeatureCollection = EMPTY_FC;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const parsed = (await res.json()) as GeoJSON.FeatureCollection;
          if (parsed && parsed.type === "FeatureCollection") {
            geojson = parsed;
          }
        }
      } catch {
        // Swallow — fall back to empty FC. Callers can detect empties
        // via `geojson.features.length === 0` if they need to.
      }
      return {
        id: `${cityId}:${kind}`,
        kind,
        label: meta.label,
        geojson,
        visible: false,
        icon: meta.icon,
        color: meta.color,
      };
    }),
  );
  return results;
}
