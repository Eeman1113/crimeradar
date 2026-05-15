import { CRIME_CATEGORY_LABELS, type CrimeCategory } from "@/lib/types";
import type { CityId } from "@/lib/cities";
import { getCity } from "@/lib/cities";
import { monthlyStatsMeta } from "@/lib/wards";

const ORDER: CrimeCategory[] = [
  "sexual_offence",
  "harassment",
  "assault",
  "kidnapping",
  "robbery",
  "theft",
  "burglary",
  "other",
];

export default function CityStatsCard({ city }: { city: CityId }) {
  const meta = monthlyStatsMeta(city);
  const cfg = getCity(city)!;
  const totals = meta.totals as Partial<Record<CrimeCategory, number>>;
  const present = ORDER.filter((c) => (totals[c] ?? 0) > 0);
  if (present.length === 0) return null;

  const grand = present.reduce((a, c) => a + (totals[c] ?? 0), 0);
  const year = meta.publishedFor?.year;
  const month = meta.publishedFor?.month;
  const window =
    year && month
      ? `Jan–${new Date(year, month - 1, 1)
          .toLocaleString("en-IN", { month: "short" })
          .toLowerCase()} ${year}`
      : year
        ? `Year ${year}`
        : meta.scrapedAt
          ? `As of ${meta.scrapedAt.slice(0, 10)}`
          : "Latest published";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">
          {cfg.name} reported incidents
        </h3>
        <p className="text-xs text-zinc-500">{window} (city-aggregate)</p>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        {present.map((c) => (
          <li key={c} className="flex justify-between gap-2">
            <span className="text-zinc-400">
              {CRIME_CATEGORY_LABELS[c]}
            </span>
            <span className="font-mono text-zinc-100">
              {(totals[c] ?? 0).toLocaleString("en-IN")}
            </span>
          </li>
        ))}
        <li className="col-span-2 mt-1 pt-2 border-t border-zinc-800 flex justify-between font-medium">
          <span className="text-zinc-200">Total</span>
          <span className="font-mono text-zinc-50">
            {grand.toLocaleString("en-IN")}
          </span>
        </li>
      </ul>
      {meta.source ? (
        <p className="text-xs text-zinc-500">
          Source:{" "}
          <a
            href={meta.source}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            official publication
          </a>
        </p>
      ) : null}
    </div>
  );
}
