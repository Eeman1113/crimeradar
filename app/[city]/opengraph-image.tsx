// Per-city Open Graph image, generated at build time.
//
// Next 16 statically optimizes this route by default: combined with
// `output: "export"` (see next.config.ts) and the `generateStaticParams` +
// `dynamicParams = false` exports below, the build emits one PNG per city
// alongside the route's HTML (out/{city}/opengraph-image.png). No request-time
// APIs are used, so this is safe under static export.
//
// Docs verified: node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/01-metadata/opengraph-image.md (v16: `params` is a
// Promise). See also `image-response.md` for the `next/og` API.

import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";
import { cityDataQuality, listWards } from "@/lib/wards";

export const dynamicParams = false;

export function generateStaticParams() {
  return CITY_IDS.map((id) => ({ city: id }));
}

export const alt = "CrimeRadar — Indian city night-safety estimates";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: raw } = await params;
  if (!isCityId(raw)) notFound();
  const cfg = getCity(raw)!;
  const quality = cityDataQuality(raw);
  const wardCount = listWards(raw).length;

  // Brand palette — picked to match the dark theme used across the app
  // (background near oklch(0.145 0 0), accent indigo/sky used in trend charts).
  const bg = "#09090b";
  const fg = "#fafafa";
  const muted = "#a1a1aa";
  const accent = "#818cf8"; // indigo-400, matches NightDeltaChart's night bar
  const qualityColor =
    quality === "live"
      ? "#34d399" // emerald-400
      : quality === "calibrated"
        ? "#38bdf8" // sky-400
        : quality === "seeded"
          ? "#fbbf24" // amber-400
          : "#71717a"; // zinc-500 (empty)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: bg,
          color: fg,
          padding: "72px 80px",
          fontFamily:
            '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {/* Top row: brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            letterSpacing: -0.4,
            color: muted,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: accent,
              boxShadow: `0 0 24px ${accent}`,
            }}
          />
          <span style={{ color: fg, fontWeight: 600 }}>CrimeRadar</span>
          <span>·</span>
          <span>{cfg.state}</span>
        </div>

        {/* Main: city name + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 132,
              fontWeight: 600,
              letterSpacing: -3,
              lineHeight: 1.02,
              color: fg,
            }}
          >
            {cfg.name}
          </div>
          <div
            style={{
              fontSize: 32,
              color: muted,
              maxWidth: 920,
              lineHeight: 1.3,
            }}
          >
            Estimated night-safety risk per {cfg.unit}, sourced from official
            police publications.
          </div>
        </div>

        {/* Bottom row: data quality + ward count + footer mark */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", gap: 48 }}>
            <Stat label="Data" value={quality} valueColor={qualityColor} />
            <Stat
              label={`${cfg.unit}s mapped`}
              value={wardCount > 0 ? String(wardCount) : "—"}
              valueColor={fg}
            />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: muted,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            crimeradar.in
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 20,
          color: "#71717a",
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 44,
          fontWeight: 600,
          color: valueColor,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {value}
      </span>
    </div>
  );
}
