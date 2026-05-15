import Link from "next/link";
import nightMultipliers from "@/lib/night_multipliers.json";
import {
  CRIME_CATEGORY_LABELS,
  type CrimeCategory,
} from "@/lib/types";
import { dataSeededAt } from "@/lib/wards";

const ORDER: CrimeCategory[] = [
  "sexual_offence",
  "assault",
  "robbery",
  "harassment",
  "kidnapping",
  "burglary",
  "theft",
  "other",
];

export const metadata = {
  title: "Methodology — CrimeRadar",
};

export default function MethodologyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 text-zinc-300 leading-relaxed space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
        Methodology
      </h1>
      <p className="text-zinc-400">
        Last updated {dataSeededAt()}. This page documents how the risk scores
        on every ward page are computed. <strong>Read this before relying
        on anything you see here.</strong>
      </p>

      <h2 className="text-xl font-semibold text-zinc-100 mt-8">
        Data sources
      </h2>
      <ul className="text-zinc-300 list-disc pl-5 space-y-1">
        <li>
          <strong>Geometry:</strong> BMC ward boundaries (24 wards) from the
          public <code className="bg-zinc-800 px-1 rounded text-xs">
            datameet/Municipal_Spatial_Data
          </code>{" "}
          repository (GeoJSON, public domain).
        </li>
        <li>
          <strong>Crime counts (MVP):</strong> hand-seeded estimates per ward,
          calibrated against publicly reported NCRB Mumbai aggregates and
          Mumbai Police annual report breakdowns. Marked{" "}
          <span className="font-mono text-amber-400">seeded</span> in the data
          quality flag in the footer of every page.
        </li>
        <li>
          <strong>Planned (v0.2):</strong> automated ingest from Mumbai Police
          monthly crime PDFs and the Maharashtra Citizen FIR portal. When
          enabled, the data quality flag will switch to{" "}
          <span className="font-mono">live</span>.
        </li>
        <li>
          <strong>Named offenders (v0.2):</strong> only the Mumbai Police
          Absconder List (published under CrPC §82). No accused, no FIR-named,
          no news-named. See <Link href="/legal">our naming policy</Link>.
        </li>
      </ul>

      <h2 className="text-xl font-semibold text-zinc-100 mt-8">
        Risk score formula
      </h2>
      <p className="text-zinc-300">
        For each ward <em>w</em> over the trailing 90 days, we compute a raw
        score that weights crimes-against-women highest, then violent crimes,
        then property crimes — all normalized per 1,000 residents:
      </p>
      <pre className="bg-zinc-900 border border-zinc-800 rounded-md p-4 text-xs overflow-x-auto">
{`raw(w) = 3.0 · women_crimes(w)/pop_per_1k
       + 2.0 · violent(w)/pop_per_1k
       + 0.5 · property(w)/pop_per_1k

p5, p95 = 5th and 95th percentile of raw across all 24 wards
risk(w) = round(100 · (clamp(raw(w), p5, p95) − p5) / (p95 − p5))`}
      </pre>
      <p className="text-zinc-300">
        Where <em>women_crimes</em> = sexual offences + harassment +
        kidnapping; <em>violent</em> = robbery + assault + sexual offences +
        kidnapping; <em>property</em> = theft + burglary. The percentile clamp
        keeps outliers from compressing the rest of the scale.
      </p>

      <h2 className="text-xl font-semibold text-zinc-100 mt-8">
        Night-time multipliers
      </h2>
      <p className="text-zinc-300">
        Night mode reruns the formula with each incident multiplied by its
        category's night-time multiplier (below). These multipliers are
        category-level constants, not Mumbai-specific — Indian public data does
        not include city × ward × hour-of-day crime breakdowns. They reflect
        the relative concentration of each crime type during night hours
        nationally, from NCRB time-slot tables and published research on
        crime-and-darkness.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-zinc-400">
            <tr>
              <th className="text-left py-2 pr-4">Category</th>
              <th className="text-left py-2 pr-4">Night multiplier</th>
            </tr>
          </thead>
          <tbody className="text-zinc-200">
            {ORDER.map((cat) => (
              <tr key={cat} className="border-t border-zinc-800">
                <td className="py-1.5 pr-4">{CRIME_CATEGORY_LABELS[cat]}</td>
                <td className="py-1.5 pr-4 font-mono">
                  {(nightMultipliers as Record<CrimeCategory, number>)[cat].toFixed(1)}
                  ×
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold text-zinc-100 mt-8">Limitations</h2>
      <ul className="text-zinc-300 list-disc pl-5 space-y-2">
        <li>
          <strong>Reporting bias.</strong> Higher-score wards may reflect
          higher <em>reporting</em>, not higher actual crime. Areas with better
          policing infrastructure and more women who can safely file FIRs will
          report more. Some low-score wards have under-reporting, not safety.
        </li>
        <li>
          <strong>Aggregation bias.</strong> A BMC ward is 5–20 km² and
          contains very different sub-areas. A score for ward K/E ("Andheri
          East") averages high-end towers and isolated slum lanes. Use the
          score as one signal among many.
        </li>
        <li>
          <strong>Time-of-day is national, not local.</strong> Night-time
          multipliers come from NCRB national tables. Mumbai-specific
          time-of-day data isn't public.
        </li>
        <li>
          <strong>Hand-seeded data (MVP).</strong> Until the v0.2 ingest
          pipeline lands, the per-ward counts are editorial estimates — not
          live numbers. The data quality tag in the footer of every page tells
          you which mode you're seeing.
        </li>
        <li>
          <strong>Not a replacement for judgment.</strong> Trust your
          instincts, share your location with a friend, and don't rely on any
          map to keep you safe.
        </li>
      </ul>

      <p className="text-xs text-zinc-500 mt-10">
        Source code: see the project repo. Spotted an error in the data or the
        formula? Email{" "}
        <a href="mailto:legal@crimeradar.example" className="underline">
          legal@crimeradar.example
        </a>
        .
      </p>
    </article>
  );
}
