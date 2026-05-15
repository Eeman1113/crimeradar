"use client";

import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CITIES, CITY_IDS, type CityId } from "@/lib/cities";
import { monthlyStatsMeta } from "@/lib/wards";
import {
  CRIME_CATEGORY_LABELS,
  type CrimeCategory,
} from "@/lib/types";

const CATS: CrimeCategory[] = [
  "sexual_offence",
  "harassment",
  "assault",
  "kidnapping",
  "robbery",
  "theft",
  "burglary",
];

const POP_PER_1K: Record<CityId, number> = {
  // Rough city populations (millions of people), used to normalise counts to
  // per-100k. Numbers come from each city's seed wards-raw.ts aggregated.
  mumbai: 12_400_000 / 1000,
  bangalore: 8_500_000 / 1000,
  delhi: 17_000_000 / 1000,
  chennai: 7_100_000 / 1000,
  hyderabad: 7_700_000 / 1000,
  kolkata: 4_500_000 / 1000,
};

const CITY_COLOR: Record<CityId, string> = {
  mumbai: "#f43f5e",
  bangalore: "#6366f1",
  delhi: "#10b981",
  chennai: "#0ea5e9",
  hyderabad: "#a855f7",
  kolkata: "#f59e0b",
};

export default function ComparePage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const grid = isDark ? "#27272a" : "#e4e4e7";
  const axis = isDark ? "#a1a1aa" : "#71717a";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipFg = isDark ? "#fafafa" : "#18181b";

  // Only cities with real city totals can be compared meaningfully.
  const candidates = useMemo(
    () =>
      CITY_IDS.filter((id) => {
        const totals = monthlyStatsMeta(id).totals;
        return Object.values(totals).some((v) => (v as number) > 0);
      }),
    [],
  );

  const [picked, setPicked] = useState<Set<CityId>>(
    () => new Set(candidates.slice(0, 3)),
  );

  const togglePick = (c: CityId) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  // Build per-category bars normalised to per-100k.
  const barData = useMemo(() => {
    const rows: Record<string, string | number>[] = [];
    for (const cat of CATS) {
      const row: Record<string, string | number> = {
        cat: CRIME_CATEGORY_LABELS[cat],
      };
      for (const c of picked) {
        const totals = monthlyStatsMeta(c).totals as Partial<
          Record<CrimeCategory, number>
        >;
        const v = totals[cat] ?? 0;
        const popK = POP_PER_1K[c];
        // per 100k = v / pop_per_1k * 100
        row[CITIES[c].name] = popK > 0 ? +(v / popK / 10).toFixed(2) : 0;
      }
      rows.push(row);
    }
    return rows;
  }, [picked]);

  // Radar: normalise within-category to 0–100 share across the picked cities,
  // so the radar shows relative crime mix.
  const radarData = useMemo(() => {
    const pickedList = [...picked];
    return CATS.map((cat) => {
      const row: Record<string, string | number> = {
        cat: CRIME_CATEGORY_LABELS[cat],
      };
      const values = pickedList.map((c) => {
        const totals = monthlyStatsMeta(c).totals as Partial<
          Record<CrimeCategory, number>
        >;
        const v = totals[cat] ?? 0;
        return v / POP_PER_1K[c];
      });
      const max = Math.max(...values, 1);
      pickedList.forEach((c, i) => {
        row[CITIES[c].name] = +(100 * (values[i] / max)).toFixed(0);
      });
      return row;
    });
  }, [picked]);

  return (
    <div className="flex-1">
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-fit transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All cities
          </Link>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Compare cities
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Year-to-date / latest published counts normalised to{" "}
            <strong>cases per 100,000 residents</strong>. Click a city chip to
            toggle it. Only cities with real city-aggregate stats are
            available — the others fall through to editorial values and are
            excluded.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {candidates.map((c) => {
            const active = picked.has(c);
            return (
              <Button
                key={c}
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => togglePick(c)}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full mr-2"
                  style={{ background: CITY_COLOR[c] }}
                />
                {CITIES[c].name}
              </Button>
            );
          })}
        </div>

        {picked.size === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Select at least one city above.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-sky-500" />
                  Per 100k residents
                </CardTitle>
                <CardDescription>
                  Cases per 100,000 population. Window varies — Mumbai is
                  YTD Jan–Mar 2026, Bangalore is April 2026 (monthly),
                  Chennai is annual 2023.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="cat"
                        stroke={axis}
                        tick={{ fontSize: 10, fill: axis }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis
                        stroke={axis}
                        tick={{ fontSize: 10, fill: axis }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: tooltipBg,
                          border: `1px solid ${tooltipBorder}`,
                          borderRadius: 8,
                          color: tooltipFg,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {[...picked].map((c) => (
                        <Bar
                          key={c}
                          dataKey={CITIES[c].name}
                          fill={CITY_COLOR[c]}
                          radius={[3, 3, 0, 0]}
                          isAnimationActive={false}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Crime mix</CardTitle>
                <CardDescription>
                  Each category normalised to the highest of the picked cities
                  (= 100). Shows the <em>shape</em> of crime in each city, not
                  absolute volume.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={grid} />
                      <PolarAngleAxis
                        dataKey="cat"
                        tick={{ fontSize: 10, fill: axis }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: tooltipBg,
                          border: `1px solid ${tooltipBorder}`,
                          borderRadius: 8,
                          color: tooltipFg,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {[...picked].map((c) => (
                        <Radar
                          key={c}
                          name={CITIES[c].name}
                          dataKey={CITIES[c].name}
                          stroke={CITY_COLOR[c]}
                          fill={CITY_COLOR[c]}
                          fillOpacity={0.18}
                          isAnimationActive={false}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Source attribution</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5">
                {[...picked].map((c) => {
                  const meta = monthlyStatsMeta(c);
                  return (
                    <p key={c}>
                      <span
                        className="inline-block h-2 w-2 rounded-full mr-2"
                        style={{ background: CITY_COLOR[c] }}
                      />
                      <strong className="text-foreground">
                        {CITIES[c].name}
                      </strong>{" "}
                      —{" "}
                      {meta.source ? (
                        <a
                          href={meta.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {meta.windowKind === "year"
                            ? `Year ${meta.publishedFor?.year}`
                            : meta.windowKind === "month"
                              ? `${meta.publishedFor?.year}-${String(
                                  meta.publishedFor?.month ?? 0,
                                ).padStart(2, "0")}`
                              : meta.windowKind === "ytd"
                                ? `YTD through ${meta.publishedFor?.year}-${String(
                                    meta.publishedFor?.month ?? 0,
                                  ).padStart(2, "0")}`
                                : "official source"}
                        </a>
                      ) : (
                        "no source"
                      )}
                    </p>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </section>
    </div>
  );
}
