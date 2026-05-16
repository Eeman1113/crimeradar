// Noida police station jurisdictions (Gautam Budh Nagar Commissionerate,
// Noida zone / "city area").
//
// Noida has no formal municipal wards: the Noida Authority is an industrial
// development authority, not a municipal corporation, and divides the city
// into ~170 numbered sectors rather than wards. We instead model "wards"
// as the territorial police-station jurisdictions of the Gautam Budh Nagar
// Police Commissionerate's Noida zone, because that is the unit at which
// crime is recorded (FIR-by-station).
//
// Scope: NOIDA PROPER ONLY. Greater Noida, Greater Noida West, the rural
// Gautam Budh Nagar stations (Bisrakh, Kasna, Knowledge Park, Surajpur,
// Dadri, Dankaur, Jewar, Rabupura, Jarcha, Ecotech-1/3, Badalpur, Beta-2)
// and the Yamuna Expressway zone are EXCLUDED. The overlay-jurisdiction
// Women's Police Station (Sector 39A) is also excluded — its territorial
// area is already covered by the adjacent Sector 39 station.
//
// Crime data is MODELLED, not measured. NCRB and the Gautam Budh Nagar
// Police publish city-aggregate totals (e.g. for calendar 2022:
// 53 murders, 33 rapes, 1,336 vehicle thefts, 141 house burglaries,
// 39 loot/robberies, 576 crimes against women, 31 dowry deaths — see
// theprint.in, 31 Dec 2023 review). Per-station / per-sector FIR
// breakdowns are not published in machine-readable form. We distribute
// modelled Noida-proper city totals across the 10 territorial stations
// using jurisdiction population × density factor (0.7–1.6) with
// category-specific weighting (theft/harassment up in commercial &
// nightlife sectors; assault/robbery up near highway interchanges &
// industrial belts; sexual_offence/harassment weighted to migrant-worker
// industrial areas). See methodology page.
//
// Sources consulted:
//   - https://gbnagar.nic.in/police/
//   - https://en.wikipedia.org/wiki/Gautam_Buddh_Nagar_Police_Commissionerate
//   - https://www.findeasy.in/police-station-in-noida/
//   - https://www.noidabusinessguide.com/police-station-in-noida/
//   - https://theprint.in/india/noida-50-murders-30-rapes-1098-vehicle-thefts-reported-in-2023-as-crime-graph-dips/1906681/
//   - https://ncrb.gov.in/ (Crime in India 2022)

import type { CrimeBreakdown } from "@/lib/types";

export type WardSeed = {
  id: string;
  name: string;
  neighborhoods: string;
  population: number;
  breakdown: CrimeBreakdown;
  topConcerns: string[];
};

