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

export type MonthHistoryEntry = {
  year: number;
  month: number;
  currentMonth: Partial<Record<CrimeCategory, number | null>>;
  ytd: Partial<Record<CrimeCategory, number | null>>;
};

// Pre-2023 Mumbai PDFs used a different column layout — YTD column is in a
// different position, and earlier PDFs don't always have all categories.
// Filter out months we can't confidently use.
const MIN_YEAR = 2023;

const SERIES: { cat: CrimeCategory; color: string }[] = [
  { cat: "sexual_offence", color: "#dc2626" },
  { cat: "harassment", color: "#ea580c" },
  { cat: "assault", color: "#f59e0b" },
  { cat: "kidnapping", color: "#a855f7" },
  { cat: "robbery", color: "#8b5cf6" },
  { cat: "theft", color: "#0ea5e9" },
  { cat: "burglary", color: "#10b981" },
  { cat: "other", color: "#64748b" },
];

export default function TrendChart({
  months,
}: {
  months: MonthHistoryEntry[];
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const grid = isDark ? "#27272a" : "#e4e4e7";
  const axis = isDark ? "#a1a1aa" : "#71717a";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipFg = isDark ? "#fafafa" : "#18181b";

  const [hidden, setHidden] = useState<Set<CrimeCategory>>(
    () => new Set(["other"]), // hide noisy 'other' by default
  );

  const usable = useMemo(
    () => months.filter((m) => m.year >= MIN_YEAR),
    [months],
  );

  const data = useMemo(() => {
    return usable.map((m) => {
      const totals = m.currentMonth;
      const point: Record<string, number | string> = {
        label: `${m.year}-${String(m.month).padStart(2, "0")}`,
        year: m.year,
        month: m.month,
      };
      for (const { cat } of SERIES) {
        if (!hidden.has(cat)) point[cat] = totals[cat] ?? 0;
      }
      return point;
    });
  }, [usable, hidden]);

  if (usable.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {usable.length} months of single-month registered counts ·{" "}
        {usable[0]?.year}–{usable[usable.length - 1]?.year} · click a legend
        chip to hide/show
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
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
            {SERIES.map(({ cat, color }) =>
              hidden.has(cat) ? null : (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  name={CRIME_CATEGORY_LABELS[cat]}
                  stroke={color}
                  strokeWidth={1.6}
                  dot={false}
                  activeDot={{ r: 3 }}
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
