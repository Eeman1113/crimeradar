"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import RiskBadge from "@/components/RiskBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Ward } from "@/lib/types";
import type { CityId } from "@/lib/cities";
import posthog from "posthog-js";
import { useI18n } from "@/lib/i18n/provider";
import { wardSlug } from "@/lib/wards";

type Variant = "high" | "low";

export default function RankList({
  city,
  wards,
  variant,
}: {
  city: CityId;
  wards: Ward[];
  variant: Variant;
}) {
  const params = useSearchParams();
  const { t } = useI18n();
  const isNight = params.get("night") === "1";
  const isWomen = params.get("women") === "1";

  const rows = useMemo(() => {
    const score = (w: Ward) =>
      isWomen
        ? isNight
          ? w.riskScoreWomenNight
          : w.riskScoreWomen
        : isNight
          ? w.riskScoreNight
          : w.riskScore;
    const sorted = [...wards].sort((a, b) => score(b) - score(a));
    return variant === "high" ? sorted.slice(0, 5) : sorted.slice(-5).reverse();
  }, [wards, variant, isNight, isWomen]);

  const titleKey =
    variant === "high"
      ? isNight
        ? "rank_high_night"
        : "rank_high_day"
      : isNight
        ? "rank_low_night"
        : "rank_low_day";
  const Icon = variant === "high" ? TrendingUp : TrendingDown;

  const qsParts: string[] = [];
  if (isNight) qsParts.push("night=1");
  if (isWomen) qsParts.push("women=1");
  const qs = qsParts.length ? `?${qsParts.join("&")}` : "";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Icon
            className={
              variant === "high"
                ? "h-3.5 w-3.5 text-red-500"
                : "h-3.5 w-3.5 text-emerald-500"
            }
          />
          {t(titleKey as never)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ul className="flex flex-col">
          {rows.map((w) => {
            const score = isWomen
              ? isNight
                ? w.riskScoreWomenNight
                : w.riskScoreWomen
              : isNight
                ? w.riskScoreNight
                : w.riskScore;
            return (
              <li key={w.id}>
                <Link
                  href={`/${city}/ward/${wardSlug(w.id)}/${qs}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-accent transition-colors min-w-0"
                  onClick={() => posthog.capture("rank_list_ward_clicked", { city, ward_id: w.id, variant, risk_score: score })}
                >
                  <span className="flex flex-col min-w-0 flex-1">
                    <span
                      className="text-sm font-medium truncate"
                      title={w.name}
                    >
                      {w.name}
                    </span>
                    <span
                      className="text-xs text-muted-foreground truncate"
                      title={w.neighborhoods}
                    >
                      {w.neighborhoods}
                    </span>
                  </span>
                  <RiskBadge score={score} size="sm" />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
