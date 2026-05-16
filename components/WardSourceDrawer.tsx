"use client";

import { ExternalLink, FileText, Info, Scale } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getCity, type CityId } from "@/lib/cities";
import { withBase } from "@/lib/site";
import { getWard, monthlyStatsMeta } from "@/lib/wards";
import { STATS_JSON } from "@/lib/wards.generated";

type Props = {
  cityId: string;
  wardId: string;
};

type RawStats = {
  source?: string | null;
  indexUrl?: string | null;
  scrapedAt?: string | null;
  publishedFor?: { year?: number; month?: number } | null;
  windowKind?: "ytd" | "month" | "year";
  notes?: string;
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatWindow(
  publishedFor: { year?: number; month?: number } | null | undefined,
  windowKind: "ytd" | "month" | "year" | undefined,
) {
  if (!publishedFor?.year) return null;
  const year = publishedFor.year;
  if (windowKind === "month" && publishedFor.month) {
    const monthName = new Date(year, publishedFor.month - 1, 1).toLocaleString(
      undefined,
      { month: "long" },
    );
    return `${monthName} ${year}`;
  }
  if (windowKind === "ytd" && publishedFor.month) {
    const monthName = new Date(year, publishedFor.month - 1, 1).toLocaleString(
      undefined,
      { month: "long" },
    );
    return `YTD through ${monthName} ${year}`;
  }
  if (windowKind === "year") return `Annual ${year}`;
  return `${year}`;
}

function hostnameOf(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function WardSourceDrawer({ cityId, wardId }: Props) {
  const [open, setOpen] = useState(false);

  const city = getCity(cityId);
  const ward = city ? getWard(cityId as CityId, wardId) : undefined;
  const meta = city ? monthlyStatsMeta(cityId as CityId) : null;
  const rawStats = (city
    ? ((STATS_JSON as Record<string, RawStats>)[cityId] ?? null)
    : null) as RawStats | null;

  const sourceUrl = meta?.source ?? null;
  const indexUrl = rawStats?.indexUrl ?? null;
  const scrapedAt = formatDate(meta?.scrapedAt);
  const window = formatWindow(meta?.publishedFor, meta?.windowKind);
  const sourceHost = hostnameOf(sourceUrl) ?? hostnameOf(indexUrl);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
        >
          <Info className="h-3 w-3" />
          View source
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-sky-500" />
            Source &amp; provenance
          </SheetTitle>
          <SheetDescription>
            {ward?.name ?? wardId}
            {city ? <> &middot; {city.name}</> : null}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4 text-sm">
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              City-level source
            </h3>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1.5 break-all text-sky-600 hover:underline dark:text-sky-400"
              >
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {sourceHost ?? sourceUrl}
                  {city ? (
                    <span className="text-muted-foreground">
                      {" "}
                      &mdash; {city.name} police statistics
                    </span>
                  ) : null}
                </span>
              </a>
            ) : (
              <p className="text-muted-foreground">
                No published source on file for this city yet.
              </p>
            )}
            {indexUrl && indexUrl !== sourceUrl ? (
              <a
                href={indexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1.5 break-all text-xs text-muted-foreground hover:underline"
              >
                <ExternalLink className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>Index page: {hostnameOf(indexUrl) ?? indexUrl}</span>
              </a>
            ) : null}
            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
              {scrapedAt ? (
                <>
                  <dt className="text-muted-foreground">Scraped</dt>
                  <dd>{scrapedAt}</dd>
                </>
              ) : null}
              {window ? (
                <>
                  <dt className="text-muted-foreground">Reporting window</dt>
                  <dd>{window}</dd>
                </>
              ) : null}
              {meta?.windowKind ? (
                <>
                  <dt className="text-muted-foreground">Window kind</dt>
                  <dd className="font-mono text-[11px]">{meta.windowKind}</dd>
                </>
              ) : null}
            </dl>
          </section>

          <section className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900/40 dark:bg-amber-950/30">
            <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
              <Scale className="h-3.5 w-3.5" />
              How ward-level values are derived
            </div>
            <p className="leading-relaxed text-amber-900 dark:text-amber-100">
              Per-ward values are apportioned from the city total using
              population weights. The police data on file is published only at
              the city level &mdash; ward numbers are a modelled estimate, not
              measured ground truth. See methodology.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              References
            </h3>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link href="/methodology" onClick={() => setOpen(false)}>
                <FileText className="h-3.5 w-3.5" />
                Read full methodology
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <a
                href={withBase("/data/apportioning_weights.csv")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                apportioning_weights.csv
              </a>
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
