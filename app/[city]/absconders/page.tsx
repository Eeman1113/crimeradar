import Link from "next/link";
import { notFound } from "next/navigation";
import {
  absconderNotes,
  absconderScrapedAt,
  absconderSourceUrl,
  listAbsconders,
} from "@/lib/absconders";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";

export const metadata = {
  title: "Absconders — CrimeRadar",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return CITY_IDS.map((id) => ({ city: id }));
}

export default async function AbscondersPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: rawCity } = await params;
  if (!isCityId(rawCity)) notFound();
  const city = rawCity;
  const cfg = getCity(city)!;
  const all = listAbsconders(city);
  const persons = all.filter((a) => !a.isOrganisation);
  const organisations = all.filter((a) => a.isOrganisation);
  const scrapedAt = absconderScrapedAt(city)?.slice(0, 10);
  const sourceUrl = absconderSourceUrl(city);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/${city}`}
          className="text-xs text-zinc-500 hover:text-zinc-300 w-fit"
        >
          ← Back to {cfg.name}
        </Link>
        {sourceUrl ? (
          <p className="text-xs text-zinc-500">
            Republished from{" "}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              official source
            </a>
            {scrapedAt ? <> · scraped {scrapedAt}</> : null}.
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          {cfg.name} absconders
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          We republish names only from official police absconder lists (CrPC
          §82 proclamations). See{" "}
          <Link href="/legal" className="underline">
            naming policy
          </Link>
          .
        </p>
        <div className="rounded-md border border-amber-900/50 bg-amber-950/40 p-3 text-xs text-amber-200">
          <p>{absconderNotes(city)}</p>
        </div>
      </header>

      {persons.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">
            Persons ({persons.length})
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {persons.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/${city}/absconders/${a.id}`}
                  className="block rounded-md border border-zinc-800 bg-zinc-900/50 p-3 hover:bg-zinc-800/70"
                >
                  <p className="font-medium text-zinc-100">{a.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {a.pdfId
                      ? `PDF #${a.pdfId} · click for source`
                      : "click for source"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100 mb-1">
            No public absconder list yet for {cfg.name}.
          </p>
          <p className="text-xs text-zinc-400">
            We have not identified a CrPC §82 list published online by the{" "}
            {cfg.state} police. If you know of one, please email{" "}
            <a
              href="mailto:legal@crimeradar.example"
              className="underline text-zinc-300"
            >
              legal@crimeradar.example
            </a>{" "}
            so we can add it.
          </p>
        </section>
      )}

      {organisations.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">
            Other entries ({organisations.length})
          </h2>
          <p className="text-xs text-zinc-500">
            Rows where the published &quot;name&quot; field appears to be an
            organisation rather than a person. Mirrored verbatim from the
            source.
          </p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {organisations.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/${city}/absconders/${a.id}`}
                  className="block rounded-md border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-800/50"
                >
                  <p className="font-medium text-zinc-200">{a.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {a.pdfId
                      ? `PDF #${a.pdfId} · click for source`
                      : "click for source"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
