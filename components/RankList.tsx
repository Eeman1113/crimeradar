"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import RiskBadge from "@/components/RiskBadge";
import type { Ward } from "@/lib/types";
import { wardSlug } from "@/lib/wards";

type Variant = "high" | "low";

export default function RankList({
  wards,
  variant,
}: {
  wards: Ward[];
  variant: Variant;
}) {
  const params = useSearchParams();
  const isNight = params.get("night") === "1";

  const rows = useMemo(() => {
    const score = (w: Ward) => (isNight ? w.riskScoreNight : w.riskScore);
    const sorted = [...wards].sort((a, b) => score(b) - score(a));
    return variant === "high" ? sorted.slice(0, 5) : sorted.slice(-5).reverse();
  }, [wards, variant, isNight]);

  const title =
    variant === "high"
      ? isNight
        ? "Highest risk (night)"
        : "Highest risk (day)"
      : isNight
        ? "Lowest risk (night)"
        : "Lowest risk (day)";

  const qs = isNight ? "?night=1" : "";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="text-sm font-semibold text-zinc-200 mb-3">{title}</h3>
      <ul className="flex flex-col gap-2">
        {rows.map((w) => {
          const score = isNight ? w.riskScoreNight : w.riskScore;
          return (
            <li key={w.id}>
              <Link
                href={`/ward/${wardSlug(w.id)}${qs}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-zinc-800"
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-100">
                    Ward {w.id}
                  </span>
                  <span className="text-xs text-zinc-500 truncate max-w-[180px]">
                    {w.neighborhoods}
                  </span>
                </span>
                <RiskBadge score={score} size="sm" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
