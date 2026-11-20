/**
 * Anmerkung der Kundschaft (Bestellung) bzw. Nachricht der Kundschaft (Anfrage) im Adminbereich – bewusst auffällig.
 *
 * Eine Kundenanmerkung kann den Auftrag ändern (Wunschtermin, Hinweis zum Motiv, Lieferhinweis) und darf nicht
 * untergehen. Violett ist hier Absicht: Rot (Fehler/Aufmerksamkeit), Grün (produktionsbereit), Amber (Zahlung offen), Blau
 * (Anfrage) und Grau (storniert) belegen schon den Status – Violett gehört ausschließlich der Kundenanmerkung, in Liste,
 * Detailseite und interner E-Mail gleichermaßen.
 *
 * Der Text kommt als freie Eingabe aus dem Checkout und wird nur als Text dargestellt (React escaped; kein HTML).
 */

/** Überschrift je nach Vorgang: bei einer Bestellung ist es eine Anmerkung, bei einer Anfrage die eigentliche Nachricht. */
export function anmerkungTitel(orderType: 'order' | 'inquiry'): string {
  return orderType === 'order' ? 'Anmerkung der Kundschaft' : 'Nachricht der Kundschaft';
}

export function KundenAnmerkung({ text, orderType }: { text: string; orderType: 'order' | 'inquiry' }) {
  const titel = anmerkungTitel(orderType);
  return (
    <section
      aria-label={titel}
      data-testid="kunden-anmerkung"
      className="rounded-lg border-2 border-violet-500 bg-violet-50 p-4"
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold text-violet-900">
        <span aria-hidden="true" className="inline-block rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
          ✎
        </span>
        {titel} – bitte lesen
      </h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-violet-950">{text}</p>
    </section>
  );
}
