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
import { ebeneAusAlpha, entferneRandHintergrund, farbEbenen, randIstDeckend, schneideZu, type Raster } from './maske';
import { erzeugeStickplan, StickGrenzeUeberschritten, type Stickplan } from './stickplan';
import { schreibeStickdateien, type Stickdateien } from './formate';

export type DigitalisierErgebnis = { ok: true; plan: Stickplan; /** DST (Kurzform für dateien.dst) */ dst: Buffer; dateien: Stickdateien; hinweise: string[] } | { ok: false; grund: string };

function baue(plan: Stickplan, name: string, zusatzHinweise: string[]): DigitalisierErgebnis {
  const hinweise = [...zusatzHinweise, ...plan.hinweise];
  if (plan.bloecke.length > 1) {
    hinweise.push(`${plan.bloecke.length} Garnfarben: Die Farbwechsel sind in allen Dateien enthalten; PES und JEF tragen die nächstliegende Palettenfarbe, bei DST erfolgt die Garnzuordnung an der Maschine.`);
  }
  const dateien = schreibeStickdateien(plan, name);
  return { ok: true, plan, dst: dateien.dst, dateien, hinweise };
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

export interface LogoOptionen {
  /**
   * Einfarbigen Hintergrund am Bildrand (meist weiß) entfernen? Standard: ja – gestickt wird das Motiv, nicht sein Rechteck.
   * Bei "nein" bleibt das Bild unverändert: ein deckender Hintergrund wird als eigene Garnfarbe MITGESTICKT.
   */
  hintergrundEntfernen?: boolean;
}

/** Logo: einfarbigen Hintergrund entfernen (abschaltbar), in höchstens `maxFarben` Garnfarben zerlegen. */
export function digitalisiereLogo(raster: Raster, name: string, p: StickParameter = STANDARD_PARAMETER, optionen: LogoOptionen = {}): DigitalisierErgebnis {
  try {
    const hinweise: string[] = [];
    const entfernen = optionen.hintergrundEntfernen !== false;
    // Eigene Kopie: der Hintergrund wird im Raster transparent gemacht.
    const kopie: Raster = { breite: raster.breite, hoehe: raster.hoehe, rgba: raster.rgba.slice() };
    if (!entfernen) {
      if (randIstDeckend(kopie)) hinweise.push('Hintergrundentfernung ist aus: Der Hintergrund des Logos wird als eigene Garnfarbe mitgestickt (viele zusätzliche Stiche).');
    } else if (entferneRandHintergrund(kopie)) {
      hinweise.push('Der einfarbige Hintergrund des Logos wurde nicht mitgestickt.');
    } else if (randIstDeckend(kopie)) {
      hinweise.push('Der Hintergrund des Logos ist nicht einfarbig (z. B. Verlauf oder Foto) und ließ sich nicht automatisch entfernen: Er wird mitgestickt.');
    }
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
