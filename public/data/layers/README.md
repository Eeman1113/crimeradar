# Overlay layers

This directory holds optional GeoJSON overlays the city map can render on
top of the ward risk choropleth. 11 of the personas we surveyed (women
commuters, parents picking schools, ASHA workers, night-shift staff,
etc.) explicitly asked for one or more of these layers.

## Layout

```
public/data/layers/
  README.md               <- you are here
  {cityId}/
    hospital.geojson
    school.geojson
    police_station.geojson
    helpline.geojson
    metro_station.geojson
    streetlight_outage.geojson
    cctv.geojson
```

`cityId` matches the city slugs in `lib/cities.generated.ts`
(e.g. `mumbai`, `delhi`, `bangalore`).

Missing files are fine — `loadLayersForCity()` in `lib/layers.ts`
silently falls back to an empty `FeatureCollection` so the UI can hide
the toggle for that layer.

## Schema

Every file is a [GeoJSON `FeatureCollection`](https://datatracker.ietf.org/doc/html/rfc7946#section-3.3).
We extend the spec with a non-standard top-level `metadata` block (RFC
7946 allows foreign members) so each layer is self-describing:

```jsonc
{
  "type": "FeatureCollection",
  "metadata": {
    "city": "mumbai",
    "kind": "hospital",
    "source": "<where the data came from>",
    "license": "<license string, ideally OSM-compatible>",
    "updated": "YYYY-MM-DD",
    "todo": "<known gaps>"
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Tata Memorial Hospital",
        "kind": "hospital",
        "category": "cancer",
        "ward_hint": "Parel"
      },
      "geometry": { "type": "Point", "coordinates": [72.8423, 19.0048] }
    }
  ]
}
```

Required `properties` per feature:

| key    | required | notes                                                              |
| ------ | -------- | ------------------------------------------------------------------ |
| `name` | yes      | Display label                                                      |
| `kind` | yes      | One of the `LayerKind` strings, must match the filename            |

All other properties are layer-specific — see the per-file `metadata.todo`
notes for the fields we eventually want.

Coordinates are `[longitude, latitude]` in WGS84 (EPSG:4326), same as
the ward GeoJSON.

## Source & license

Today everything in `mumbai/` is hand-typed placeholder data — coordinates
are approximate (within a few hundred meters) and are intended only to
exercise the rendering pipeline. **Do not** treat these as authoritative.

Once we replace them, preferred sources are:

- **OpenStreetMap** (ODbL) — `amenity=hospital`, `amenity=school`,
  `amenity=police`, `railway=station + station=subway`. Export via
  Overpass turbo, then simplify to points.
- **data.gov.in** for hospital and police directories where available.
- **MMRDA / DMRC / BMRCL** official station lists for metro.
- **Municipal "smart city" portals** for streetlight outage and CCTV
  feeds (e.g. BMC's CCTV camera locations).

When you import from OSM, keep the ODbL attribution string in
`metadata.source` and `metadata.license`.

## Contributing a new city

1. Create `public/data/layers/{cityId}/`.
2. Add at least one of the seven `LayerKind` files. Empty
   `FeatureCollection`s are fine if you don't have the data yet — file a
   `todo` in `metadata`.
3. No code changes required — `loadLayersForCity()` discovers files by
   convention.
4. Update this README's "Current coverage" table.

## Current coverage

| city   | hospital | school | police_station | helpline | metro_station | streetlight_outage | cctv |
| ------ | -------- | ------ | -------------- | -------- | ------------- | ------------------ | ---- |
| mumbai | seed (5) | empty  | seed (4)       | empty    | seed (5)      | missing            | missing |

"seed" = hand-typed placeholder, "empty" = file exists with no features,
"missing" = no file (loader returns empty FC).
