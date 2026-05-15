import Link from "next/link";
import nightMultipliers from "@/lib/night_multipliers.json";
import {
  CRIME_CATEGORY_LABELS,
  type CrimeCategory,
} from "@/lib/types";
import { dataSeededAt } from "@/lib/wards";
import DataFreshnessPanel from "@/components/DataFreshnessPanel";

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
    <article className="max-w-3xl mx-auto px-4 py-12 leading-relaxed space-y-4">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        Methodology
      </h1>
      <p className="text-muted-foreground">
        Last updated {dataSeededAt("mumbai")}. This page documents how the
        risk scores on every ward page are computed.{" "}
        <strong className="text-foreground">
          Read this before relying on anything you see here.
        </strong>
      </p>
      <p className="text-muted-foreground">
        CrimeRadar covers Mumbai, Bangalore, Delhi, Chennai, Hyderabad, and
        Kolkata. Mumbai has the most complete data pipeline; other cities are
        being layered in iteratively as their police forces publish parseable
        data. The{" "}
        <span className="font-mono text-sky-600 dark:text-sky-400">
          data quality
        </span>{" "}
        flag on each city&apos;s page tells you where it sits.
      </p>

      <h2 className="text-xl font-semibold mt-8">Live data status</h2>
      <DataFreshnessPanel />

      <h2 className="text-xl font-semibold mt-8">Data sources</h2>
      <ul className="list-disc pl-5 space-y-2 text-foreground/90">
        <li>
          <strong>Geometry:</strong> ward boundaries (BMC 24, BBMP 243, MCD
          290, GCC 201, GHMC 145, KMC 141) from the public{" "}
          <code className="bg-muted px-1 rounded text-xs">
            datameet/Municipal_Spatial_Data
          </code>{" "}
          repository.
        </li>
        <li>
          <strong>Mumbai — city-level crime counts (live):</strong> we ingest
          the most-recent{" "}
          <a
            href="https://mumbaipolice.gov.in/CrimeStatistics"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Mumbai Police monthly crime statistics PDF
          </a>{" "}
          and extract year-to-date <em>registered</em> case counts. Refreshed
          daily.
        </li>
        <li>
          <strong>Bangalore — single-month city counts (live):</strong>{" "}
          extracted from the latest KSP monthly review (district-wise table,
          Bengaluru city column).
        </li>
        <li>
          <strong>Chennai — annual city counts (live):</strong> Tamil Nadu
          Police 2023 CSVs via OpenCity.
        </li>
        <li>
          <strong>Per-ward apportioning (calibrated):</strong> real city
          totals are apportioned to wards via a hand-built relative-weight
          matrix. Real scale × editorial relative weights → per-ward counts.
          Quality flag is{" "}
          <span className="font-mono text-sky-600 dark:text-sky-400">
            calibrated
          </span>
          .
        </li>
        <li>
          <strong>Cities without live stats (Delhi, Hyderabad, Kolkata):</strong>{" "}
          per-ward values come from a 4-tier model (distance from city
          centroid) plus deterministic noise. Quality flag is{" "}
          <span className="font-mono text-amber-600 dark:text-amber-400">
            seeded
          </span>
          .
        </li>
        <li>
          <strong>Named absconders:</strong> only persons on official police
          CrPC §82 lists — Mumbai (mumbaipolice.gov.in/absconder_list, 24
          entries), Delhi (delhipolice.ncog.gov.in proclaimed offenders, 56),
          Kolkata (WB CID Most Wanted, ~10). No accused, no FIR-named, no
          news-named. See{" "}
          <Link href="/legal" className="underline">
            naming policy
          </Link>
          .
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8">Risk score formula</h2>
      <p className="text-foreground/90">
        For each ward <em>w</em> we compute a raw score weighting crimes
        against women highest, then violent crimes, then property crimes —
        all normalised per 1,000 residents:
      </p>
      <pre className="bg-muted border rounded-md p-4 text-xs overflow-x-auto">
{`raw(w) = 3.0 · women_crimes(w)/pop_per_1k
       + 2.0 · violent(w)/pop_per_1k
       + 0.5 · property(w)/pop_per_1k

p5, p95 = 5th and 95th percentile of raw across that city's wards
risk(w) = round(100 · (clamp(raw(w), p5, p95) − p5) / (p95 − p5))`}
      </pre>
      <p className="text-foreground/90">
        Where <em>women_crimes</em> = sexual offences + harassment +
        kidnapping; <em>violent</em> = robbery + assault + sexual offences +
        kidnapping; <em>property</em> = theft + burglary.
      </p>

      <h2 className="text-xl font-semibold mt-8">Night-time multipliers</h2>
      <p className="text-foreground/90">
        Night mode reruns the formula with each incident multiplied by its
        category&apos;s night-time multiplier. These come from NCRB
        national time-slot tables and published research — not
        city-specific.
      </p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="py-2 px-3 font-medium">Category</th>
              <th className="py-2 px-3 font-medium">Night multiplier</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((cat) => (
              <tr key={cat} className="border-t">
                <td className="py-1.5 px-3">{CRIME_CATEGORY_LABELS[cat]}</td>
                <td className="py-1.5 px-3 font-mono">
                  {(nightMultipliers as Record<CrimeCategory, number>)[
                    cat
                  ].toFixed(1)}
                  ×
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-8">Limitations</h2>
      <ul className="list-disc pl-5 space-y-2 text-foreground/90">
        <li>
          <strong>Reporting bias.</strong> Higher-score wards may reflect
          higher <em>reporting</em>, not higher actual crime.
        </li>
        <li>
          <strong>Aggregation bias.</strong> Wards span several km²; the
          score averages very different sub-areas.
        </li>
        <li>
          <strong>Time-of-day is national, not local.</strong> Night-time
          multipliers come from NCRB national tables.
        </li>
        <li>
          <strong>Per-ward data is editorial outside Mumbai.</strong>{" "}
          <span className="font-mono text-sky-600 dark:text-sky-400">
            calibrated
          </span>{" "}
          = absolute scale is real;{" "}
          <span className="font-mono text-amber-600 dark:text-amber-400">
            seeded
          </span>{" "}
          = even the scale is editorial.
        </li>
        <li>
          <strong>Not a replacement for judgment.</strong> Trust your
          instincts and don&apos;t rely on any map to keep you safe.
        </li>
      </ul>

      <p className="text-xs text-muted-foreground mt-10">
        Spotted an error? Email{" "}
        <a href="mailto:legal@crimeradar.example" className="underline">
          legal@crimeradar.example
        </a>
        .
      </p>
    </article>
  );
}
