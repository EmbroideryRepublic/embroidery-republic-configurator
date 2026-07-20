import path from 'node:path';

const FONTS_DIR = path.join(process.cwd(), 'src', 'lib', 'rendering', 'assets', 'fonts');

/**
 * Ersatzschriften-Zuordnung für das serverseitige Rendering: die im Editor
 * wählbaren Schriften (src/config/fonts.ts, AVAILABLE_FONTS) sind
 * ungebündelte OS-Systemschriften (Arial, Verdana, Impact, ...), die auf
 * einem Linux-Server nicht vorhanden sind. Wir bündeln stattdessen frei
 * redistributierbare, weitgehend metrik-kompatible Ersatzschriften.
 *
 * Bekannte, akzeptierte Abweichung: für Verdana/Trebuchet MS (DejaVu Sans
 * als Näherung) und Impact (Anton als Näherung, schmaler/anders als das
 * echte Impact) ist die visuelle Übereinstimmung mit dem, was der Kunde im
 * Editor sah, nur annähernd – das ist eine bewusste, dokumentierte Lücke,
 * die in diesem Plan nicht weiter aufgelöst wird (siehe Phase-2-Plan).
 */
export const FONT_SUBSTITUTES: Record<string, string> = {
  Arial: 'Arimo',
  Helvetica: 'Arimo',
  Georgia: 'Gelasio',
  'Times New Roman': 'Tinos',
  'Courier New': 'Cousine',
  Verdana: 'DejaVu Sans',
  'Trebuchet MS': 'DejaVu Sans',
  Impact: 'Anton',
};

const DEFAULT_SUBSTITUTE = 'Arimo';

/** Alle gebündelten Schriftdatei-Varianten je Familie (Regular/Bold/Italic/
 *  BoldItalic) – Anton hat nur eine Variante (Display-Schrift, im Editor
 *  ohnehin ohne separate Fett/Kursiv-Option sinnvoll nutzbar). */
const FONT_FILES: Record<string, string[]> = {
  Arimo: ['Arimo-Regular.ttf', 'Arimo-Bold.ttf', 'Arimo-Italic.ttf', 'Arimo-BoldItalic.ttf'],
  Tinos: ['Tinos-Regular.ttf', 'Tinos-Bold.ttf', 'Tinos-Italic.ttf', 'Tinos-BoldItalic.ttf'],
  Cousine: ['Cousine-Regular.ttf', 'Cousine-Bold.ttf', 'Cousine-Italic.ttf', 'Cousine-BoldItalic.ttf'],
  Gelasio: ['Gelasio-Regular.ttf', 'Gelasio-Bold.ttf', 'Gelasio-Italic.ttf', 'Gelasio-BoldItalic.ttf'],
  'DejaVu Sans': ['DejaVuSans-Regular.ttf', 'DejaVuSans-Bold.ttf', 'DejaVuSans-Italic.ttf', 'DejaVuSans-BoldItalic.ttf'],
  Anton: ['Anton-Regular.ttf'],
};

/** AVAILABLE_FONTS-Wert (aus dem Editor, z.B. "Arial") -> gebündelter
 *  Familienname, wie er im SVG als font-family verwendet wird. */
export function resolveFontFamily(fontFamily: string): string {
  return FONT_SUBSTITUTES[fontFamily] ?? DEFAULT_SUBSTITUTE;
}

/** Flache Liste aller gebündelten Schriftdatei-Pfade – wird komplett an
 *  resvgs `fontFiles`-Option übergeben (fontdb wählt anhand von
 *  font-family/font-weight/font-style selbst die passende Datei aus). */
export function getFontFiles(): string[] {
  return Object.values(FONT_FILES)
    .flat()
    .map((fileName) => path.join(FONTS_DIR, fileName));
}
