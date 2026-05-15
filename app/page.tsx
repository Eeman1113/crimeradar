import Link from "next/link";
import { CITIES, CITY_IDS } from "@/lib/cities";
import { cityDataQuality, listWards } from "@/lib/wards";

export default function Home() {
  const tiles = CITY_IDS.map((id) => {
    const cfg = CITIES[id];
    const quality = cityDataQuality(id);
    const wardCount = listWards(id).length;
    return { ...cfg, quality, wardCount };
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
          {tiles.map((t) => (
            <li key={t.id}>
              <Link
                href={`/${t.id}`}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:bg-zinc-900/80 transition"
              >
                <p className="text-lg font-semibold text-zinc-100">{t.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{t.state}</p>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span
                    className={
                      t.quality === "live"
                        ? "font-mono text-emerald-400"
                        : t.quality === "calibrated"
                          ? "font-mono text-sky-400"
                          : t.quality === "seeded"
                            ? "font-mono text-amber-400"
                            : "font-mono text-zinc-500"
                    }
                  >
                    {t.quality}
                  </span>
                  <span className="text-zinc-500">
                    {t.wardCount > 0
                      ? `${t.wardCount} ${t.unit}s with data`
                      : "no per-area data yet"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
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
