"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Ward } from "@/lib/types";

export default function NightDeltaChart({
  wards,
  limit = 12,
}: {
  wards: Ward[];
  limit?: number;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const grid = isDark ? "#27272a" : "#e4e4e7";
  const axis = isDark ? "#a1a1aa" : "#71717a";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipFg = isDark ? "#fafafa" : "#18181b";

  const data = useMemo(() => {
    return wards
      .map((w) => ({
        name: w.name.length > 16 ? w.name.slice(0, 16) + "…" : w.name,
        full: w.name,
        day: w.riskScore,
        night: w.riskScoreNight,
        delta: w.riskScoreNight - w.riskScore,
      }))
      .filter((d) => d.day >= 0 && d.night >= 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, limit);
  }, [wards, limit]);

  if (data.length === 0) return null;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 8, right: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
          <XAxis
            type="number"
            stroke={axis}
            tick={{ fontSize: 10, fill: axis }}
            domain={[0, 100]}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke={axis}
            width={120}
            tick={{ fontSize: 10, fill: axis }}
          />
          <Tooltip
            cursor={{ fill: isDark ? "#27272a" : "#f4f4f5" }}
            contentStyle={{
              background: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 8,
              color: tooltipFg,
              fontSize: 12,
            }}
            formatter={(value, name) => {
              const label = name === "day" ? "Day" : "Night";
              return [`${value}/100`, label];
            }}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload as
                | { full?: string; delta?: number }
                | undefined;
              return item?.full ?? "";
            }}
          />
          <Bar
            dataKey="day"
            stackId="cmp"
            fill="#fbbf24"
            radius={[0, 0, 0, 4]}
          />
          <Bar
            dataKey="delta"
            stackId="cmp"
            fill="#6366f1"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-1">
        <span className="inline-flex items-center gap-1.5">
          <Sun className="h-3 w-3 text-amber-500" />
          Day
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Moon className="h-3 w-3 text-indigo-500" />
          Night premium
        </span>
      </div>
    </div>
  );
}
