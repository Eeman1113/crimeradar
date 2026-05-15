// Single source of truth for which cities the app supports and what data is
// expected to exist for each. Per-city loaders dispatch off CityId.

export type CityId =
  | "mumbai"
  | "bangalore"
  | "delhi"
  | "chennai"
  | "hyderabad"
  | "kolkata"
  | "pune"
  | "gurugram"
  | "noida";

export type CityConfig = {
  id: CityId;
  name: string;
  state: string;
  // [lon, lat] for the map's initial centre
  center: [number, number];
  // [[west, south], [east, north]] map fit bounds
  bounds: [[number, number], [number, number]];
  // public path to ward GeoJSON (served as a static asset)
  geojson: string;
  // key inside each feature's properties holding the ward id ("A", "B", ...)
  wardIdKey: string;
  // optional renamer if the geojson stores ids slightly differently
  normaliseWardId?: (raw: string) => string;
  // human-readable hint for the geo unit
  unit: string;
  // does the city's data folder hold real-data ingest JSONs?
  hasMonthlyStats: boolean;
  hasAbsconders: boolean;
};

export const CITIES: Record<CityId, CityConfig> = {
  mumbai: {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    center: [72.87, 19.09],
    bounds: [
      [72.75, 18.85],
      [73.05, 19.32],
    ],
    geojson: "/geo/mumbai_wards.geojson",
    wardIdKey: "name",
    unit: "BMC ward",
    hasMonthlyStats: true,
    hasAbsconders: true,
  },
  bangalore: {
    id: "bangalore",
    name: "Bangalore",
    state: "Karnataka",
    center: [77.59, 12.97],
    bounds: [
      [77.45, 12.83],
      [77.78, 13.13],
    ],
    geojson: "/geo/bangalore_wards.geojson",
    wardIdKey: "KGISWardName",
    unit: "BBMP ward",
    hasMonthlyStats: true,
    hasAbsconders: false,
  },
  delhi: {
    id: "delhi",
    name: "Delhi",
    state: "Delhi",
    center: [77.22, 28.63],
    bounds: [
      [76.84, 28.4],
      [77.4, 28.88],
    ],
    geojson: "/geo/delhi_wards.geojson",
    wardIdKey: "Ward_No",
    unit: "MCD ward",
    hasMonthlyStats: true,
    hasAbsconders: true,
  },
  chennai: {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    center: [80.24, 13.08],
    bounds: [
      [80.12, 12.85],
      [80.32, 13.25],
    ],
    geojson: "/geo/chennai_wards.geojson",
    wardIdKey: "Ward_No",
    unit: "GCC ward",
    hasMonthlyStats: true,
    hasAbsconders: false,
  },
  hyderabad: {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    center: [78.49, 17.39],
    bounds: [
      [78.27, 17.25],
      [78.66, 17.55],
    ],
    geojson: "/geo/hyderabad_wards.geojson",
    wardIdKey: "name",
    unit: "GHMC ward",
    hasMonthlyStats: false,
    hasAbsconders: false,
  },
  kolkata: {
    id: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    center: [88.36, 22.57],
    bounds: [
      [88.27, 22.45],
      [88.45, 22.69],
    ],
    geojson: "/geo/kolkata_wards.geojson",
    wardIdKey: "WARD",
    unit: "KMC ward",
    hasMonthlyStats: false,
    hasAbsconders: true,
  },
  pune: {
    id: "pune",
    name: "Pune",
    state: "Maharashtra",
    center: [73.86, 18.53],
    bounds: [
      [73.74, 18.42],
      [73.97, 18.63],
    ],
    geojson: "/geo/pune_wards.geojson",
    wardIdKey: "ward_id",
    unit: "PMC ward",
    hasMonthlyStats: false,
    hasAbsconders: false,
  },
  gurugram: {
    id: "gurugram",
    name: "Gurugram",
    state: "Haryana",
    center: [77.05, 28.45],
    bounds: [
      [76.92, 28.36],
      [77.17, 28.54],
    ],
    geojson: "/geo/gurugram_wards.geojson",
    wardIdKey: "sourcewardcode",
    unit: "MCG ward",
    hasMonthlyStats: true,
    hasAbsconders: false,
  },
  noida: {
    id: "noida",
    name: "Noida",
    state: "Uttar Pradesh",
    center: [77.36, 28.57],
    bounds: [
      [77.28, 28.48],
      [77.43, 28.64],
    ],
    geojson: "/geo/noida_wards.geojson",
    wardIdKey: "name",
    unit: "Police station area",
    hasMonthlyStats: false,
    hasAbsconders: false,
  },
};

export const CITY_IDS: CityId[] = Object.keys(CITIES) as CityId[];

export function isCityId(s: string): s is CityId {
  return (CITY_IDS as readonly string[]).includes(s);
}

export function getCity(id: CityId | string): CityConfig | undefined {
  return isCityId(id) ? CITIES[id] : undefined;
}
