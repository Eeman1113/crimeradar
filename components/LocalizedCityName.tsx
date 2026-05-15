"use client";

import type { CityId } from "@/lib/cities";
import { useI18n } from "@/lib/i18n/provider";

// Renders a city's display name in the current UI locale. Falls back to
// English. Use this inside server components for page titles, breadcrumbs,
// etc. — it hydrates client-side and swaps to the localized form.
export default function LocalizedCityName({ cityId }: { cityId: CityId }) {
  const { cityName } = useI18n();
  return <>{cityName(cityId)}</>;
}
