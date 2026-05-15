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

  const rows = useMemo(() => {
    const score = (w: Ward) => (isNight ? w.riskScoreNight : w.riskScore);
    const sorted = [...wards].sort((a, b) => score(b) - score(a));
    return variant === "high" ? sorted.slice(0, 5) : sorted.slice(-5).reverse();
  }, [wards, variant, isNight]);

  const titleKey =
    variant === "high"
      ? isNight
        ? "rank_high_night"
        : "rank_high_day"
      : isNight
        ? "rank_low_night"
        : "rank_low_day";
  const Icon = variant === "high" ? TrendingUp : TrendingDown;

  const qs = isNight ? "?night=1" : "";

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
            const score = isNight ? w.riskScoreNight : w.riskScore;
            return (
              <li key={w.id}>
                <Link
                  href={`/${city}/ward/${wardSlug(w.id)}/${qs}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                >
                  <span className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate max-w-[180px]">
                      {w.name.length > 18 ? w.name.slice(0, 18) + "…" : w.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
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
