import { BarChart3 } from "lucide-react";
import { CRIME_CATEGORY_LABELS, type CrimeCategory } from "@/lib/types";
import type { CityId } from "@/lib/cities";
import { getCity } from "@/lib/cities";
import { monthlyStatsMeta } from "@/lib/wards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  const kind = meta.windowKind;
  const monthShort = (m: number) =>
    new Date(2000, m - 1, 1).toLocaleString("en-IN", { month: "short" });
  const windowLabel =
    kind === "month" && year && month
      ? `${monthShort(month)} ${year}`
      : kind === "year" && year
        ? `Year ${year}`
        : kind === "ytd" && year && month
          ? `Jan–${monthShort(month)} ${year}`
          : year
            ? `Year ${year}`
            : meta.scrapedAt
              ? `As of ${meta.scrapedAt.slice(0, 10)}`
              : "Latest published";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-sky-500" />
          {cfg.name} reported incidents
        </CardTitle>
        <CardDescription className="text-xs">
          {windowLabel} · city-aggregate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {present.map((c) => (
            <li key={c} className="flex justify-between gap-2">
              <span className="text-muted-foreground">
                {CRIME_CATEGORY_LABELS[c]}
              </span>
              <span className="font-mono tabular-nums">
                {(totals[c] ?? 0).toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
        <Separator className="my-3" />
        <div className="flex justify-between text-sm font-medium">
          <span>Total</span>
          <span className="font-mono tabular-nums">
            {grand.toLocaleString("en-IN")}
          </span>
        </div>
        {meta.source ? (
          <p className="text-xs text-muted-foreground mt-3">
            Source:{" "}
            <a
              href={meta.source}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              official publication
            </a>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
