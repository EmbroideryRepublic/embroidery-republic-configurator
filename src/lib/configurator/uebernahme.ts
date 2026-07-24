/**
 * Auswahl beim Produktwechsel übernehmen – reine Logik, keine Darstellung.
 *
 * Wer im Konfigurator von einem Hoodie zum nächsten wechselt, hat Farbe,
 * Größe und Veredelungsart schon gewählt. Sie jedes Mal neu einzustellen
 * fühlt sich nach Formular an, nicht nach Einkaufen. Diese Funktionen tragen
 * die Auswahl deshalb mit hinüber:
 *
 *   • Farbe – exakt gleicher Name, sonst der farblich nächste Ton.
 *   • Größe – gleiche Größe, sonst die nächstgelegene Konfektionsgröße.
 *   • Veredelungsart – bleibt im Store ohnehin erhalten (produktunabhängig);
 *     sie taucht hier nur der Vollständigkeit halber im Ergebnis auf.
 *
 * Führt das neue Produkt eine Farbe oder Größe gar nicht, wird die nächste
 * sinnvolle Alternative gewählt – nie einfach die erste.
 */
import type { ProductColorConfig, ProductConfig } from '@/config/products/types';
import { groessenIndex } from '@/config/products/groessen';

function hexZuRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const voll = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(voll.slice(0, 2), 16) || 0,
    parseInt(voll.slice(2, 4), 16) || 0,
    parseInt(voll.slice(4, 6), 16) || 0,
  ];
}

/** Quadratischer Farbabstand im RGB-Raum – reicht, um „nah" zu bestimmen. */
function farbabstand(a: string, b: string): number {
  const [r1, g1, b1] = hexZuRgb(a);
  const [r2, g2, b2] = hexZuRgb(b);
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

/**
 * Passende Farbe im neuen Produkt.
 *
 * Erst der exakt gleiche Name (Groß-/Kleinschreibung egal – „Navy" bleibt
 * „Navy"), sonst der farblich nächste Ton. Ohne Vorgabe: die erste Farbe.
 */
export function passendeFarbe(neu: ProductConfig, altFarbe: ProductColorConfig | undefined): string | undefined {
  const farben = neu.colors;
  if (farben.length === 0) return undefined;
  if (!altFarbe) return farben[0]!.id;

  const exakt = farben.find((c) => c.name.toLowerCase() === altFarbe.name.toLowerCase());
  if (exakt) return exakt.id;

  let beste = farben[0]!;
  let besterAbstand = farbabstand(beste.hex, altFarbe.hex);
  for (const c of farben.slice(1)) {
    const d = farbabstand(c.hex, altFarbe.hex);
    if (d < besterAbstand) {
      besterAbstand = d;
      beste = c;
    }
  }
  return beste.id;
}

/** Die dem Wunsch nächstgelegene verfügbare Konfektionsgröße. */
export function naechsteGroesse(wunsch: string, verfuegbar: string[]): string | undefined {
  if (verfuegbar.includes(wunsch)) return wunsch;
  const rang = groessenIndex(wunsch);
  if (rang === -1) return undefined; // unbekannte Größe – keine sinnvolle Nähe

  let beste: string | undefined;
  let besterAbstand = Infinity;
  for (const g of verfuegbar) {
    const r = groessenIndex(g);
    if (r === -1) continue;
    const d = Math.abs(r - rang);
    // Bei Gleichstand die kleinere Größe bevorzugen (fällt niemandem zu eng aus).
    if (d < besterAbstand || (d === besterAbstand && beste !== undefined && r < groessenIndex(beste))) {
      besterAbstand = d;
      beste = g;
    }
  }
  return beste;
}

/**
 * Größen-/Mengenauswahl auf das neue Produkt abbilden.
 *
 * Vorhandene Größen bleiben; fehlende wandern auf die nächstgelegene. Fallen
 * zwei Wunschgrößen auf dieselbe Ersatzgröße, addieren sich ihre Mengen.
 */
export function passendeGroessen(
  neu: ProductConfig,
  mengen: Record<string, number>
): Record<string, number> {
  const ergebnis: Record<string, number> = {};
  for (const [groesse, menge] of Object.entries(mengen)) {
    if (menge <= 0) continue;
    const ziel = naechsteGroesse(groesse, neu.sizes);
    if (!ziel) continue;
    ergebnis[ziel] = (ergebnis[ziel] ?? 0) + menge;
  }
  return ergebnis;
}

export type Uebernahme = {
  colorId: string | undefined;
  sizeQuantities: Record<string, number>;
};

/**
 * Farbe und Größen vom alten aufs neue Produkt übertragen.
 *
 * `altColorId` bezieht sich auf das ALTE Produkt; von dort wird Name und Hex
 * gelesen, um im neuen Produkt den passenden Ton zu finden.
 */
export function uebernehmeAuswahl(
  alt: ProductConfig | undefined,
  neu: ProductConfig,
  altColorId: string | null,
  mengen: Record<string, number>
): Uebernahme {
  const altFarbe = alt?.colors.find((c) => c.id === altColorId);
  return {
    colorId: passendeFarbe(neu, altFarbe),
    sizeQuantities: passendeGroessen(neu, mengen),
  };
}
