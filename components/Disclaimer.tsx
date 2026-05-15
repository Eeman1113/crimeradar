import Link from "next/link";

export default function Disclaimer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/90 text-xs text-zinc-400">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p>Multi-city · per-city data quality shown on each city page.</p>
        <p className="flex items-center gap-3">
          <Link href="/methodology" className="hover:text-zinc-100">
            Methodology
          </Link>
          <span aria-hidden>·</span>
          <Link href="/legal" className="hover:text-zinc-100">
            Legal &amp; takedown
          </Link>
        </p>
      </div>
    </footer>
  );
}
