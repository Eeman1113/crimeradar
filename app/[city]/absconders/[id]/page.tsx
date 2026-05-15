import Link from "next/link";
import { notFound } from "next/navigation";
import { getAbsconder, listAbsconders } from "@/lib/absconders";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { city: string; id: string }[] = [];
  for (const city of CITY_IDS) {
    for (const a of listAbsconders(city)) {
      params.push({ city, id: a.id });
    }
  }
  return params;
}

export default async function AbsconderPage({
  params,
}: {
  params: Promise<{ city: string; id: string }>;
}) {
  const { city: rawCity, id } = await params;
  if (!isCityId(rawCity)) notFound();
  const city = rawCity;
  const cfg = getCity(city)!;
  const a = getAbsconder(city, id);
  if (!a) notFound();
  const sourceUrl = a.sourcePdfUrl ?? a.sourceUrl ?? null;
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">
      <Link
        href={`/${city}/absconders`}
        className="text-sm text-zinc-400 hover:text-zinc-100 w-fit"
      >
        ← Back to {cfg.name} absconder list
      </Link>
      <header className="flex flex-col gap-1">
        <p className="text-xs text-zinc-500">
          {cfg.name} police absconder list entry
          {a.pdfId ? ` #${a.pdfId}` : ""}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          {a.name}
        </h1>
      </header>

      <section className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-300 flex flex-col gap-2">
        <p>
          This name appears on the {cfg.name} police absconder list, published
          under Code of Criminal Procedure §82 (proclamation against persons
          absconding).
        </p>
        <p className="text-zinc-400">
          We do not store the date of birth, address, family members, or
          photograph for this individual. Charges, station, and case details
          are inside the official source below.
        </p>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 text-sm font-medium"
          >
            Open official source →
          </a>
        ) : null}
      </section>

      <section className="rounded-md border border-amber-900/50 bg-amber-950/40 p-3 text-xs text-amber-200 flex flex-col gap-2">
        <strong className="text-amber-100">
          Presumption of innocence still applies
        </strong>
        <p>
          A proclamation under CrPC §82 is issued because the person has
          failed to appear in response to a warrant. It is not a conviction.
          If you are the person named here, or have new information, see{" "}
          <Link href="/legal" className="underline">
            our takedown / right-to-be-forgotten page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
