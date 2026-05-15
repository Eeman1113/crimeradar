export type CrimeCategory =
  | "theft"
  | "robbery"
  | "assault"
  | "sexual_offence"
  | "harassment"
  | "kidnapping"
  | "burglary"
  | "other";

export const CRIME_CATEGORY_LABELS: Record<CrimeCategory, string> = {
  theft: "Theft / Chain-snatching",
  robbery: "Robbery",
  assault: "Assault",
  sexual_offence: "Sexual offences",
  harassment: "Harassment / Eve-teasing",
  kidnapping: "Kidnapping",
  burglary: "Burglary",
  other: "Other",
};

export type DataQuality = "seeded" | "calibrated" | "live";

export type CrimeBreakdown = Partial<Record<CrimeCategory, number>>;

export type Ward = {
  id: string;
  name: string;
  neighborhoods: string;
  population: number;
  riskScore: number;
  riskScoreNight: number;
  riskScoreWomen: number;
  riskScoreWomenNight: number;
  breakdown: CrimeBreakdown;
  topConcerns: string[];
  dataQuality: DataQuality;
};

export type Absconder = {
  id: string;
  name: string;
  aliases: string[];
  chargesNormalized: CrimeCategory[];
  chargesRaw: string;
  wardId: string | null;
  station: string | null;
  listedOn: string;
  sourcePdfUrl: string;
};

export type RiskResponse = {
  ward: Ward | null;
  outsideMumbai: boolean;
};
