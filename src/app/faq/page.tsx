import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqSchema } from '@/lib/seo/strukturierteDaten';

export const metadata = {
  title: 'Häufige Fragen',
  description:
    'Antworten zu Bestellmengen, DTF-Transferdruck vs. Stickerei, Dateiformaten, Produktionszeit, Versand und Zahlung bei Embroidery Republic Germany.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'Häufige Fragen',
    description:
      'Antworten zu Bestellmengen, DTF-Transferdruck vs. Stickerei, Dateiformaten, Produktionszeit, Versand und Zahlung.',
  },
};

/**
 * Fragen sind bewusst in Themen gruppiert (statt einer langen Liste): Das
 * verkürzt die Suche und gibt der Seite eine editoriale Struktur. Für das
 * FAQPage-Schema werden alle Fragen wieder zu einer flachen Liste vereint.
 */
const GRUPPEN: { thema: string; fragen: { q: string; a: string }[] }[] = [
  {
    thema: 'Bestellung & Ablauf',
    fragen: [
      {
        q: 'Kann ich auch als Privatperson bestellen?',
        a: 'Ja. Wir beliefern Privatkunden ebenso wie Geschäftskunden. Der Schwerpunkt liegt auf Unternehmen, Vereinen, Schulen, Gastronomiebetrieben und ähnlichen Organisationen – die Abwicklung ist für alle identisch.',
      },
      {
        q: 'Ab welcher Menge kann ich bestellen?',
        a: 'Es gibt keine Mindestbestellmenge – Sie können ab einem einzelnen Stück bestellen. Größen dürfen Sie dabei frei mischen (z.B. 2× M, 2× L, 1× XL). Die einmaligen Einrichtungskosten (Stickdatei bzw. Transferbogen) fallen pro Auftrag nur einmal an und verteilen sich auf die Stückzahl – deshalb sinkt der Stückpreis mit größerer Menge deutlich.',
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
        q: 'Kann ich eine Bestellung noch stornieren?',
        a: 'Ja – innerhalb von zwei Stunden nach Bestelleingang, sofern die Produktion noch nicht begonnen hat. Senden Sie uns dafür einfach eine kurze Nachricht in Textform unter Angabe Ihrer Bestellnummer. Danach ist eine Stornierung nicht mehr möglich, da die Ware individuell für Sie gefertigt wird.',
      },
      {
        q: 'Was ist der Unterschied zwischen Bestellung und unverbindlicher Anfrage?',
        a: 'Mit der Bestellung erteilen Sie uns einen verbindlichen Auftrag. Bei der unverbindlichen Anfrage senden Sie uns lediglich Ihre Konfiguration – wir melden uns persönlich, klären offene Punkte und Sie entscheiden danach in Ruhe. Bei einer Anfrage werden keine Zahlungsdaten erhoben und es entsteht keine Verpflichtung.',
      },
    ],
  },
  {
    thema: 'Veredelung & Dateien',
    fragen: [
      {
        q: 'Was ist der Unterschied zwischen DTF-Transferdruck und Stickerei?',
        a: 'DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen – etwa einen großflächigen Rückendruck. Stickerei ist langlebiger und hochwertiger in der Haptik, arbeitet aber mit einer begrenzten Anzahl fester Garnfarben (keine Farbverläufe) und eignet sich vor allem für kompaktere Motive wie Brustlogos.',
      },
      {
        q: 'Welche Dateiformate kann ich für mein Logo hochladen?',
        a: 'SVG, PNG und PDF werden unterstützt. Am besten eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren. Für Stickerei digitalisiert unser Team Ihr Logo anschließend manuell in Garnfarben – die Vorschau im Konfigurator zeigt die Platzierung, nicht das finale Stickbild.',
      },
    ],
  },
  {
    thema: 'Produktion, Versand & Zahlung',
    fragen: [
      {
        q: 'Wie lange dauert die Produktion?',
        a: 'Die Produktion beginnt nach Bestellfreigabe, sobald alle Druck- bzw. Stickdaten vollständig vorliegen. Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, der anschließende Versand erfolgt innerhalb von 1 bis 2 Werktagen. Bei größeren Bestellmengen oder besonders aufwendigen Produktionen kann sich die Produktionszeit verlängern – wir informieren Sie in diesem Fall.',
      },
      {
        q: 'Wie hoch sind die Versandkosten?',
        a: 'Wir liefern aktuell ausschließlich innerhalb Deutschlands. Die Versandkosten betragen 6,90 € – ab einem Bestellwert von 75,00 € liefern wir versandkostenfrei. Die Lieferung in weitere europäische Länder bereiten wir vor und geben sie bekannt, sobald sie verfügbar ist.',
      },
      {
        q: 'Kann ich personalisierte Produkte zurückgeben?',
        a: 'Nein. Jedes Produkt wird ausschließlich mit mindestens einem von Ihnen festgelegten Logo oder Text individuell bedruckt oder bestickt – eine Bestellung ganz ohne eigenes Motiv ist bei uns nicht möglich. Diese personalisierten Artikel sind vom Widerrufsrecht ausgeschlossen und können nicht zurückgegeben werden. Bitte prüfen Sie Ihre Konfiguration daher sorgfältig – und nutzen Sie im Zweifel die unverbindliche Anfrage, bevor Sie verbindlich bestellen.',
      },
      {
        q: 'Welche Zahlungsmöglichkeiten gibt es?',
        a: 'Sie können zwischen Kreditkarte, PayPal und Kauf auf Rechnung wählen. Bei Kreditkarte und PayPal wird der Betrag direkt im Bestellvorgang über den jeweiligen Anbieter abgebucht. Bei Kauf auf Rechnung wird im Bestellvorgang selbst nichts abgebucht; Sie erhalten die Rechnung separat im Zuge der Auftragsbearbeitung, zahlbar innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug.',
      },
    ],
  },
];

