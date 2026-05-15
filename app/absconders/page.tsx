import Link from "next/link";
import {
  absconderNotes,
  absconderScrapedAt,
  absconderSourceUrl,
  listAbsconders,
} from "@/lib/absconders";

export const metadata = {
  title: "Absconders — CrimeRadar",
  robots: { index: false, follow: false, nocache: true },
};

export default function AbscondersPage() {
  const all = listAbsconders();
  const persons = all.filter((a) => !a.isOrganisation);
  const organisations = all.filter((a) => a.isOrganisation);
  const scrapedAt = absconderScrapedAt().slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs text-zinc-500">
          Republished from{" "}
          <a
            href={absconderSourceUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Mumbai Police Absconder List
          </a>{" "}
          (CrPC §82). Scraped {scrapedAt}.
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          Listed absconders
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          The Mumbai Police publish a list of persons against whom a
          proclamation under CrPC §82 has been issued (i.e., the person has
          failed to appear after a warrant). We mirror only what the police
          publish, and link back to the official PDF for each entry. We do not
          publish any other names. See{" "}
          <Link href="/legal" className="underline">
            our naming policy
          </Link>
          .
        </p>
        <div className="rounded-md border border-amber-900/50 bg-amber-950/40 p-3 text-xs text-amber-200">
          <p>{absconderNotes()}</p>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-100">
          Persons ({persons.length})
        </h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {persons.map((a) => (
            <li key={a.id}>
              <Link
                href={`/absconders/${a.id}`}
                className="block rounded-md border border-zinc-800 bg-zinc-900/50 p-3 hover:bg-zinc-800/70"
              >
                <p className="font-medium text-zinc-100">{a.name}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  PDF #{a.pdfId} · click for source
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {organisations.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">
            Other entries ({organisations.length})
          </h2>
          <p className="text-xs text-zinc-500">
            Listing rows where the published "name" field appears to be an
            organisation rather than a person. Mumbai Police publishes these
            verbatim and we mirror them as-is — but the actual absconder will
            be named inside the PDF.
          </p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {organisations.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/absconders/${a.id}`}
                  className="block rounded-md border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-800/50"
                >
                  <p className="font-medium text-zinc-200">{a.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    PDF #{a.pdfId} · click for source
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
