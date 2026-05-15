import mumbai from "@/data/cities/mumbai/absconders.json";
import bangalore from "@/data/cities/bangalore/absconders.json";
import delhi from "@/data/cities/delhi/absconders.json";
import chennai from "@/data/cities/chennai/absconders.json";
import hyderabad from "@/data/cities/hyderabad/absconders.json";
import kolkata from "@/data/cities/kolkata/absconders.json";

import type { CityId } from "./cities";

export type Absconder = {
  id: string;
  pdfId?: string;
  sourcePdfUrl?: string;
  sourceUrl?: string;
  name: string;
  isOrganisation: boolean;
};

export type AbsconderFile = {
  source: string | null;
  scrapedAt: string | null;
  count: number;
  absconders: Absconder[];
  notes: string;
};

const FILES: Record<CityId, AbsconderFile> = {
  mumbai: mumbai as AbsconderFile,
  bangalore: bangalore as AbsconderFile,
  delhi: delhi as AbsconderFile,
  chennai: chennai as AbsconderFile,
  hyderabad: hyderabad as AbsconderFile,
  kolkata: kolkata as AbsconderFile,
};

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
