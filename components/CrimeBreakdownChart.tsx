"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CRIME_CATEGORY_LABELS,
  type CrimeBreakdown,
  type CrimeCategory,
} from "@/lib/types";

const ORDER: CrimeCategory[] = [
  "sexual_offence",
  "harassment",
  "assault",
  "robbery",
  "kidnapping",
  "theft",
  "burglary",
  "other",
];

export default function CrimeBreakdownChart({
  breakdown,
}: {
  breakdown: CrimeBreakdown;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 640px)");
    const update = () => setIsSmall(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  const grid = isDark ? "#27272a" : "#e4e4e7";
  const axis = isDark ? "#a1a1aa" : "#71717a";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipFg = isDark ? "#fafafa" : "#18181b";
  const cursor = isDark ? "#27272a" : "#f4f4f5";
  const bar = isDark ? "#fb7185" : "#e11d48";

  const data = ORDER.map((cat) => ({
    cat,
    label: CRIME_CATEGORY_LABELS[cat],
    count: breakdown[cat] ?? 0,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: isSmall ? 0 : 24, right: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis type="number" stroke={axis} fontSize={isSmall ? 11 : 12} />
          <YAxis
            type="category"
            dataKey="label"
            stroke={axis}
            width={isSmall ? 110 : 170}
            tick={{ fontSize: isSmall ? 11 : 12, fill: axis }}
          />
          <Tooltip
            cursor={{ fill: cursor }}
            contentStyle={{
              background: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 8,
              color: tooltipFg,
            }}
          />
          <Bar dataKey="count" fill={bar} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
