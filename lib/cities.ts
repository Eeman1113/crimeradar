// Single source of truth for which cities the app supports.
// The registry itself (CityId, CITIES, CITY_IDS) is codegenerated from
// data/cities.manifest.json — see scripts/codegen_cities.mjs.
// This file defines the shape and a couple of helpers on top.

import { CITIES, CITY_IDS, type CityId } from "./cities.generated";

export type { CityId };
export { CITIES, CITY_IDS };

export type CityConfig = {
  id: CityId;
  name: string;
  // Localized display names keyed by Locale id (hi, bn, mr, ta, te, gu, ur,
  // kn, or, ml, pa, as). Partial — falls back to `name` (English) at render.
  nameI18n?: Record<string, string>;
  state: string;
  // ISO 3166-2:IN code, e.g. "IN-MH" — used by the UI to group cities by state.
  stateCode: string;
  // Which target list this city belongs to. Capitals and million-plus cities can overlap (e.g. Mumbai is both).
  tier: "capital" | "million_plus" | "both";
  // [lon, lat] for the map's initial centre
  center: [number, number];
  // [[west, south], [east, north]] map fit bounds
  bounds: [[number, number], [number, number]];
  // public path to ward GeoJSON (served as a static asset)
  geojson: string;
  // key inside each feature's properties holding the ward id ("A", "B", ...)
  wardIdKey: string;
  // human-readable hint for the geo unit
  unit: string;
  // does the city's data folder hold real-data ingest JSONs?
  hasMonthlyStats: boolean;
  hasAbsconders: boolean;
};

export function isCityId(s: string): s is CityId {
  return (CITY_IDS as readonly string[]).includes(s);
}

export function getCity(id: CityId | string): CityConfig | undefined {
  return isCityId(id) ? CITIES[id] : undefined;
}