/** Flache Gesamtliste – Grundlage für das FAQPage-Schema. */
const ALLE_FRAGEN = GRUPPEN.flatMap((g) => g.fragen);

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <JsonLd daten={faqSchema(ALLE_FRAGEN)} />
      <Link href="/" className="text-xs text-gold-dark transition-colors hover:text-gold">
        ← Zurück zur Startseite
      </Link>

      <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-gold">Hilfe &amp; Antworten</p>
      <h1 className="mt-4 font-serif text-[clamp(2.25rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
        Häufige Fragen
      </h1>
      <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-brand/60">
        Die wichtigsten Antworten rund um Veredelung, Mengen, Produktion und Abwicklung. Ist Ihre
        Frage nicht dabei? Wir antworten persönlich – meist innerhalb eines Werktags.
      </p>

      <div className="mt-12 space-y-12">
        {GRUPPEN.map((gruppe) => (
          <section key={gruppe.thema}>
            <h2 className="text-[12px] font-medium uppercase tracking-[0.18em] text-brand/45">
              {gruppe.thema}
            </h2>
            <div className="mt-4 space-y-3">
              {gruppe.fragen.map((item) => (
                <div key={item.q} className="rounded-xl border border-gold/20 bg-white p-5 shadow-elegant">
                  <h3 className="mb-1.5 font-medium text-brand">{item.q}</h3>
                  <p className="text-sm leading-relaxed text-brand/70">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-2xl bg-cream/70 p-6 text-center sm:p-8">
        <h2 className="font-serif text-xl font-normal text-brand">Noch eine Frage offen?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand/60">
          Schreiben Sie uns kurz, worum es geht – wir melden uns persönlich mit einer konkreten
          Einschätzung zu Machbarkeit, Menge und Termin.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/kontakt"
            className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white shadow-elegant transition-all duration-300 ease-out hover:bg-gold-dark active:scale-[0.98]"
          >
            Kontakt aufnehmen
          </Link>
          <Link
            href="/konfigurator"
            className="rounded-full border border-gold/40 px-5 py-2.5 text-sm font-medium text-gold-dark transition-all duration-300 ease-out hover:bg-gold-light/40 active:scale-[0.98]"
          >
            Zum Konfigurator
          </Link>
        </div>
      </div>
    </main>
  );
}
