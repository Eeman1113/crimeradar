"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RiskBadge from "@/components/RiskBadge";
import type { Ward } from "@/lib/types";
import type { CityId } from "@/lib/cities";

export default function WardScoreDisplay({
  city,
  ward,
}: {
  city: CityId;
  ward: Ward;
}) {
  const params = useSearchParams();
  const isNight = params.get("night") === "1";
  const isWomen = params.get("women") === "1";
  const score = isWomen
    ? isNight
      ? ward.riskScoreWomenNight
      : ward.riskScoreWomen
    : isNight
      ? ward.riskScoreNight
      : ward.riskScore;
  const qsParts: string[] = [];
  if (isNight) qsParts.push("night=1");
  if (isWomen) qsParts.push("women=1");
  const backHref = qsParts.length ? `/${city}?${qsParts.join("&")}` : `/${city}`;
  return (
    <>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to map
      </Link>
      <div className="flex items-center gap-4 mt-4">
        <RiskBadge score={score} size="lg" />
        <p className="text-sm text-muted-foreground">
          {isWomen ? "Women-safety · " : ""}
          {isNight ? "Night-time estimate" : "Day-time estimate"} · scaled
          0–100
        </p>
      </div>
    </>
  );
}
