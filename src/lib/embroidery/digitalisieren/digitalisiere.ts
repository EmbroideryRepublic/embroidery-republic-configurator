/**
 * Automatische Digitalisierung: Raster (Text oder Logo in Stickgröße) → Stickplan → DST-Datei.
 *
 * ── Was das kann und was nicht ─────────────────────────────────────────
 * Das Verfahren erzeugt aus dem Motiv Füll- und satinähnliche Reihen mit Unterlage, Zugkompensation und
 * Sicherungsstichen. Gut geeignet: Schrift ab etwa 5 mm Höhe, flächige Logos mit wenigen Farben. Nicht geeignet:
 * Fotos, Verläufe, sehr feine Linien (unter etwa 0,8 mm) und sehr kleine Schrift. Es ersetzt kein von Hand
 * digitalisiertes Motiv für Serien- oder Qualitätsware – es spart die Handarbeit für den Regelfall. Die Hinweise des
 * Ergebnisses sagen, wo das Motiv an die Grenzen stößt. Vor der Serie einmal auf Probestoff sticken.
 */
import { STANDARD_PARAMETER, type StickParameter } from './parameter';
import { ebeneAusAlpha, entferneRandHintergrund, farbEbenen, schneideZu, type Raster } from './maske';
import { erzeugeStickplan, StickGrenzeUeberschritten, type Stickplan } from './stickplan';
import { schreibeDst } from './dst';

export type DigitalisierErgebnis = { ok: true; plan: Stickplan; dst: Buffer; hinweise: string[] } | { ok: false; grund: string };

function baue(plan: Stickplan, name: string, zusatzHinweise: string[]): DigitalisierErgebnis {
  const hinweise = [...zusatzHinweise, ...plan.hinweise];
  if (plan.bloecke.length > 1) {
    hinweise.push(`${plan.bloecke.length} Garnfarben: Die Farbwechsel sind in der Datei enthalten, die Garnzuordnung erfolgt an der Maschine.`);
  }
  return { ok: true, plan, dst: schreibeDst(plan, name), hinweise };
}

/** Text: eine Garnfarbe aus der Schriftfarbe, die Form aus dem Alphakanal. */
export function digitalisiereText(raster: Raster, hex: string, name: string, p: StickParameter = STANDARD_PARAMETER): DigitalisierErgebnis {
  try {
    const zugeschnitten = schneideZu(raster);
    if (!zugeschnitten) return { ok: false, grund: 'Der Text enthält nichts Sichtbares.' };
    // Text kommt sauber aus dem Renderer, es gibt kein Bildrauschen: auch kleine Punkte (i, ü, Satzzeichen) bleiben erhalten.
    return baue(erzeugeStickplan([ebeneAusAlpha(zugeschnitten, hex)], { ...p, minFlaecheMm2: Math.min(p.minFlaecheMm2, 0.1) }), name, []);
  } catch (fehler) {
    if (fehler instanceof StickGrenzeUeberschritten) return { ok: false, grund: fehler.message };
    throw fehler;
  }
}

/** Logo: einfarbigen Hintergrund entfernen, in höchstens `maxFarben` Garnfarben zerlegen. */
export function digitalisiereLogo(raster: Raster, name: string, p: StickParameter = STANDARD_PARAMETER): DigitalisierErgebnis {
  try {
    const hinweise: string[] = [];
    // Eigene Kopie: der Hintergrund wird im Raster transparent gemacht.
    const kopie: Raster = { breite: raster.breite, hoehe: raster.hoehe, rgba: raster.rgba.slice() };
    if (entferneRandHintergrund(kopie)) hinweise.push('Der einfarbige Hintergrund des Logos wurde nicht mitgestickt.');
    const zugeschnitten = schneideZu(kopie);
    if (!zugeschnitten) return { ok: false, grund: 'Das Logo enthält nichts Sichtbares.' };
    const ebenen = farbEbenen(zugeschnitten, p.maxFarben);
    if (ebenen.length === 0) return { ok: false, grund: 'Im Logo wurde keine stickbare Farbfläche gefunden.' };
    return baue(erzeugeStickplan(ebenen, p), name, hinweise);
  } catch (fehler) {
    if (fehler instanceof StickGrenzeUeberschritten) return { ok: false, grund: fehler.message };
    throw fehler;
  }
}
