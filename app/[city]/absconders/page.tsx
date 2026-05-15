import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  absconderNotes,
  absconderScrapedAt,
  absconderSourceUrl,
  listAbsconders,
} from "@/lib/absconders";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";
import LocalizedCityName from "@/components/LocalizedCityName";
import { Card, CardContent } from "@/components/ui/card";

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
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-fit transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {cfg.name}
        </Link>
        {sourceUrl ? (
          <p className="text-xs text-muted-foreground">
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
        <h1 className="text-3xl font-semibold tracking-tight">
          <LocalizedCityName cityId={city} /> absconders
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          We republish names only from official police absconder lists (CrPC
          §82 proclamations). See{" "}
          <Link href="/legal" className="underline">
            naming policy
          </Link>
          .
        </p>
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-4 text-xs text-amber-700 dark:text-amber-300">
            {absconderNotes(city)}
          </CardContent>
        </Card>
      </header>

      {persons.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Persons ({persons.length})</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {persons.map((a) => (
              <li key={a.id}>
                <Link href={`/${city}/absconders/${a.id}`} className="block">
                  <Card className="transition-colors hover:bg-accent">
                    <CardContent className="pt-4">
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.pdfId
                          ? `PDF #${a.pdfId} · click for source`
                          : "click for source"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Card>
          <CardContent className="pt-4 text-sm">
            <p className="font-medium mb-1">
              No public absconder list yet for {cfg.name}.
            </p>
            <p className="text-xs text-muted-foreground">
              We have not identified a CrPC §82 list published online by the{" "}
              {cfg.state} police. If you know of one, please email{" "}
              <a
                href="mailto:eemanwithai@gmail.com"
                className="underline"
              >
                eemanwithai@gmail.com
              </a>{" "}
              so we can add it.
            </p>
          </CardContent>
        </Card>
      )}

      {organisations.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            Other entries ({organisations.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Rows where the published &quot;name&quot; field appears to be an
            organisation rather than a person. Mirrored verbatim from the
            source.
          </p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {organisations.map((a) => (
              <li key={a.id}>
                <Link href={`/${city}/absconders/${a.id}`} className="block">
                  <Card className="transition-colors hover:bg-accent">
                    <CardContent className="pt-4">
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.pdfId
                          ? `PDF #${a.pdfId} · click for source`
                          : "click for source"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
