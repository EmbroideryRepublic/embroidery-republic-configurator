/**
 * Kauffortschritt des Konfigurators – reine Logik, keine Darstellung.
 *
 * Der Konfigurator soll sich wie ein geführter Einkauf anfühlen, nicht wie
 * ein Werkzeug: Zu jedem Zeitpunkt soll klar sein, was der nächste sinnvolle
 * Schritt ist, welche Schritte schon erledigt sind und was noch fehlt – ohne
 * zu bevormunden. Diese Funktionen liefern genau diese Beurteilung als Daten;
 * die Oberfläche macht daraus Häkchen, Hinweise und die Live-Übersicht.
 *
 * Reihenfolge des Ablaufs (fachlich vorgegeben):
 *   Produkt → Farbe → Größe & Menge → Veredelung → Motiv → Position → Kauf.
 * Produkt, Farbe und Veredelung sind stets vorbelegt; offen sein können in der
 * Praxis Größe/Menge, Motiv und – falls ein Motiv über den Rand ragt – die
 * Position.
 */
import type { ConfigElement, PrintView } from '@/types';
import { groessenRang } from '@/config/products/groessen';
import { DECORATION_POSITION_ORDER } from '@/config/decorationPositions';

/**
 * Größen-/Mengenauswahl als kurzer Text: „L × 2" oder „S × 1 · L × 2".
 * Leer, wenn nichts gewählt ist. Sortiert nach Konfektionsreihenfolge, damit
 * die Reihenfolge nicht vom Zufall der Eingabe abhängt.
 */
export function groessenText(sizeQuantities: Record<string, number>): string {
  return Object.entries(sizeQuantities)
    .filter(([, menge]) => menge > 0)
    .sort(([a], [b]) => groessenRang(a) - groessenRang(b))
    .map(([groesse, menge]) => `${groesse} × ${menge}`)
    .join(' · ');
}

/**
 * Die Ansichten, auf denen ein Motiv liegt – in fachlicher Reihenfolge
 * (Vorderseite, Rückseite, Ärmel). Grundlage der „Position"-Zeile.
 */
export function belegteAnsichten(elements: Pick<ConfigElement, 'view'>[]): PrintView[] {
  const vorhanden = new Set(elements.map((e) => e.view));
  return DECORATION_POSITION_ORDER.filter((view) => vorhanden.has(view));
}

export type SchrittId = 'groesse' | 'motiv' | 'position' | 'bestellen';

/**
 * Der nächste sinnvolle Schritt – oder `null`, wenn gerade keiner ansteht
 * (z. B. ungültiger Preis, dann greift die Preiswarnung an anderer Stelle).
 *
 *   • `groesse`    – es ist noch keine Menge gewählt.
 *   • `motiv`      – Größe steht, aber es liegt noch kein Motiv auf.
 *   • `position`   – ein Motiv ragt über seine Druckfläche hinaus.
 *   • `bestellen`  – alles bereit, ab in den Warenkorb.
 */
export function naechsterSchritt(stand: {
  hatGroesse: boolean;
  hatMotiv: boolean;
  motivImRahmen: boolean;
  preisGueltig: boolean;
}): SchrittId | null {
  if (!stand.hatGroesse) return 'groesse';
  if (!stand.hatMotiv) return 'motiv';
  if (!stand.motivImRahmen) return 'position';
  if (stand.preisGueltig) return 'bestellen';
  return null;
}
