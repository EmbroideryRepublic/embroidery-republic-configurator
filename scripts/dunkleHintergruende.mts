/**
 * Helle Kleidungsstücke auf dunklem Hintergrund (Anzeige-Bilder).
 *
 * ── Warum ──────────────────────────────────────────────────────────────
 * Weiße, cremefarbene, hellgraue und pastellige Ware geht auf dem weißen Studiohintergrund der Lieferantenfotos (und auf
 * weißen Kacheln) fast unter. Für diese Farben erzeugt das Skript neben jedem Foto eine Variante
 * `<ansicht>-dunkel.webp`: dasselbe Kleidungsstück, freigestellt auf einem dunklen Verlauf. Maße, Lage und Größe sind
 * identisch zum Original (620×720) – Druckflächen, Konfigurator und Produktionsvorschau rechnen unverändert weiter.
 *
 * ── Was NICHT passiert ─────────────────────────────────────────────────
 * Die Originale (`<ansicht>.webp/.png`) werden nie angefasst. Die Anzeige (Kacheln, Produktseite, Konfigurator-Vorschau)
 * wählt die Varianten über src/lib/assets (resolveAnzeigeBilder, anzeigeProduktBild …); Strukturierte Daten, Sitemap,
 * Merchant-Feed, Druckflächen-Vermessung und Produktionsblätter bleiben bei den Originalen.
 *
 * ── Welche Farben ──────────────────────────────────────────────────────
 * Helligkeit L* ≥ 75 im Brustbereich des Frontfotos (weiß, creme, hellgrau, pastell, neon-hell). Zweifarbige Produkte
 * (Baseball, Contrast-Hoodie) werden ausgelassen: dort entscheidet nicht eine Stofffarbe. Eine Farbe bekommt die
 * Varianten nur, wenn ALLE ihre Ansichten die Prüfung bestehen (kein Stoff am Bildrand, plausibler Hintergrundanteil);
 * sonst bleibt sie komplett beim weißen Original – kein Mischzustand je Farbe.
 *
 * ── Ergebnis ───────────────────────────────────────────────────────────
 * `src/lib/assets/dunklerHintergrund.generated.ts` (Produkt → Farbe → Ansichten mit Variante). Idempotent: vorhandene
 * Varianten werden übersprungen, mit `--neu` neu erzeugt.
 *
 * Aufruf:  npx tsx --tsconfig tsconfig.scripts.json scripts/dunkleHintergruende.mts [--neu]
 * Danach: python scripts/personenPruefung.py (neue Bilder prüfen), npm test.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';
// @ts-expect-error – reine JS-Datei ohne Typen
import { dunkel } from './lib/dunklerHintergrund.mjs';

const NEU = process.argv.includes('--neu');
const PUBLIC = path.join(process.cwd(), 'public');
const HELL_AB = 75;
const ZWEIFARBIG = ['fotl-baseball-t', 'fotl-baseball-longsleeve', 'justhoods-contrast-hoodie'];
const ANSICHTEN = ['front', 'back', 'sleeve_left', 'sleeve_right'] as const;

const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };

/** L* aus dem Brustbereich (30–70 % Breite, 40–70 % Höhe des nicht weißen Umrisses) des Frontfotos. */
async function helligkeit(png: string): Promise<number> {
  const { data, info } = await sharp(png).flatten({ background: '#fff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; if (765 - (data[i]! + data[i + 1]! + data[i + 2]!) > 18) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = Math.round(y0 + bh * 0.4); y < Math.round(y0 + bh * 0.7); y++) for (let x = Math.round(x0 + bw * 0.3); x < Math.round(x0 + bw * 0.7); x++) { const i = (y * w + x) * 3; r += lin(data[i]!); g += lin(data[i + 1]!); b += lin(data[i + 2]!); n++; }
  const Y = 0.2126 * (r / n) + 0.7152 * (g / n) + 0.0722 * (b / n);
  return Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
}

const pngVon = (webp: string) => path.join(PUBLIC, webp.replace(/\.webp$/i, '.png'));
const dunkelVon = (webp: string) => path.join(PUBLIC, webp.replace(/\.webp$/i, '-dunkel.webp'));

const ergebnis: Record<string, Record<string, string[]>> = {};
const ausgeschlossen: string[] = [];
let erzeugt = 0, vorhanden = 0, farben = 0;

for (const [produktId, nachFarbe] of Object.entries(ASSET_MANIFEST)) {
  if (ZWEIFARBIG.some((z) => produktId.startsWith(z))) continue;
  for (const [farbeId, eintrag] of Object.entries(nachFarbe)) {
    const front = eintrag.views['front'];
    if (eintrag.status !== 'real' || !front || front.includes('_platzhalter') || !existsSync(pngVon(front))) continue;
    if ((await helligkeit(pngVon(front))) < HELL_AB) continue;
    farben++;
    const ansichten: string[] = [];
    const bilder: { pfad: string; webp: Buffer }[] = [];
    let ok = true;
    for (const view of ANSICHTEN) {
      const webp = eintrag.views[view];
      if (!webp || webp.includes('_platzhalter') || !existsSync(pngVon(webp))) continue;
      const ziel = dunkelVon(webp);
      if (existsSync(ziel) && !NEU) { ansichten.push(view); vorhanden++; continue; }
      const d = await dunkel(pngVon(webp));
      const hg = d.anteilHintergrund as number;
      const gut = d.rahmen <= 0.02 && (view === 'front' || view === 'back' ? hg >= 0.3 && hg <= 0.8 : hg >= 0.35 && hg <= 0.98) && d.kastenFuellung <= (view === 'front' || view === 'back' ? 0.9 : 0.97) && (d.kernMin < 240 || (d.fuellung >= 0.995 && d.symmetrie >= 0.85));
      if (!gut) { ok = false; ausgeschlossen.push(`${produktId}/${farbeId}/${view} (Hintergrund ${(hg * 100).toFixed(0)} %, Rand ${(d.rahmen * 100).toFixed(1)} %, Füllung ${(d.fuellung * 100).toFixed(1)} %, Kasten ${(d.kastenFuellung * 100).toFixed(0)} %, Symmetrie ${(d.symmetrie * 100).toFixed(0)} %)`); break; }
      bilder.push({ pfad: ziel, webp: d.webp as Buffer });
      ansichten.push(view);
    }
    if (!ok || ansichten.length === 0) continue;
    for (const b of bilder) { mkdirSync(path.dirname(b.pfad), { recursive: true }); writeFileSync(b.pfad, b.webp); erzeugt++; }
    (ergebnis[produktId] ??= {})[farbeId] = ansichten;
  }
}

const sortiert = Object.fromEntries(Object.keys(ergebnis).sort().map((p) => [p, Object.fromEntries(Object.keys(ergebnis[p]!).sort().map((c) => [c, ergebnis[p]![c]!]))]));
const ts =
  `/**\n * AUTO-GENERIERT von scripts/dunkleHintergruende.mts – NICHT von Hand ändern.\n *\n` +
  ` * Produktfarben, deren Fotos als Variante mit dunklem Hintergrund (\`<ansicht>-dunkel.webp\`) vorliegen (helle Ware:\n` +
  ` * Weiß, Creme, Hellgrau, Pastell). Je Farbe die Ansichten mit Variante. Lesen: src/lib/assets (resolveAnzeigeBilder …).\n */\n` +
  `export const DUNKLER_HINTERGRUND: Record<string, Record<string, readonly string[]>> = ${JSON.stringify(sortiert, null, 2)};\n`;
writeFileSync(path.join(process.cwd(), 'src', 'lib', 'assets', 'dunklerHintergrund.generated.ts'), ts);
console.log(`Helle Farben: ${farben} | mit dunklen Varianten: ${Object.values(sortiert).reduce((s, f) => s + Object.keys(f).length, 0)} | neu erzeugt ${erzeugt}, vorhanden ${vorhanden}`);
if (ausgeschlossen.length) console.log(`Ausgelassen (Prüfung nicht bestanden, bleibt weiß):\n  ${ausgeschlossen.join('\n  ')}`);
