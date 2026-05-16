// Pune Municipal Corporation administrative ward offices (Kshetriya Karyalaya).
// Pune City Police covers PMC area; Pimpri-Chinchwad (PCMC) is a separate
// commissionerate and is intentionally NOT included.
//
// Crime breakdowns are MODELLED, not measured. Pune City Police publishes
// only city-wide aggregates (annual statistics report at
// https://admin.punepolice.gov.in/CrimeStatistics) and NCRB publishes only
// city totals. There is no public per-ward crime feed.
//
// Methodology
// 1. City-wide totals: built per category from NCRB "Crime in India 2014"
//    per-100k rates for Pune (the most recent per-category open table at
//    crime-in-india.github.io/cities/Pune), projected to PMC's 2024 population
//    (~3.5M), then rescaled so the IPC total matches NCRB Crime in India 2023
//    headline figure for Pune (~17,022 cases).
// 2. Ward populations: 2017 electoral-roll voter counts per ward (datameet
//    Pune_wards CSV), aggregated under each admin ward, scaled to PMC's ~3.5M
//    projected 2024 population.
// 3. Per-ward category counts: baseline = (ward_pop/city_pop) * city_total,
//    multiplied by a per-ward density factor (0.8-1.45 reflecting affluence,
//    informal-settlement share, transit/nightlife/market intensity) and per-
//    category boosts (e.g. harassment + sexual_offence higher near Koregaon
//    Park and Bhavani Peth; burglary higher in low-density residential like
//    Aundh and Kothrud). Each category is then rescaled so the sum across
//    wards equals the city total (within 1-2 from integer rounding).
//
// See data/cities/pune/monthly_stats.json for the live YTD-totals slot, which
// is populated by the (TBD) Pune-specific scraper.

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
    id: "AUNDH",
    name: "Aundh - Baner",
    neighborhoods: "Aundh, Baner, Balewadi, Pashan, Bopodi, Sutarwadi",
    population: 181124_000,
    breakdown: {
      theft: 400,
      harassment: 82,
      sexual_offence: 28,
      assault: 37,
      robbery: 62,
      burglary: 149,
      kidnapping: 16,
      other: 69,
    },
    topConcerns: [
      "Vehicle theft and house break-ins in low-density residential lanes",
      "Snatching reported along Baner Road / Balewadi after dark",
    ],
  },
  {
    id: "GHOLE_ROAD",
    name: "Ghole Road",
    neighborhoods: "Shivajinagar, Deccan Gymkhana, Model Colony, Gokhale Nagar, Senapati Bapat Road",
    population: 171678_000,
    breakdown: {
      theft: 513,
      harassment: 129,
      sexual_offence: 45,
      assault: 60,
      robbery: 101,
      burglary: 134,
      kidnapping: 24,
      other: 82,
    },
    topConcerns: [
      "Pickpocketing and snatching around Shivajinagar bus/rail interchange",
      "Harassment near college clusters (FC Road, JM Road) after evening",
    ],
  },
  {
    id: "KOTHRUD",
    name: "Kothrud - Karve Road",
    neighborhoods: "Kothrud, Bawdhan, Erandwane (west), Mayur Colony, Bhusari Colony",
    population: 209331_000,
    breakdown: {
      theft: 319,
      harassment: 75,
      sexual_offence: 26,
      assault: 35,
      robbery: 60,
      burglary: 132,
      kidnapping: 16,
      other: 61,
    },
    topConcerns: [
      "Residential burglaries in independent bungalows and older societies",
      "Vehicle theft along Paud Road / Karve Road corridor",
    ],
  },
  {
    id: "WARJE_KARVENAGAR",
    name: "Warje - Karvenagar",
    neighborhoods: "Warje, Karvenagar, Erandwane, Shivane, Dahanukar Colony",
    population: 233399_000,
    breakdown: {
      theft: 381,
      harassment: 90,
      sexual_offence: 31,
      assault: 45,
      robbery: 73,
      burglary: 138,
      kidnapping: 20,
      other: 69,
    },
    topConcerns: [
      "Burglary risk in independent-house pockets",
      "Snatching reported along Sinhgad approach road late at night",
    ],
  },
  {
    id: "DHOLE_PATIL",
    name: "Dhole Patil Road",
    neighborhoods: "Koregaon Park, Camp, Boat Club, Bund Garden, Mundhwa, Magarpatta (west fringe)",
    population: 155413_000,
    breakdown: {
      theft: 698,
      harassment: 195,
      sexual_offence: 67,
      assault: 74,
      robbery: 135,
      burglary: 166,
      kidnapping: 29,
      other: 105,
    },
    topConcerns: [
      "Harassment and snatching around Koregaon Park / North Main Road nightlife",
      "Phone theft and pickpocketing on MG Road and Camp markets",
      "Drugs-linked incidents reported around Mundhwa and KP fringes",
    ],
  },
  {
    id: "YERAWDA_SANGAMWADI",
    name: "Yerawda - Sangamwadi",
    neighborhoods: "Yerwada, Vishrantwadi, Lohegaon, Kalas, Dhanori, Sangamwadi",
    population: 269642_000,
    breakdown: {
      theft: 572,
      harassment: 143,
      sexual_offence: 50,
      assault: 87,
      robbery: 134,
      burglary: 164,
      kidnapping: 32,
      other: 99,
    },
    topConcerns: [
      "Mixed slum-and-society pockets with reported assault and robbery cases",
      "Snatching along Vishrantwadi - Lohegaon airport stretch",
    ],
  },
  {
    id: "NAGAR_ROAD",
    name: "Nagar Road",
    neighborhoods: "Kharadi, Viman Nagar, Wadgaon Sheri, Chandan Nagar, Kalyani Nagar",
    population: 239564_000,
    breakdown: {
      theft: 688,
      harassment: 159,
      sexual_offence: 53,
      assault: 71,
      robbery: 131,
      burglary: 192,
      kidnapping: 29,
      other: 106,
    },
    topConcerns: [
      "Vehicle and laptop theft along the IT corridor (Kharadi, Viman Nagar)",
      "Harassment of commuting women reported on Nagar Road service lanes",
    ],
  },
  {
    id: "KASBA_VISHRAMBAUG",
    name: "Kasba - Vishrambaugwada",
    neighborhoods: "Shaniwar Peth, Kasba Peth, Shukrawar Peth, Sadashiv Peth (north), Tulshibaug",
    population: 178484_000,
    breakdown: {
      theft: 868,
      harassment: 194,
      sexual_offence: 62,
      assault: 91,
      robbery: 160,
      burglary: 173,
      kidnapping: 34,
      other: 118,
    },
    topConcerns: [
      "Pickpocketing in crowded peth markets (Tulshibaug, Mandai, Laxmi Road)",
      "Eve-teasing reported in narrow market lanes after dusk",
    ],
  },
  {
    id: "TILAK_ROAD",
    name: "Tilak Road",
    neighborhoods: "Sadashiv Peth, Narayan Peth, Sinhagad Road, Vadgaon, Dhayari, Dattawadi",
    population: 242290_000,
    breakdown: {
      theft: 471,
      harassment: 117,
      sexual_offence: 41,
      assault: 60,
      robbery: 96,
      burglary: 148,
      kidnapping: 25,
      other: 81,
    },
    topConcerns: [
      "Snatching along Sinhgad Road service lanes at night",
      "Residential burglaries in older society pockets",
    ],
  },
  {
    id: "SAHAKARNAGAR",
    name: "Sahakar Nagar",
    neighborhoods: "Sahakar Nagar, Parvati, Sarasbaug, Swargate, Mukundnagar, Maharshi Nagar",
    population: 205441_000,
    breakdown: {
      theft: 407,
      harassment: 94,
      sexual_offence: 31,
      assault: 43,
      robbery: 80,
      burglary: 107,
      kidnapping: 18,
      other: 59,
    },
    topConcerns: [
      "Phone snatching and pickpocketing around Swargate bus terminus",
      "Petty theft on Sarasbaug / Saras Garden visitor stretches",
    ],
  },
  {
    id: "BIBVEWADI",
    name: "Bibvewadi",
    neighborhoods: "Bibvewadi, Market Yard, Lullanagar, Salisbury Park, Indira Nagar, Chintamani Nagar",
    population: 291446_000,
    breakdown: {
      theft: 403,
      harassment: 96,
      sexual_offence: 34,
      assault: 49,
      robbery: 83,
      burglary: 115,
      kidnapping: 19,
      other: 64,
    },
    topConcerns: [
      "Theft and cheating cases around the Market Yard wholesale hub",
      "Mixed society-and-chawl pockets with reported assault cases",
    ],
  },
  {
    id: "BHAVANI_PETH",
    name: "Bhavani Peth",
    neighborhoods: "Bhavani Peth, Nana Peth, Ganesh Peth, Rasta Peth, Lohiya Nagar, Timber Market",
    population: 192932_000,
    breakdown: {
      theft: 940,
      harassment: 212,
      sexual_offence: 68,
      assault: 109,
      robbery: 182,
      burglary: 181,
      kidnapping: 40,
      other: 129,
    },
    topConcerns: [
      "Dense peth lanes with poor lighting; assault and robbery reported",
      "Pickpocketing in Mandai / wholesale markets",
      "Communally sensitive pockets historically linked to disorder",
    ],
  },
  {
    id: "HADAPSAR",
    name: "Hadapsar",
    neighborhoods: "Hadapsar, Magarpatta, Mundhwa, Sasane Nagar, Gondhalenagar, Satavwadi",
    population: 324751_000,
    breakdown: {
      theft: 402,
      harassment: 93,
      sexual_offence: 32,
      assault: 52,
      robbery: 83,
      burglary: 111,
      kidnapping: 20,
      other: 61,
    },
    topConcerns: [
      "Theft and assault reported in industrial-area lanes after shifts end",
      "Snatching along Solapur Road service stretch",
    ],
  },
  {
    id: "DHANKAWADI",
    name: "Dhankawadi",
    neighborhoods: "Dhankawadi, Katraj, Ambegaon Budruk, Ambegaon Khurd, Balaji Nagar, Bharati Vidyapeeth",
    population: 236648_000,
    breakdown: {
      theft: 421,
      harassment: 110,
      sexual_offence: 38,
      assault: 59,
      robbery: 90,
      burglary: 152,
      kidnapping: 23,
      other: 73,
    },
    topConcerns: [
      "Peripheral residential lanes isolated at night",
      "Burglary in independent-house pockets along Katraj approaches",
    ],
  },
  {
    id: "KONDHWA_WANAVDI",
    name: "Kondhwa - Wanavadi",
    neighborhoods: "Kondhwa Budruk, Kondhwa Khurd, Wanowrie, NIBM, Undri, Mohammadwadi, Salunkhe Vihar",
    population: 185905_000,
    breakdown: {
      theft: 537,
      harassment: 134,
      sexual_offence: 49,
      assault: 75,
      robbery: 120,
      burglary: 185,
      kidnapping: 28,
      other: 89,
    },
    topConcerns: [
      "House break-ins in NIBM / Kondhwa residential pockets",
      "Mixed informal-settlement clusters with reported assault and robbery",
    ],
  },
];
