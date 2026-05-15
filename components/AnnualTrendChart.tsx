"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CRIME_CATEGORY_LABELS, type CrimeCategory } from "@/lib/types";
import type { MonthHistoryEntry } from "./TrendChart";

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

export default function AnnualTrendChart({
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
    () => new Set(["other"]),
  );

  const data = useMemo(() => {
    const sorted = [...months].sort((a, b) => a.year - b.year);
    return sorted.map((m) => {
      const totals = m.ytd;
      const point: Record<string, number | string> = {
        label: String(m.year),
        year: m.year,
      };
      for (const { cat } of SERIES) {
        if (!hidden.has(cat)) point[cat] = totals[cat] ?? 0;
      }
      return point;
    });
  }, [months, hidden]);

  if (months.length === 0) return null;

  const minYear = data[0]?.year as number;
  const maxYear = data[data.length - 1]?.year as number;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {months.length} year{months.length === 1 ? "" : "s"} of annual
        reported totals · {minYear}
        {minYear === maxYear ? "" : `–${maxYear}`} · click a legend chip to
        hide/show
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              tick={{ fontSize: 11, fill: axis }}
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
              cursor={{ fill: isDark ? "#27272a55" : "#e4e4e755" }}
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
                <Bar
                  key={cat}
                  dataKey={cat}
                  name={CRIME_CATEGORY_LABELS[cat]}
                  stackId="a"
                  fill={color}
                  isAnimationActive={false}
                />
              ),
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
