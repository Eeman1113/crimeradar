import { ABSCONDERS_JSON } from "./absconders.generated";

import type { CityId } from "./cities";

export type Absconder = {
  id: string;
  pdfId?: string;
  sourcePdfUrl?: string;
  sourceUrl?: string;
  name: string;
  isOrganisation: boolean;
  caseRef?: string | null;
  section?: string | null;
};

export type AbsconderFile = {
  source: string | null;
  scrapedAt: string | null;
  count: number;
  absconders: Absconder[];
  notes: string;
};

const FILES = ABSCONDERS_JSON as Record<CityId, AbsconderFile>;

const INDEXES: Record<CityId, Map<string, Absconder>> = Object.fromEntries(
  (Object.keys(FILES) as CityId[]).map((c) => [
    c,
    new Map(FILES[c].absconders.map((a) => [a.id, a])),
  ]),
) as Record<CityId, Map<string, Absconder>>;

export function listAbsconders(city: CityId): Absconder[] {
  return FILES[city].absconders;
}

export function getAbsconder(
  city: CityId,
  id: string,
): Absconder | undefined {
  return INDEXES[city]?.get(id);
}

export function absconderSourceUrl(city: CityId): string | null {
  return FILES[city].source;
}

export function absconderScrapedAt(city: CityId): string | null {
  return FILES[city].scrapedAt;
}

export function absconderNotes(city: CityId): string {
  return FILES[city].notes;
}

export function absconderFileSources(): string[] {
  return (Object.keys(FILES) as CityId[])
    .map((c) => FILES[c]?.source)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}
