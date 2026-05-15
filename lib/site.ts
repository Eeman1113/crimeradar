// Single source of truth for the deploy-time base path. GitHub Pages serves
// the app under https://eeman1113.github.io/crimeradar/, so links and static
// asset paths need the /crimeradar prefix. Local dev uses an empty prefix.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBase(p: string): string {
  if (!BASE_PATH) return p;
  if (!p.startsWith("/")) return p;
  return BASE_PATH + p;
}
