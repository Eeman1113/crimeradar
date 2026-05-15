"use client";

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
  const data = ORDER.map((cat) => ({
    cat,
    label: CRIME_CATEGORY_LABELS[cat],
    count: breakdown[cat] ?? 0,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis type="number" stroke="#a1a1aa" />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#a1a1aa"
            width={170}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "#27272a" }}
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              color: "#fafafa",
            }}
          />
          <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
