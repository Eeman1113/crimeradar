"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RiskBadge from "@/components/RiskBadge";
import type { Ward } from "@/lib/types";

export default function WardScoreDisplay({ ward }: { ward: Ward }) {
  const params = useSearchParams();
  const isNight = params.get("night") === "1";
  const score = isNight ? ward.riskScoreNight : ward.riskScore;
  const backHref = isNight ? "/?night=1" : "/";
  return (
    <>
      <Link
        href={backHref}
        className="text-sm text-zinc-400 hover:text-zinc-100 w-fit"
      >
        ← Back to map
      </Link>
      <div className="flex items-center gap-4 mt-4">
        <RiskBadge score={score} size="lg" />
        <p className="text-sm text-zinc-400">
          {isNight ? "Night-time estimate" : "Day-time estimate"} · scaled
          0–100 across all Mumbai wards
        </p>
      </div>
    </>
  );
}
