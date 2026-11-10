/**
 * Ladebildschirm der Bestell-Detailseite.
 *
 * Ohne diese Datei zeigt Next.js beim Klick auf eine Bestellung so lange die alte Seite, bis die
 * neue vollständig berechnet ist – es fühlt sich an, als passiere nichts (Nutzerbeobachtung
 * 2026-11-10: "dauert lange, bis sich die Seite öffnet"). Mit ihr erscheint sofort der Rahmen der
 * Seite; die Inhalte folgen, sobald sie geladen sind. Die Aufteilung entspricht der echten Seite
 * (Kopf, Statusbereich, Positionen), damit nichts springt.
 *
 * Reiner Platzhalter: keine Daten, keine Anmeldung nötig (die Prüfung macht die Seite selbst).
 */
export default function AdminOrderDetailLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Bestellung wird geladen …</span>

      <div className="space-y-3" aria-hidden="true">
        <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-72 max-w-full animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
        <div className="h-28 animate-pulse rounded-lg border border-gray-200 bg-white" />
        <div className="h-28 animate-pulse rounded-lg border border-gray-200 bg-white" />
      </div>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4" aria-hidden="true">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
        <div className="h-40 w-full animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
