import Link from "next/link";

export default function Disclaimer() {
  return (
    <footer className="border-t bg-background/70">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
        <p>Multi-city · per-city data quality shown on each city page.</p>
        <p className="flex items-center gap-3">
          <Link href="/methodology" className="hover:text-foreground transition-colors">
            Methodology
          </Link>
          <span aria-hidden>·</span>
          <Link href="/legal" className="hover:text-foreground transition-colors">
            Legal &amp; takedown
          </Link>
        </p>
      </div>
    </footer>
  );
}
