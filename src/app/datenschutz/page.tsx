import Link from 'next/link';

export const metadata = { title: 'Datenschutz | Bekleidungskonfigurator' };

export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-gray-700">
      <Link href="/" className="text-xs text-brand-accent hover:underline">
        ← Zurück zum Konfigurator
      </Link>

      <h1 className="mb-4 mt-4 text-xl font-semibold text-brand">Datenschutzerklärung</h1>

      <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Platzhalter-Vorlage.</strong> Diese Seite zeigt die für eine DSGVO-Datenschutzerklärung
        übliche Gliederung, aber keine rechtsverbindlichen Inhalte. Was tatsächlich hier stehen
        muss, hängt davon ab, welche Dienste ihr final einsetzt (Hosting-Anbieter, Supabase-Region,
        Analyse-/Marketing-Tools, Cookie-Einsatz o.ä.) – das kann ich als KI nicht rechtssicher für
        euch festlegen. Bitte von einer:einem Datenschutzbeauftragten oder Anwält:in prüfen/erstellen
        lassen, bevor die Seite live geht.
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-medium text-brand">1. Verantwortlicher</h2>
          <p>
            Embroidery Republic Germany
            <br />
            [Anschrift, Kontaktdaten – siehe Impressum]
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">2. Welche Daten wir verarbeiten</h2>
          <p>
            Im Rahmen der Konfigurator-Nutzung und Anfrageerstellung werden voraussichtlich
            verarbeitet: Name, Firma, E-Mail-Adresse, Telefonnummer, Nachricht, sowie die von dir
            erstellte Produktkonfiguration (Design, Farbe, Größe, Menge) und hochgeladene
            Logo-Dateien. [Nach finaler technischer Umsetzung – insbesondere Supabase-Anbindung –
            konkretisieren.]
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">3. Zweck der Verarbeitung</h2>
          <p>[z.B. Bearbeitung deiner Anfrage/Bestellung, Kontaktaufnahme, Vertragserfüllung.]</p>
        </div>

        <div>
          <h2 className="font-medium text-brand">4. Rechtsgrundlage</h2>
          <p>[z.B. Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung/vorvertragliche Maßnahmen).]</p>
        </div>

        <div>
          <h2 className="font-medium text-brand">5. Hosting &amp; Auftragsverarbeiter</h2>
          <p>
            [Hosting-Anbieter, Supabase (Datenbank/Storage) und weitere eingesetzte Dienstleister
            mit Standort und Auftragsverarbeitungsvertrag benennen.]
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">6. Speicherdauer</h2>
          <p>[Konkrete Löschfristen festlegen.]</p>
        </div>

        <div>
          <h2 className="font-medium text-brand">7. Deine Rechte</h2>
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
            Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung deiner Daten. Wende dich
            dazu an die oben genannten Kontaktdaten.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-brand">8. Cookies &amp; Tracking</h2>
          <p>
            [Falls Analyse-/Marketing-Cookies eingesetzt werden: Art, Zweck und
            Einwilligungsmechanismus (Cookie-Banner) beschreiben. Aktuell setzt der Konfigurator
            selbst keine Tracking-Cookies.]
          </p>
        </div>
      </section>
    </main>
  );
}
