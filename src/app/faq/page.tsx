import Link from 'next/link';

export const metadata = { title: 'FAQ | Embroidery Republic Germany' };

const FAQS = [
  {
    q: 'Ab welcher Menge kann ich bestellen?',
    a: 'Die Mindestbestellmenge liegt bei 5 Stück pro Konfiguration – unabhängig davon, ob du DTF-Transferdruck oder Stickerei wählst.',
  },
  {
    q: 'Was ist der Unterschied zwischen DTF-Transferdruck und Stickerei?',
    a: 'DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen (z.B. großer Rückendruck). Stickerei ist langlebiger und hochwertiger in der Haptik, aber auf eine begrenzte Farbanzahl (feste Garnfarben, keine Farbverläufe) und kleinere Flächen beschränkt – typisch für Brustlogos.',
  },
  {
    q: 'Welche Dateiformate kann ich für mein Logo hochladen?',
    a: 'SVG, PNG und PDF werden unterstützt. Für Stickerei digitalisiert unser Team dein Logo im Anschluss manuell in Garnfarben – die Vorschau im Konfigurator zeigt die Platzierung, nicht das finale Stickbild.',
  },
  {
    q: 'Wie lange dauert die Produktion?',
    a: 'In der Regel ca. 5 Werktage ab Auftragsbestätigung, je nach Auslastung und Stückzahl. Für dringende Anfragen sprich uns gerne direkt an.',
  },
  {
    q: 'Kann ich mehrere unterschiedliche Produkte in einer Anfrage kombinieren?',
    a: 'Ja. Konfiguriere ein Produkt, klicke „In den Warenkorb", und konfiguriere danach das nächste Produkt (z.B. T-Shirts und Hoodies in derselben Anfrage). Alle Positionen werden gemeinsam im Warenkorb zusammengefasst.',
  },
  {
    q: 'Bekomme ich vor der Produktion eine Freigabe zu sehen?',
    a: 'Ja, vor Produktionsstart erhältst du eine finale Vorschau zur Freigabe – insbesondere bei Stickerei, da hier eine Digitalisierung durch unser Team erfolgt.',
  },
  {
    q: 'Wie hoch sind die Versandkosten?',
    a: 'Innerhalb Deutschlands ist der Versand ab einem Bestellwert von 75 € kostenlos. Unterhalb dieser Schwelle [Versandkosten hier ergänzen, sobald final festgelegt].',
  },
  {
    q: 'Kann ich personalisierte Produkte zurückgeben?',
    a: 'Nein. Da jedes Produkt individuell nach deinen Vorgaben bedruckt oder bestickt wird, sind personalisierte Artikel vom Widerruf ausgeschlossen und können nicht zurückgegeben werden. Bitte prüfe deine Konfiguration daher sorgfältig vor dem Absenden der Anfrage.',
  },
  {
    q: 'Welche Zahlungsmöglichkeiten gibt es?',
    a: '[Platzhalter – abhängig von eurem finalen Bestellprozess, z.B. Rechnung, Vorkasse, Zahlungsdienstleister. Bitte ergänzen, sobald der Bestellprozess technisch umgesetzt ist.]',
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-xs text-brand-accent hover:underline">
        ← Zurück zum Konfigurator
      </Link>

      <h1 className="mb-6 mt-4 text-xl font-semibold text-brand">Häufige Fragen</h1>

      <div className="space-y-5">
        {FAQS.map((item) => (
          <div key={item.q} className="border-b border-gray-100 pb-4">
            <h2 className="mb-1 text-sm font-medium text-brand">{item.q}</h2>
            <p className="text-sm text-gray-600">{item.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
