import Link from "next/link";
import { CITIES, CITY_IDS } from "@/lib/cities";
import { listAbsconders } from "@/lib/absconders";
import { cityDataQuality, listWards, monthlyStatsMeta } from "@/lib/wards";

export default function Home() {
  const tiles = CITY_IDS.map((id) => {
    const cfg = CITIES[id];
    const quality = cityDataQuality(id);
    const wardCount = listWards(id).length;
    const stats = monthlyStatsMeta(id);
    const statsCategories = Object.values(stats.totals).filter(
      (v) => typeof v === "number" && v > 0,
    ).length;
    const absconderCount = listAbsconders(id).filter((a) => !a.isOrganisation)
      .length;
    return { ...cfg, quality, wardCount, statsCategories, absconderCount };
  });

  return (
    <div className="flex-1">
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-20 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
            CrimeRadar
          </h1>
          <p className="mt-3 text-zinc-300 max-w-2xl">
            Ward-level safety estimates for Indian cities, sourced from
            official police publications where they exist. Pick a city to see
            its map.
          </p>
        </div>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tiles.map((t) => {
            const hasAny =
              t.wardCount > 0 || t.statsCategories > 0 || t.absconderCount > 0;
            return (
              <li key={t.id}>
                <Link
                  href={`/${t.id}`}
                  className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:bg-zinc-900/80 transition"
                >
                  <p className="text-lg font-semibold text-zinc-100">
                    {t.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.state}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {t.wardCount > 0 ? (
                      <span
                        className={
                          t.quality === "live"
                            ? "inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5"
                            : t.quality === "calibrated"
                              ? "inline-flex items-center rounded-full bg-sky-500/15 text-sky-300 px-2 py-0.5"
                              : "inline-flex items-center rounded-full bg-amber-500/15 text-amber-300 px-2 py-0.5"
                        }
                      >
                        {t.wardCount} per-area
                      </span>
                    ) : null}
                    {t.statsCategories > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-sky-500/15 text-sky-300 px-2 py-0.5">
                        city stats
                      </span>
                    ) : null}
                    {t.absconderCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-rose-500/15 text-rose-300 px-2 py-0.5">
                        {t.absconderCount} absconders
                      </span>
                    ) : null}
                    {!hasAny ? (
                      <span className="inline-flex items-center rounded-full bg-zinc-700/40 text-zinc-400 px-2 py-0.5">
                        geometry only
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100 mb-1">Data quality scale</p>
          <ul className="text-xs text-zinc-400 space-y-1">
            <li>
              <span className="font-mono text-emerald-400">live</span> —
              automated ingest, per-area data from official police feeds.
            </li>
            <li>
              <span className="font-mono text-sky-400">calibrated</span> —
              real city-aggregate counts from official sources, apportioned to
              areas via editorial relative weights.
            </li>
            <li>
              <span className="font-mono text-amber-400">seeded</span> —
              editorial estimates, no real-data calibration yet.
            </li>
            <li>
              <span className="font-mono text-zinc-500">empty</span> — ward
              boundaries shown, but no per-area data ingested. Geometry only.
            </li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Full details:{" "}
            <Link href="/methodology" className="underline">
              methodology
            </Link>{" "}
            ·{" "}
            <Link href="/legal" className="underline">
              legal &amp; takedown
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
