/**
 * Stückzahl einer Position aus den Größen-Mengen.
 *
 * ── Warum eine eigene Datei ───────────────────────────────────────────
 * Diese Regel („was ist die Menge einer Position?") existierte an VIER
 * Stellen: dreimal in der Oberfläche als einfaches `reduce` und einmal
 * serverseitig mit zusätzlicher Absicherung gegen negative oder
 * nicht-numerische Werte. Die Oberfläche hätte damit eine andere Menge
 * angezeigt, als der Server berechnet – bei manipulierten oder fehlerhaften
 * Daten also einen anderen Preis.
 *
 * Fachliche Regeln gehören genau einmal definiert. Diese Funktion ist die
 * einzige gültige Antwort auf die Frage – Oberfläche, Server, API und
 * Adminbereich nutzen sie gemeinsam.
 *
 * Bewusst OHNE Abhängigkeit zu UI, Store oder Datenbank.
 */
export function sumSizeQuantities(sizeQuantities: Record<string, number> | undefined | null): number {
  if (!sizeQuantities) return 0;
  return Object.values(sizeQuantities).reduce<number>((sum, q) => {
    const n = Number(q);
    return sum + (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  }, 0);
}
