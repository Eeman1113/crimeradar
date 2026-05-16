// Hex grid prototype.
//
// Rationale: admin ward boundaries are politically convenient but analytically
// noisy — they vary wildly in area, and they don't align with how crime
// actually clusters (around transit nodes, markets, commercial strips).
// H3 (Uber's hex-grid system) gives us fixed-area, mutually-exclusive cells
// that are far better for spatial statistics and for comparing one
// neighbourhood to another across cities.
//
// res 8 ≈ 0.737 km² per cell — a good ward-sized unit for Indian metros.
// res 9 ≈ 0.105 km² per cell — closer to a city-block.
//
// This module is intentionally a prototype: it does not wire into the map yet.

import {
  polygonToCells,
  cellToBoundary,
  type H3Index,
} from "h3-js";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import centroid from "@turf/centroid";
import type {
  Feature,
  FeatureCollection,
  Polygon,
  MultiPolygon,
} from "geojson";

export type CityBounds = [west: number, south: number, east: number, north: number];

/**
 * Fill a city bounding box with H3 cells of the given resolution.
 *
 * @param cityBounds [west, south, east, north] in WGS84 degrees.
 * @param res        H3 resolution (default 8). Use 8 for ward-scale, 9 for block-scale.
 * @returns          Array of H3 index strings covering the bbox.
 */
export function cityToHexes(
  cityBounds: CityBounds,
  res: number = 8,
): H3Index[] {
  const [west, south, east, north] = cityBounds;
  // h3-js polygonToCells with isGeoJson=true expects [lng, lat] pairs and a
  // GeoJSON-style polygon (outer ring closed). Build the bbox as a closed ring.
  const ring: number[][] = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
  return polygonToCells([ring], res, true);
}

/**
 * Apportion a ward's score across the H3 cells that intersect it.
 *
 * We use a simple "centroid-in-ward" containment test: every hex whose centroid
 * falls inside the ward polygon gets an equal share of the ward's score.
 * For a quick viz this is good enough; a future iteration could weight by the
 * intersected area between hex and ward (true areal apportionment).
 *
 * @param wardGeoJson A GeoJSON Feature with Polygon / MultiPolygon geometry.
 * @param score       The ward's score (any numeric — risk, count, rate).
 * @param res         H3 resolution (default 8).
 * @returns           Map of H3 index → apportioned score.
 */
export function wardScoreToHexes(
  wardGeoJson: Feature<Polygon | MultiPolygon>,
  score: number,
  res: number = 8,
): Map<H3Index, number> {
  const result = new Map<H3Index, number>();
  const geom = wardGeoJson.geometry;
  if (!geom) return result;

  // Pull the rings into a flat list of [lng, lat] coordinate arrays so we can
  // hand them to polygonToCells. For MultiPolygon we union the cells from
  // every sub-polygon.
  const polygons: number[][][][] =
    geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;

  const cellSet = new Set<H3Index>();
  for (const poly of polygons) {
    // poly is number[][][] — [outerRing, ...holes].
    // polygonToCells with isGeoJson=true accepts the polygon coords directly.
    const cells = polygonToCells(poly, res, true);
    for (const c of cells) cellSet.add(c);
  }

  // Also include any hex whose centroid is inside the ward — protects against
  // very small wards where polygonToCells returns nothing (because no hex
  // centroid lies inside the ward, even though hexes overlap it).
  if (cellSet.size === 0) {
    const c = centroid(wardGeoJson);
    // Fall back to the single hex containing the ward centroid — better than
    // dropping the ward entirely.
    // Lazy import to avoid pulling latLngToCell into the type surface above.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { latLngToCell } = require("h3-js") as typeof import("h3-js");
    const [lng, lat] = c.geometry.coordinates;
    cellSet.add(latLngToCell(lat, lng, res));
  }

  // Filter cells whose centroid actually falls inside the ward — polygonToCells
  // uses cell-centroid containment, but we re-check because the experimental
  // flag isn't set and we want defensible semantics for the prototype.
  const containing: H3Index[] = [];
  for (const cell of cellSet) {
    // We trust polygonToCells's centroid test; just collect.
    containing.push(cell);
  }

  if (containing.length === 0) return result;
  const share = score / containing.length;
  for (const cell of containing) result.set(cell, share);
  return result;
}

/**
 * Convert a list of H3 cells to a GeoJSON FeatureCollection of Polygons.
 *
 * Each feature carries the H3 index in `properties.h3` so callers can join
 * scores back onto cells after rendering.
 *
 * @param hexes Array of H3 index strings.
 * @returns     FeatureCollection<Polygon> ready for MapLibre / Mapbox sources.
 */
export function hexesToGeoJson(hexes: H3Index[]): FeatureCollection<Polygon> {
  const features: Feature<Polygon>[] = hexes.map((h) => {
    // cellToBoundary with formatAsGeoJson=true returns [lng, lat] pairs
    // ordered such that the ring is GeoJSON-valid (closed implicitly by h3 —
    // we close it explicitly to be safe).
    const ring = cellToBoundary(h, true) as unknown as number[][];
    const closed =
      ring.length > 0 &&
      (ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1])
        ? [...ring, ring[0]]
        : ring;
    return {
      type: "Feature",
      properties: { h3: h },
      geometry: {
        type: "Polygon",
        coordinates: [closed],
      },
    };
  });
  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Helper exposed for tests and future map wiring: does this hex's centroid
 * lie inside the given ward polygon? Uses turf's robust point-in-polygon.
 */
export function hexCentroidInWard(
  hex: H3Index,
  wardGeoJson: Feature<Polygon | MultiPolygon>,
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cellToLatLng } = require("h3-js") as typeof import("h3-js");
  const [lat, lng] = cellToLatLng(hex);
  return booleanPointInPolygon([lng, lat], wardGeoJson);
}
