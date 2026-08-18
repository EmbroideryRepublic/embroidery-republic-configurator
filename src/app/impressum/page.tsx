import Link from 'next/link';
import { COMPANY } from '@/config/company';

export const metadata = {
  title: 'Impressum',
  description:
    'Anbieterkennzeichnung nach § 5 DDG: Kontaktdaten und Vertretungsberechtigte von Embroidery Republic Germany.',
  alternates: { canonical: '/impressum' },
  openGraph: {
    title: 'Impressum',
    description:
      'Anbieterkennzeichnung nach § 5 DDG: Kontaktdaten und Vertretungsberechtigte von Embroidery Republic Germany.',
  },
};

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-brand/70">
      <Link href="/" className="text-xs text-gold-dark hover:underline">
        ← Zurück zur Startseite
      </Link>

      <h1 className="mb-4 mt-4 font-serif text-2xl font-semibold text-brand">Impressum</h1>

      <section className="space-y-5">
        <div>
          <h2 className="font-medium text-brand">Angaben gemäß § 5 DDG</h2>
          <p>
            Embroidery Republic Germany
            <br />
            Ihsan Uzun &amp; Enes Malkoc GbR
            <br />
            Ingendorferweg 81
            <br />
            50829 Köln
            <br />
            Deutschland
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Vertretungsberechtigte Gesellschafter</h2>
          <p>
            Ihsan Uzun
            <br />
            Enes Malkoc
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Kontakt</h2>
          <p>
            Telefon: {COMPANY.phone}
            <br />
            E-Mail:{' '}
            <a href={COMPANY.emailHref} className="text-gold-dark hover:underline">
              {COMPANY.email}
            </a>
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Umsatzsteuer</h2>
          <p>
            Steuernummer: {COMPANY.steuernummer}
            <br />
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: {COMPANY.vatId}
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p>
            Ihsan Uzun &amp; Enes Malkoc
            <br />
            Ingendorferweg 81, 50829 Köln
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Verbraucherstreitbeilegung</h2>
          <p>
            Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Haftung für Inhalte und Links</h2>
          <p>
            Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für Richtigkeit,
            Vollständigkeit und Aktualität können wir jedoch keine Gewähr übernehmen. Für die Inhalte
            externer Links sind ausschließlich deren Betreiber verantwortlich; zum Zeitpunkt der
            Verlinkung waren keine Rechtsverstöße erkennbar.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Urheberrecht</h2>
          <p>
            Die von uns erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
            Urheberrecht. Abbildungen der angebotenen Textilien stammen von den jeweiligen
            Herstellern bzw. unseren Lieferanten und bleiben deren Eigentum. Von Kundinnen und Kunden
            hochgeladene Logos und Motive verbleiben im Eigentum der jeweiligen Rechteinhaber.
          </p>
        </div>
      </section>
    </main>
  );
}
