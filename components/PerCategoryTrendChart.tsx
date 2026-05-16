"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CRIME_CATEGORY_LABELS, type CrimeCategory } from "@/lib/types";
import { monthlyHistory } from "@/lib/wards";
import type { CityId } from "@/lib/cities";
import type { MonthHistoryEntry } from "./TrendChart";

// Shared palette — same hues used by TrendChart / AnnualTrendChart so colors
// stay consistent across the per-city dashboard.
const PALETTE: Record<CrimeCategory, string> = {
  sexual_offence: "#dc2626",
  harassment: "#ea580c",
  assault: "#f59e0b",
  kidnapping: "#a855f7",
  robbery: "#8b5cf6",
  theft: "#0ea5e9",
  burglary: "#10b981",
  other: "#64748b",
};

const DEFAULT_ORDER: CrimeCategory[] = [
  "sexual_offence",
  "harassment",
  "assault",
  "kidnapping",
  "robbery",
  "theft",
  "burglary",
  "other",
];

type TimeMode = "month" | "year";

function detectMode(months: MonthHistoryEntry[]): TimeMode {
  // If every entry is December and the currentMonth bucket is empty, the file
  // is YTD-only (NCRB annual PDFs). Treat the x-axis as years.
  if (months.length === 0) return "month";
  const allDec = months.every((m) => m.month === 12);
  const hasMonthly = months.some(
    (m) => Object.keys(m.currentMonth ?? {}).length > 0,
  );
  if (allDec && !hasMonthly) return "year";
  return "month";
}

export default function PerCategoryTrendChart({
  cityId,
  categories,
}: {
  cityId: CityId;
  categories?: CrimeCategory[];
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const grid = isDark ? "#27272a" : "#e4e4e7";
  const axis = isDark ? "#a1a1aa" : "#71717a";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipFg = isDark ? "#fafafa" : "#18181b";

  const months = useMemo(() => monthlyHistory(cityId), [cityId]);

  const series = useMemo<CrimeCategory[]>(
    () =>
      (categories && categories.length > 0 ? categories : DEFAULT_ORDER).filter(
        (c) => c in PALETTE,
      ),
    [categories],
  );

  const [hidden, setHidden] = useState<Set<CrimeCategory>>(() => new Set());

  const mode = useMemo(() => detectMode(months), [months]);

  const data = useMemo(() => {
    const sorted = [...months].sort((a, b) =>
      a.year === b.year ? a.month - b.month : a.year - b.year,
    );
    return sorted.map((m) => {
      const bucket = mode === "year" ? m.ytd : m.currentMonth ?? {};
      const point: Record<string, number | string> = {
        label:
          mode === "year"
            ? String(m.year)
            : `${m.year}-${String(m.month).padStart(2, "0")}`,
        year: m.year,
        month: m.month,
      };
      for (const cat of series) {
        if (!hidden.has(cat)) point[cat] = bucket[cat] ?? 0;
      }
      return point;
    });
  }, [months, mode, series, hidden]);

  if (months.length === 0) return null;

  const unit = mode === "year" ? "YTD totals" : "single-month counts";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Per-category {unit} · click a legend chip to hide/show
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={grid}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke={axis}
              tick={{ fontSize: 10, fill: axis }}
              minTickGap={20}
            />
            <YAxis
              stroke={axis}
              tick={{ fontSize: 10, fill: axis }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 8,
                color: tooltipFg,
                fontSize: 12,
              }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              onClick={(o) => {
                const c = o.dataKey as CrimeCategory;
                setHidden((prev) => {
                  const next = new Set(prev);
                  if (next.has(c)) next.delete(c);
                  else next.add(c);
                  return next;
                });
              }}
            />
            {series.map((cat) =>
              hidden.has(cat) ? null : (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  name={CRIME_CATEGORY_LABELS[cat]}
                  stroke={PALETTE[cat]}
                  strokeWidth={1.7}
                  dot={mode === "year" ? { r: 2.5 } : false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ),
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
