import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAbsconder, listAbsconders } from "@/lib/absconders";
import { CITY_IDS, getCity, isCityId } from "@/lib/cities";
import LocalizedCityName from "@/components/LocalizedCityName";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {cfg.name} absconder list
      </Link>
      <header className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">
          <LocalizedCityName cityId={city} /> police absconder list entry
          {a.pdfId ? ` #${a.pdfId}` : ""}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{a.name}</h1>
      </header>

      <Card>
        <CardContent className="pt-5 flex flex-col gap-3 text-sm">
          <p>
            This name appears on the {cfg.name} police absconder list,
            published under Code of Criminal Procedure §82 (proclamation
            against persons absconding).
          </p>
          <p className="text-muted-foreground">
            We do not store the date of birth, address, family members, or
            photograph for this individual. Charges, station, and case
            details are inside the official source below.
          </p>
          {sourceUrl ? (
            <Button asChild size="sm" className="w-fit gap-2">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open official source <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="pt-5 flex flex-col gap-2 text-xs text-amber-700 dark:text-amber-300">
          <strong className="text-amber-900 dark:text-amber-200">
            Presumption of innocence still applies
          </strong>
          <p>
            A proclamation under CrPC §82 is issued because the person has
            failed to appear in response to a warrant. It is not a
            conviction. If you are the person named here, or have new
            information, see{" "}
            <Link href="/legal" className="underline">
              our takedown / right-to-be-forgotten page
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
