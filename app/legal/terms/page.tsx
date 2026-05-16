export const metadata = {
  title: "Terms of Use — CrimeRadar",
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 leading-relaxed space-y-4">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        Terms of Use
      </h1>
      <p className="text-foreground/70 text-sm">
        By accessing or using CrimeRadar (the &quot;Service&quot;), you agree
        to be bound by these Terms of Use. If you do not agree, do not use
        the Service.
      </p>

      <h2 className="text-xl font-semibold mt-6">Nature of the Service</h2>
      <p className="text-foreground/90">
        CrimeRadar aggregates publicly available information — including
        official police absconder lists, ward-level crime statistics, and
        public news feeds — to surface neighbourhood safety signals. The
        Service is provided for informational purposes only and is not a
        substitute for official advisories, legal advice, or professional
        judgment.
      </p>

      <h2 className="text-xl font-semibold mt-8">No warranty</h2>
      <p className="text-foreground/90">
        The Service is provided on an <strong>&quot;as is&quot;</strong> and{" "}
        <strong>&quot;as available&quot;</strong> basis, without warranties of
        any kind, whether express or implied, including but not limited to
        implied warranties of merchantability, fitness for a particular
        purpose, accuracy, completeness, timeliness, or non-infringement. We
        do not warrant that the Service will be uninterrupted, error-free,
        secure, or free of harmful components, nor that risk scores, ward
        boundaries, or absconder data will be current or correct at any
        given moment.
      </p>

      <h2 className="text-xl font-semibold mt-8">Limitation of liability</h2>
      <p className="text-foreground/90">
        To the maximum extent permitted by law, the total aggregate liability
        of CrimeRadar, its operators, contributors, and affiliates arising
        out of or relating to your use of the Service is limited to{" "}
        <strong>INR 0 (zero rupees)</strong>. In no event shall we be liable
        for any indirect, incidental, special, consequential, punitive, or
        exemplary damages — including loss of profits, data, goodwill, or
        personal safety — arising from or in connection with your use of, or
        inability to use, the Service, even if advised of the possibility of
        such damages.
      </p>

      <h2 className="text-xl font-semibold mt-8">Acceptable use</h2>
      <p className="text-foreground/90">
        When using the Service you agree <strong>not</strong> to:
      </p>
      <ul className="list-disc pl-5 space-y-1 text-foreground/90">
        <li>
          Scrape, crawl, or otherwise programmatically access the Service at
          a rate exceeding <strong>1 request per second</strong>, or in any
          manner that imposes an unreasonable load on our infrastructure.
        </li>
        <li>
          Reuse, republish, or redistribute absconder names or related
          content in a defamatory, harassing, vigilante, or otherwise
          unlawful manner. Republication must preserve attribution to the
          original police source and respect any subsequent removals.
        </li>
        <li>
          Use the Service to identify, contact, surveil, threaten, or harm
          any individual listed on it.
        </li>
        <li>
          Bypass, disable, or interfere with security or access-control
          features of the Service.
        </li>
        <li>
          Use the Service to violate any applicable law, regulation, or
          third-party right.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8">Intellectual property</h2>
      <p className="text-foreground/90">
        All rights, title, and interest in and to the Service — including
        its source code, design, ward-boundary processing, risk-scoring
        methodology, layout, branding, and original written content —
        remain the property of CrimeRadar and its contributors. Underlying
        public datasets (police absconder lists, government crime
        statistics, news feeds) remain the property of their respective
        publishers and are surfaced under fair-use / public-interest
        privileges. Nothing in these Terms grants you any licence to our
        proprietary materials beyond personal, non-commercial viewing.
      </p>

      <h2 className="text-xl font-semibold mt-8">Modification of terms</h2>
      <p className="text-foreground/90">
        We may revise these Terms of Use at any time by posting an updated
        version on this page. Material changes will be reflected by updating
        the page; continued use of the Service after such changes
        constitutes your acceptance of the revised Terms. If you do not
        agree with any revision, you must stop using the Service.
      </p>

      <h2 className="text-xl font-semibold mt-8">
        Governing law &amp; jurisdiction
      </h2>
      <p className="text-foreground/90">
        These Terms of Use are governed by the laws of the Republic of
        India. Any dispute arising out of or in connection with the Service
        or these Terms shall be subject to the exclusive jurisdiction of
        the competent courts at <strong>Mumbai, Maharashtra</strong>.
      </p>

      <h2 className="text-xl font-semibold mt-8">Contact</h2>
      <p className="text-foreground/90">
        Questions about these Terms, or grievances regarding the Service,
        may be directed to our Grievance Officer — see the{" "}
        <a href="/legal" className="underline">
          main legal page
        </a>{" "}
        for contact details and SLAs.
      </p>
    </article>
  );
}
