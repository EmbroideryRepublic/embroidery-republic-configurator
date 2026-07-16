import Link from 'next/link';

export const metadata = { title: 'Impressum | Bekleidungskonfigurator' };

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-gray-700">
      <Link href="/" className="text-xs text-brand-accent hover:underline">
        ← Zurück zum Konfigurator
      </Link>

      <h1 className="mb-4 mt-4 text-xl font-semibold text-brand">Impressum</h1>

      <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Platzhalter-Vorlage.</strong> Ich bin kein Anwalt und kann keine rechtsverbindlichen
        Angaben für dich erfinden. Diese Seite enthält die nach § 5 TMG übliche Struktur mit
        Platzhaltern – bitte durch echte Angaben ersetzen und im Zweifel juristisch prüfen lassen.
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-medium text-brand">Angaben gemäß § 5 TMG</h2>
          <p>
            Embroidery Republic Germany
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ und Ort]
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Vertreten durch</h2>
          <p>[Name der/des Geschäftsführenden]</p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Kontakt</h2>
          <p>
            Telefon: [Telefonnummer]
            <br />
            E-Mail: [E-Mail-Adresse]
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Registereintrag</h2>
          <p>
            Eintragung im Handelsregister.
            <br />
            Registergericht: [Registergericht]
            <br />
            Registernummer: [HRB-Nummer]
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Umsatzsteuer-ID</h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
            <br />
            [USt-IdNr.]
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>
            [Name]
            <br />
            [Anschrift]
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">EU-Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
            bereit:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-accent hover:underline"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            . Unsere E-Mail-Adresse findest du oben im Impressum.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">Verbraucherstreitbeilegung</h2>
          <p>
            [Angabe, ob Bereitschaft zur Teilnahme an einem Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle besteht oder nicht.]
          </p>
        </div>
      </section>
    </main>
  );
}
