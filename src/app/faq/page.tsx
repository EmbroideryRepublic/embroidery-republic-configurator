import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqSchema } from '@/lib/seo/strukturierteDaten';

export const metadata = {
  title: 'Häufige Fragen',
  description:
    'Antworten zu Bestellmengen, DTF-Transferdruck vs. Stickerei, Dateiformaten, Produktionszeit, Versand und Zahlung bei Embroidery Republic Germany.',
  alternates: { canonical: '/faq' },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Kann ich auch als Privatperson bestellen?',
    a: 'Ja. Wir beliefern Privatkunden ebenso wie Geschäftskunden. Der Schwerpunkt liegt auf Unternehmen, Vereinen, Schulen, Gastronomiebetrieben und ähnlichen Organisationen – die Abwicklung ist für alle identisch.',
  },
  {
    q: 'Ab welcher Menge kann ich bestellen?',
    a: 'Es gibt keine Mindestbestellmenge – Sie können ab einem einzelnen Stück bestellen. Größen dürfen Sie dabei frei mischen (z.B. 2× M, 2× L, 1× XL). Die einmaligen Einrichtungskosten (Stickdatei bzw. Transferbogen) fallen pro Auftrag nur einmal an und verteilen sich auf die Stückzahl – deshalb sinkt der Stückpreis mit größerer Menge deutlich.',
  },
  {
    q: 'Was ist der Unterschied zwischen DTF-Transferdruck und Stickerei?',
    a: 'DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen – etwa einen großflächigen Rückendruck. Stickerei ist langlebiger und hochwertiger in der Haptik, arbeitet aber mit einer begrenzten Anzahl fester Garnfarben (keine Farbverläufe) und eignet sich vor allem für kompaktere Motive wie Brustlogos.',
  },
  {
    q: 'Welche Dateiformate kann ich für mein Logo hochladen?',
    a: 'SVG, PNG und PDF werden unterstützt. Am besten eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren. Für Stickerei digitalisiert unser Team Ihr Logo anschließend manuell in Garnfarben – die Vorschau im Konfigurator zeigt die Platzierung, nicht das finale Stickbild.',
  },
  {
    q: 'Wie lange dauert die Produktion?',
    a: 'Die Produktion beginnt nach Bestellfreigabe, sobald alle Druck- bzw. Stickdaten vollständig vorliegen. Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, der anschließende Versand erfolgt innerhalb von 1 bis 2 Werktagen. Bei größeren Bestellmengen oder besonders aufwendigen Produktionen kann sich die Produktionszeit verlängern – wir informieren Sie in diesem Fall.',
  },
  {
    q: 'Kann ich mehrere unterschiedliche Produkte kombinieren?',
    a: 'Ja. Konfigurieren Sie ein Produkt, legen Sie es in den Warenkorb und konfigurieren Sie anschließend das nächste – zum Beispiel T-Shirts und Hoodies im selben Auftrag. Alle Positionen werden gemeinsam im Warenkorb zusammengefasst.',
  },
  {
    q: 'Sehe ich vor der Produktion eine Freigabe?',
    a: 'Ja. Vor Produktionsstart erhalten Sie eine finale Vorschau zur Freigabe – besonders relevant bei Stickerei, da hier zuvor eine Digitalisierung durch unser Team erfolgt.',
  },
  {
    q: 'Wie hoch sind die Versandkosten?',
    a: 'Innerhalb Deutschlands betragen die Versandkosten 6,90 € – ab einem Bestellwert von 75,00 € liefern wir versandkostenfrei. Für Lieferungen innerhalb der Europäischen Union betragen die Versandkosten 11,99 €, ab einem Bestellwert von 100,00 € entfallen sie. Die für Ihre Bestellung geltenden Kosten werden im Bestellvorgang automatisch anhand von Lieferland und Bestellwert berechnet und vor dem Absenden transparent ausgewiesen.',
  },
  {
    q: 'Kann ich eine Bestellung noch stornieren?',
    a: 'Ja – innerhalb von zwei Stunden nach Bestelleingang, sofern die Produktion noch nicht begonnen hat. Senden Sie uns dafür einfach eine kurze Nachricht in Textform unter Angabe Ihrer Bestellnummer. Danach ist eine Stornierung nicht mehr möglich, da die Ware individuell für Sie gefertigt wird.',
  },
  {
    q: 'Kann ich personalisierte Produkte zurückgeben?',
    a: 'Nein. Da jedes Produkt individuell nach Ihren Vorgaben bedruckt oder bestickt wird, sind personalisierte Artikel vom Widerrufsrecht ausgeschlossen und können nicht zurückgegeben werden. Bitte prüfen Sie Ihre Konfiguration daher sorgfältig – und nutzen Sie im Zweifel die unverbindliche Anfrage, bevor Sie verbindlich bestellen.',
  },
  {
    q: 'Welche Zahlungsmöglichkeiten gibt es?',
    a: 'Bestellungen werden grundsätzlich auf Rechnung abgewickelt. Die Rechnung ist innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug zu begleichen. Sie erhalten sie separat im Zuge der Auftragsbearbeitung – im Bestellvorgang selbst wird nichts abgebucht. Kartenzahlung und PayPal befinden sich in Vorbereitung.',
  },
  {
    q: 'Was ist der Unterschied zwischen Bestellung und unverbindlicher Anfrage?',
    a: 'Mit der Bestellung erteilen Sie uns einen verbindlichen Auftrag. Bei der unverbindlichen Anfrage senden Sie uns lediglich Ihre Konfiguration – wir melden uns persönlich, klären offene Punkte und Sie entscheiden danach in Ruhe. Bei einer Anfrage werden keine Zahlungsdaten erhoben und es entsteht keine Verpflichtung.',
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <JsonLd daten={faqSchema(FAQS)} />
      <Link href="/" className="text-xs text-gold-dark hover:underline">
        ← Zurück zur Startseite
      </Link>

      <h1 className="mb-1 mt-4 font-serif text-2xl font-semibold text-brand">Häufige Fragen</h1>
      <p className="mb-8 text-sm text-brand/60">
        Die wichtigsten Antworten rund um Veredelung, Mengen, Produktion und Abwicklung. Ist Ihre
        Frage nicht dabei? Wir antworten persönlich – meist innerhalb eines Werktags.
      </p>

      <div className="space-y-3">
        {FAQS.map((item) => (
          <div key={item.q} className="rounded-xl border border-gold/20 bg-white p-5 shadow-elegant">
            <h2 className="mb-1.5 font-medium text-brand">{item.q}</h2>
            <p className="text-sm leading-relaxed text-brand/70">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-cream/70 p-6 text-center">
        <h2 className="font-serif text-lg font-semibold text-brand">Noch eine Frage offen?</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-brand/60">
          Schreiben Sie uns kurz, worum es geht – wir melden uns persönlich mit einer konkreten
          Einschätzung zu Machbarkeit, Menge und Termin.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/kontakt"
            className="rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-white shadow-elegant transition-colors hover:bg-gold-dark"
          >
            Kontakt aufnehmen
          </Link>
          <Link
            href="/konfigurator"
            className="rounded-lg border border-gold/40 px-5 py-2.5 text-sm font-medium text-gold-dark transition-colors hover:bg-gold-light/40"
          >
            Zum Konfigurator
          </Link>
        </div>
      </div>
    </main>
  );
}
