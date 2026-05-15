import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import fs from "node:fs";
import path from "node:path";

type WardFeature = Feature<Polygon | MultiPolygon, { gid: number; name: string }>;
type WardCollection = FeatureCollection<Polygon | MultiPolygon, { gid: number; name: string }>;

let cached: WardCollection | null = null;

export function loadWardsGeoJSON(): WardCollection {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "public", "geo", "bmc_wards.geojson");
  const raw = fs.readFileSync(filePath, "utf8");
  cached = JSON.parse(raw) as WardCollection;
  return cached;
}

export function wardIdForPoint(lat: number, lon: number): string | null {
  const fc = loadWardsGeoJSON();
  const pt = { type: "Point" as const, coordinates: [lon, lat] };
  for (const f of fc.features as WardFeature[]) {
    if (booleanPointInPolygon(pt, f)) return f.properties.name;
  }
  return null;
}
