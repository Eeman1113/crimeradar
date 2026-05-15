import data from "@/data/absconders.json";

export type Absconder = {
  id: string;
  pdfId: string;
  sourcePdfUrl: string;
  name: string;
  isOrganisation: boolean;
};

export type AbsconderFile = {
  source: string;
  scrapedAt: string;
  count: number;
  absconders: Absconder[];
  notes: string;
};

const FILE = data as AbsconderFile;
const BY_ID = new Map(FILE.absconders.map((a) => [a.id, a]));

export function listAbsconders(): Absconder[] {
  return FILE.absconders;
}

export function getAbsconder(id: string): Absconder | undefined {
  return BY_ID.get(id);
}

export function absconderSourceUrl(): string {
  return FILE.source;
}

export function absconderScrapedAt(): string {
  return FILE.scrapedAt;
}

export function absconderNotes(): string {
  return FILE.notes;
}
