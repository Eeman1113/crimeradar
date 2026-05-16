"use client";

import { Clock, ExternalLink, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CITIES, CITY_IDS } from "@/lib/cities";
import { listAbsconders } from "@/lib/absconders";
import { cityDataQuality, historyMeta, monthlyStatsMeta } from "@/lib/wards";
import { useI18n } from "@/lib/i18n/provider";

const QUALITY_TOOLTIPS: Record<string, string> = {
  calibrated:
    "City total matches the official source. Per-ward distribution is modelled, not measured.",
  seeded:
    "Per-ward values are illustrative estimates, not police data. Treat as exploratory.",
  live: "Sourced directly from official monthly police releases.",
  estimated: "Estimated from limited sources — see methodology.",
};

function qualityTitle(q: string | null | undefined) {
  if (!q) return QUALITY_TOOLTIPS.estimated;
  return QUALITY_TOOLTIPS[q] ?? QUALITY_TOOLTIPS.estimated;
}

function daysSince(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function freshness(days: number | null) {
  if (days == null) return "text-muted-foreground";
  if (days <= 7) return "text-emerald-600 dark:text-emerald-400";
  if (days <= 35) return "text-sky-600 dark:text-sky-400";
  if (days <= 200) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default function DataFreshnessPanel() {
  const { cityName } = useI18n();
  const rows = CITY_IDS.map((id) => {
    const stats = monthlyStatsMeta(id);
    const hist = historyMeta(id);
    const absC = listAbsconders(id).length;
    const absScraped = listAbsconders(id)[0]
      ? null // we don't store per-absconder scrapedAt
      : null;
    return {
      id,
      name: cityName(id),
      stats: stats.source ? stats : null,
      hist,
      absconderCount: absC,
      absconderSource: absScraped,
      quality: cityDataQuality(id),
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-sky-500" />
          Data freshness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-2 pr-2 font-medium">City</th>
                <th className="py-2 pr-2 font-medium">Quality</th>
                <th className="py-2 pr-2 font-medium">City stats</th>
                <th className="py-2 pr-2 font-medium">History</th>
                <th className="py-2 pr-2 font-medium">Absconders</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const statsDays = daysSince(r.stats?.scrapedAt ?? null);
                const histDays = daysSince(r.hist?.scrapedAt ?? null);
                return (
                  <tr key={r.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-2 font-medium">{r.name}</td>
                    <td className="py-2 pr-2">
                      {r.quality && r.quality !== "empty" ? (
                        <span
                          title={qualityTitle(r.quality)}
                          className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium text-muted-foreground cursor-help"
                        >
                          {r.quality}
                        </span>
                      ) : (
                        <span
                          title={qualityTitle("estimated")}
                          className="inline-flex items-center text-muted-foreground cursor-help"
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {r.stats?.source ? (
                        <span
                          className={`inline-flex items-center gap-1 ${freshness(statsDays)}`}
                        >
                          <FileText className="h-3 w-3" />
                          <a
                            href={r.stats.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {statsDays != null
                              ? `${statsDays}d old`
                              : "unknown"}
                          </a>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {r.hist.count > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1 ${freshness(histDays)}`}
                        >
                          {r.hist.count} months
                          {histDays != null ? (
                            <span className="text-muted-foreground">
                              {" "}
                              · {histDays}d old
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {r.absconderCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          {r.absconderCount} names
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          City stats refresh monthly (1st of each month); absconders refresh
          weekly (Mondays). Both run via GitHub Actions and commit any data
          deltas back to the repo, which redeploys the site within ~1 minute.
          Click a value to open the official source.
        </p>
      </CardContent>
    </Card>
  );
}
