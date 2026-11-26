/**
 * Reine Eingabelogik der Oberfläche „Auftrag bearbeiten“ (OrderEditControl.tsx) –
 * bewusst ohne React, damit sie ohne Browser prüfbar ist.
 *
 * Was hier entsteht, ist nur ein VORSCHLAG des Browsers. Der Server liest ihn als
 * unvertrauenswürdig (orderEdit.ts::liesAenderungen), prüft und berechnet alles
 * selbst. Die Begrenzung der Eingabefelder (nie mehr als bisher, nie unter 0) ist
 * Komfort – kein Schutz.
 */

export interface EditPosition {
  id: string;
  name: string;
  sizeQuantities: Record<string, number>;
}

export interface Eingabe {
  entfernen: boolean;
  mengen: Record<string, number>;
}

export type EditAenderung =
  | { art: 'entfernen'; positionId: string }
  | { art: 'verringern'; positionId: string; neueMengen: Record<string, number> };

/** Ausgangszustand: nichts entfernt, alle Stückzahlen wie bisher. */
export function startEingaben(positionen: EditPosition[]): Record<string, Eingabe> {
  return Object.fromEntries(positionen.map((p) => [p.id, { entfernen: false, mengen: { ...p.sizeQuantities } }]));
}

/**
 * Übernimmt eine getippte Stückzahl: ganze Zahl, höchstens der bisherige Wert,
 * mindestens 0. Unleserliches (leeres Feld) fällt auf den bisherigen Wert zurück –
 * nie auf 0, damit ein Tippfehler nicht still eine Größe entfernt.
 */
export function begrenzeMenge(bisher: number, roh: string): number {
  const zahl = Number.parseInt(roh, 10);
  if (!Number.isFinite(zahl)) return bisher;
  return Math.min(bisher, Math.max(0, zahl));
}

/** Aus den Eingaben die Änderungen bilden: Entfernen schlägt Verringern; unveränderte Positionen fehlen. */
export function baueAenderungen(positionen: EditPosition[], eingaben: Record<string, Eingabe>): EditAenderung[] {
  const ergebnis: EditAenderung[] = [];
  for (const p of positionen) {
    const e = eingaben[p.id];
    if (!e) continue;
    if (e.entfernen) {
      ergebnis.push({ art: 'entfernen', positionId: p.id });
      continue;
    }
    const verringert = Object.entries(p.sizeQuantities).some(([groesse, menge]) => (e.mengen[groesse] ?? menge) < menge);
    if (verringert) ergebnis.push({ art: 'verringern', positionId: p.id, neueMengen: { ...e.mengen } });
  }
  return ergebnis;
}
