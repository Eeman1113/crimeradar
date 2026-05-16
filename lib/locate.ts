// Helpers for resolving a (lat, lng) point to a ward in a city's GeoJSON.
// Lives outside any component so server- and client-side code can share it.

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";

export type WardFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  Record<string, unknown>
>;

export type WardHit = {
  // Raw ward identifier as found in feature.properties[wardIdKey].
  wardId: string;
  // The full feature, in case the caller wants its name or geometry.
  feature: Feature<Polygon | MultiPolygon, Record<string, unknown>>;
};

/**
 * Find the ward feature whose polygon contains (lat, lng).
 *
 * @param lat latitude in degrees
 * @param lng longitude in degrees
 * @param geojson ward FeatureCollection for a city
 * @param wardIdKey property name on each feature that holds the ward id
 * @returns the first matching ward, or null if the point is outside every ward
 */
export function findWardAtLatLng(
  lat: number,
  lng: number,
  geojson: WardFeatureCollection,
  wardIdKey: string,
): WardHit | null {
  const pt = { type: "Point" as const, coordinates: [lng, lat] };
  for (const f of geojson.features as Feature<
    Polygon | MultiPolygon,
    Record<string, unknown>
  >[]) {
    if (booleanPointInPolygon(pt, f)) {
      const raw = f.properties?.[wardIdKey];
      if (raw != null) {
        return { wardId: String(raw), feature: f };
      }
    }
  }
  return null;
}
