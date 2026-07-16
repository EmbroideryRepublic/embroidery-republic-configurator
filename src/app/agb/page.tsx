import Link from 'next/link';

export const metadata = { title: 'AGB | Bekleidungskonfigurator' };

export default function AgbPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-gray-700">
      <Link href="/" className="text-xs text-brand-accent hover:underline">
        ← Zurück zum Konfigurator
      </Link>

      <h1 className="mb-4 mt-4 text-xl font-semibold text-brand">
        Allgemeine Geschäftsbedingungen (AGB)
      </h1>

      <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Platzhalter-Vorlage.</strong> AGB sind rechtlich bindend und sollten auf eure
        tatsächlichen Geschäftsprozesse (Zahlungsarten, Liefer-/Produktionszeiten, individuelle
        Anfertigung, Widerrufsrecht bei B2B vs. B2C, Reklamationsprozess) zugeschnitten und
        anwaltlich geprüft sein. Diese Seite zeigt nur die übliche Gliederung.
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-medium text-brand">§ 1 Geltungsbereich</h2>
          <p>
            Diese AGB gelten für alle Bestellungen und Anfragen über den
            Online-Bekleidungskonfigurator von Embroidery Republic Germany. Das Angebot richtet sich [an
            Gewerbetreibende / an Verbraucher und Gewerbetreibende – festlegen].
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">§ 2 Vertragsschluss</h2>
          <p>
            Die im Konfigurator erstellte Zusammenfassung stellt [eine unverbindliche Anfrage /
            ein verbindliches Angebot] dar. Der Vertrag kommt zustande, sobald [Beschreibung des
            Bestellprozesses, sobald dieser final umgesetzt ist].
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">§ 3 Individuell angefertigte Ware, Widerrufsrecht</h2>
          <p>
            Bei den über den Konfigurator personalisierten Textilien handelt es sich um nach
            Kundenspezifikation angefertigte Waren. Diese sind vom gesetzlichen Widerrufsrecht
            ausgeschlossen (§ 312g Abs. 2 Nr. 1 BGB) und können nach Auftragsbestätigung nicht
            zurückgegeben werden. [Genaue rechtliche Formulierung bitte anwaltlich prüfen lassen,
            insbesondere falls auch B2C-Kunden bestellen können.]
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">§ 4 Versand</h2>
          <p>
            Der Versand innerhalb Deutschlands ist ab einem Bestellwert von 75 € kostenlos.
            [Versandkosten unterhalb dieser Schwelle sowie Lieferungen ins Ausland ergänzen.]
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">§ 5 Preise und Zahlungsbedingungen</h2>
          <p>[Preisangaben netto/brutto, Zahlungsarten, Fälligkeit festlegen.]</p>
        </div>

        <div>
          <h2 className="font-medium text-brand">§ 6 Mindestbestellmenge</h2>
          <p>
            Für personalisierte Textilien gilt eine Mindestbestellmenge von 5 Stück pro
            Konfiguration.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">§ 7 Liefer- und Produktionszeit</h2>
          <p>[Angaben zu Produktionsdauer, Versand, Lieferzeiten ergänzen.]</p>
        </div>

        <div>
          <h2 className="font-medium text-brand">§ 8 Gewährleistung &amp; Reklamation</h2>
          <p>[Gewährleistungsregelung und Reklamationsprozess beschreiben.]</p>
        </div>

        <div>
          <h2 className="font-medium text-brand">§ 9 Haftung</h2>
          <p>[Haftungsklausel, insbesondere für vom Kunden gelieferte Druckvorlagen/Logos.]</p>
        </div>

        <div>
          <h2 className="font-medium text-brand">§ 10 Schlussbestimmungen</h2>
          <p>[Gerichtsstand, anwendbares Recht, Salvatorische Klausel.]</p>
        </div>
      </section>
    </main>
  );
}