export const WARDS_SEED: WardSeed[] = [
  {
    id: "Sector 20",
    name: "Sector 20",
    neighborhoods: "Sectors 1-19, Sector 20-21, Harola, old residential pockets near Amaltash Marg",
    population: 115_000,
    breakdown: {
      theft: 175,
      robbery: 3,
      assault: 24,
      sexual_offence: 7,
      harassment: 32,
      kidnapping: 7,
      burglary: 14,
      other: 105,
    },
    topConcerns: [
      "Chain & phone snatching in older sector-markets",
      "Pickpocketing around Sector 18 / Atta Market edge",
      "Vehicle theft from open society parking",
    ],
  },
  {
    id: "Sector 24",
    name: "Sector 24",
    neighborhoods: "Sectors 22, 23, 25-29, Atta Market, RTO Office area, Sector 18 partial",
    population: 130_000,
    breakdown: {
      theft: 260,
      robbery: 5,
      assault: 32,
      sexual_offence: 9,
      harassment: 50,
      kidnapping: 9,
      burglary: 18,
      other: 145,
    },
    topConcerns: [
      "High footfall — pickpocketing & phone snatching at Atta Market and Sector 18",
      "Sexual harassment reported around late-night nightlife",
      "Vehicle theft from market parking lots",
    ],
  },
  {
    id: "Sector 39",
    name: "Sector 39",
    neighborhoods: "Sectors 30-31, 33-38, 38A, 39, 41, Botanical Garden, City Centre metro",
    population: 140_000,
    breakdown: {
      theft: 270,
      robbery: 5,
      assault: 35,
      sexual_offence: 11,
      harassment: 55,
      kidnapping: 10,
      burglary: 19,
      other: 150,
    },
    topConcerns: [
      "Nightlife belt around Sector 38A — harassment, brawls, drunk-driving",
      "Snatching at Botanical Garden / City Centre metro interchange",
      "Petty theft in crowded weekend hangouts (GIP, DLF Mall adjacency)",
    ],
  },
  {
    id: "Sector 49",
    name: "Sector 49",
    neighborhoods: "Sectors 44-55, Barola, Sarfabad urban village, Green Valley Chowk",
    population: 125_000,
    breakdown: {
      theft: 190,
      robbery: 4,
      assault: 30,
      sexual_offence: 10,
      harassment: 40,
      kidnapping: 8,
      burglary: 15,
      other: 120,
    },
    topConcerns: [
      "Urban-village belts (Barola, Sarfabad) — assault & harassment of migrants",
      "Poorly lit internal lanes between high-rise sectors and villages",
      "Vehicle theft from society peripheries",
    ],
  },
  {
    id: "Sector 58",
    name: "Sector 58",
    neighborhoods: "Sectors 56-65, Sector 62 office hub, Noida-Ghaziabad border belt",
    population: 110_000,
    breakdown: {
      theft: 235,
      robbery: 5,
      assault: 32,
      sexual_offence: 9,
      harassment: 42,
      kidnapping: 9,
      burglary: 16,
      other: 130,
    },
    topConcerns: [
      "Office-hub thefts after working hours (Sector 62 IT belt)",
      "Border-area snatching toward Ghaziabad / Indirapuram",
      "Late-night cab-related harassment reports",
    ],
  },
  {
    id: "Phase 2",
    name: "Phase 2",
    neighborhoods: "Noida Phase 2 industrial area, Hosiery Complex, Sectors 80-83, Hoshiyarpur urban village",
    population: 95_000,
    breakdown: {
      theft: 165,
      robbery: 4,
      assault: 35,
      sexual_offence: 11,
      harassment: 38,
      kidnapping: 9,
      burglary: 13,
      other: 115,
    },
    topConcerns: [
      "Industrial-belt thefts — factory pilferage and contractor disputes",
      "Migrant-worker concentration — assault and harassment of women workers",
      "Truck-route robberies on Dadri Main Road late at night",
    ],
  },
  {
    id: "Phase 3",
    name: "Phase 3",
    neighborhoods: "Sectors 66-75, Sector 71 (B Block), Mamura, Chhalera urban village edge",
    population: 100_000,
    breakdown: {
      theft: 175,
      robbery: 4,
      assault: 28,
      sexual_offence: 8,
      harassment: 35,
      kidnapping: 8,
      burglary: 13,
      other: 110,
    },
    topConcerns: [
      "Mixed residential / industrial — opportunistic theft",
      "Urban-village (Mamura, Chhalera) — harassment & late-night assault",
      "Snatching at sector-market entries",
    ],
  },
  {
    id: "Sector 113",
    name: "Sector 113",
    neighborhoods: "Sectors 110-120, Sector 115, 116, Hajipur, Sector 117-120 residential",
    population: 95_000,
    breakdown: {
      theft: 145,
      robbery: 3,
      assault: 22,
      sexual_offence: 7,
      harassment: 28,
      kidnapping: 6,
      burglary: 11,
      other: 95,
    },
    topConcerns: [
      "Newer residential belt — burglaries in under-occupied high-rises",
      "Isolated internal roads at night between sectors",
      "Vehicle theft from open society parking",
    ],
  },
  {
    id: "Sector 126",
    name: "Sector 126",
    neighborhoods: "Sectors 121-130, 142, Noida-Greater Noida Expressway tech corridor, Sector 125 (Amity)",
    population: 95_000,
    breakdown: {
      theft: 165,
      robbery: 4,
      assault: 22,
      sexual_offence: 7,
      harassment: 30,
      kidnapping: 7,
      burglary: 12,
      other: 110,
    },
    topConcerns: [
      "Cab / ride-share harassment reported on Expressway service road",
      "Phone snatching outside tech-park gates (Sector 125-127)",
      "Late-night vehicle theft from Expressway-side societies",
    ],
  },
  {
    id: "Expressway",
    name: "Expressway",
    neighborhoods: "Sectors 131-137 and 143-168, Sector 137, 143, 150, 168, Expressway service road",
    population: 95_000,
    breakdown: {
      theft: 120,
      robbery: 2,
      assault: 20,
      sexual_offence: 4,
      harassment: 20,
      kidnapping: 17,
      burglary: 10,
      other: 120,
    },
    topConcerns: [
      "Highway-interchange robberies & vehicle stops late at night",
      "Long isolated stretches between Expressway sector cuts",
      "Burglaries in under-occupied newer high-rises (Sector 150, 168)",
    ],
  },
];
