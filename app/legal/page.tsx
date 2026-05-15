export const metadata = {
  title: "Legal — CrimeRadar",
};

export default function LegalPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 leading-relaxed space-y-4">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        Legal &amp; takedown
      </h1>

      <h2 className="text-xl font-semibold mt-6">Naming policy</h2>
      <p className="text-foreground/90">
        CrimeRadar only publishes names of individuals from official police
        absconder / proclaimed-offender lists — currently Mumbai Police,
        Delhi Police, and the West Bengal CID. These lists are published
        under the Code of Criminal Procedure §82 (proclamation against
        persons absconding). Republishing them with attribution falls under
        the privilege accorded to publication of public legal proceedings.
      </p>
      <p className="text-foreground/90">
        We do <strong>not</strong> publish:
      </p>
      <ul className="list-disc pl-5 space-y-1 text-foreground/90">
        <li>Names of accused persons from FIRs.</li>
        <li>Names of arrested persons who have not been convicted.</li>
        <li>Names from news reports, social media, or unofficial sources.</li>
        <li>
          Information about missing persons (they are victims, not offenders).
        </li>
        <li>
          Dates of birth, exact addresses, or family members of any individual.
        </li>
      </ul>
      <p className="text-foreground/90">
        Every absconder card on this site links back to the original source
        so readers can verify the data. Absconder pages are served with{" "}
        <code className="bg-muted px-1 rounded text-xs">noindex</code> so
        search engines do not surface them out of context.
      </p>

      <h2 className="text-xl font-semibold mt-8">
        Data retention &amp; right to be forgotten
      </h2>
      <p className="text-foreground/90">
        Absconder entries have a 12-month retention window from listing date.
        If a name disappears from the upstream list we remove it within 24
        hours of the next ingest run. Convicted persons who have completed
        their sentence and individuals who have been cleared can request
        removal at any time via the takedown email below.
      </p>

      <h2 className="text-xl font-semibold mt-8">DPDP Act 2023</h2>
      <p className="text-foreground/90">
        Under India&apos;s Digital Personal Data Protection Act 2023 we act
        as a Data Fiduciary for the personal data we republish. Our lawful
        basis is public interest in safety information that is already in
        the public domain via official police publications. We store the
        minimum data necessary (name, listed-on date, charges category,
        source URL) and do not store dates of birth or addresses.
      </p>

      <h2 className="text-xl font-semibold mt-8">Geolocation data</h2>
      <p className="text-foreground/90">
        When you use &quot;Use my location&quot; your coordinates are
        processed entirely in your browser. We do <strong>not</strong> log,
        store, or transmit your location to our servers. Ward lookup happens
        client-side via point-in-polygon against the public ward GeoJSON.
      </p>

      <h2 className="text-xl font-semibold mt-8">Takedown requests</h2>
      <p className="text-foreground/90">
        Email{" "}
        <a href="mailto:legal@crimeradar.example" className="underline">
          legal@crimeradar.example
        </a>{" "}
        with the URL, the specific content, and (if applicable) proof of
        identity. We commit to a 72-hour response SLA. If we don&apos;t
        have a lawful basis to keep the content up, we remove it.
      </p>

      <h2 className="text-xl font-semibold mt-8">Disclaimer</h2>
      <p className="text-foreground/90">
        The risk scores on this site are <strong>estimates</strong>. They
        are not safety guarantees, not predictions, and not a substitute
        for your own judgment, local knowledge, or police advice. CrimeRadar
        accepts no liability for any decision made on the basis of the
        information shown here.
      </p>
    </article>
  );
}
