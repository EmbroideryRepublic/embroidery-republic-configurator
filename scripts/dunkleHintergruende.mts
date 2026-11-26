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
 * Rein weiße Fotos: Hier trägt keine Schwelle (weiß auf weiß). Dafür gibt es optional Modellmasken (ISNet, Apache-2.0,
 * scripts/dunkleHintergruendeMasken.py): erst mit `--maskenliste=<datei>` die Auftragsliste der gescheiterten Farben schreiben, dann das
 * Python-Skript laufen lassen, danach `--masken=<verzeichnis>` angeben.
 *
 * Aufruf:  npx tsx --tsconfig tsconfig.scripts.json scripts/dunkleHintergruende.mts [--neu] [--maskenliste=<datei>] [--masken=<verzeichnis>]
 * Danach: python scripts/personenPruefung.py (neue Bilder prüfen), npm test.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';
// @ts-expect-error – reine JS-Datei ohne Typen
import { dunkel } from './lib/dunklerHintergrund.mjs';

const NEU = process.argv.includes('--neu');
const arg = (name: string): string | undefined => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
/** Verzeichnis mit vorberechneten Modellmasken (ISNet, scripts/dunkleHintergruendeMasken.py): <ordner>__<ansicht>.png */
const MASKEN = arg('masken');
/** Schreibt die Bilder der Farben, bei denen die einfache Freistellung scheitert, als Auftragsliste für das Masken-Skript. */
const MASKENLISTE = arg('maskenliste');
const maskenAuftrag: { png: string; aus: string }[] = [];
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

/** Pfad der vorberechneten Modellmaske zu einem Bild: <ordner>__<ansicht>.png (ohne --masken: im Arbeitsordner `masken`). */
const maskePfad = (webp: string): string => path.join(MASKEN ?? path.join(process.cwd(), 'masken'), webp.replace(/^\/products\//, '').replace(/\//g, '__').replace(/\.webp$/i, '.png'));

const ergebnis: Record<string, Record<string, string[]>> = {};
const ausgeschlossen: string[] = [];
let erzeugt = 0, vorhanden = 0, farben = 0, mitModell = 0;

for (const [produktId, nachFarbe] of Object.entries(ASSET_MANIFEST)) {
  if (ZWEIFARBIG.some((z) => produktId.startsWith(z))) continue;
  for (const [farbeId, eintrag] of Object.entries(nachFarbe)) {
    const front = eintrag.views['front'];
    if (eintrag.status !== 'real' || !front || front.includes('_platzhalter') || !existsSync(pngVon(front))) continue;
    if ((await helligkeit(pngVon(front))) < HELL_AB) continue;
    farben++;
    // Je Farbe: erst die einfache Freistellung (Flutfüllung); gelingt sie bei einer Ansicht nicht, mit Modellmaske (falls vorhanden)
    const versuche = async (mitMaske: boolean) => {
      const ansichten: string[] = [];
      const bilder: { pfad: string; webp: Buffer }[] = [];
      for (const view of ANSICHTEN) {
        const webp = eintrag.views[view];
        if (!webp || webp.includes('_platzhalter') || !existsSync(pngVon(webp))) continue;
        const ziel = dunkelVon(webp);
        if (existsSync(ziel) && !NEU) { ansichten.push(view); vorhanden++; continue; }
        const maske = mitMaske ? maskePfad(webp) : undefined;
        if (mitMaske && !(maske && existsSync(maske))) return { ok: false as const, grund: `${view}: Maske fehlt`, ansichten, bilder };
        const d = await dunkel(pngVon(webp), maske ? { maske } : {});
        const hg = d.anteilHintergrund as number;
        const fb = view === 'front' || view === 'back';
        const grundWerte = `Hintergrund ${(hg * 100).toFixed(0)} %, Rand ${(d.rahmen * 100).toFixed(1)} %, Füllung ${(d.fuellung * 100).toFixed(1)} %, Kasten ${(d.kastenFuellung * 100).toFixed(0)} %, Symmetrie ${(d.symmetrie * 100).toFixed(0)} %`;
        const basis = d.rahmen <= 0.02 && (fb ? hg >= 0.3 && hg <= 0.8 : hg >= 0.35 && hg <= 0.98) && d.kastenFuellung <= (fb ? 0.905 : 0.97);
        // Flutfüllung bei fast weißem Stoff: zusätzlich Füllung/Symmetrie. Modellmaske: keine großen Löcher, Symmetrie nur grob (Polo-Rückseiten mit Etikett).
        const gut = basis && (maske ? d.grosseLoecher === 0 && (!fb || d.symmetrie >= 0.75) : d.kernMin < 240 || (d.fuellung >= 0.995 && d.symmetrie >= 0.85));
        if (!gut) return { ok: false as const, grund: `${view} (${grundWerte}${maske ? `, große Löcher ${d.grosseLoecher}` : ''})`, ansichten, bilder };
        bilder.push({ pfad: ziel, webp: d.webp as Buffer });
        ansichten.push(view);
      }
      return { ok: ansichten.length > 0, grund: '', ansichten, bilder };
    };
    let erg = await versuche(false);
    let mitMaske = false;
    if (!erg.ok && MASKEN) { const zweit = await versuche(true); if (zweit.ok) { erg = zweit; mitMaske = true; } else erg = { ...zweit, grund: `mit Maske: ${zweit.grund}` }; }
    if (!erg.ok) {
      ausgeschlossen.push(`${produktId}/${farbeId}/${erg.grund}`);
      if (MASKENLISTE) for (const view of ANSICHTEN) { const webp = eintrag.views[view]; if (webp && !webp.includes('_platzhalter') && existsSync(pngVon(webp))) maskenAuftrag.push({ png: pngVon(webp), aus: maskePfad(webp) }); }
      continue;
    }
    for (const b of erg.bilder) { mkdirSync(path.dirname(b.pfad), { recursive: true }); writeFileSync(b.pfad, b.webp); erzeugt++; }
    if (mitMaske) mitModell++;
    (ergebnis[produktId] ??= {})[farbeId] = erg.ansichten;
  }
}

if (MASKENLISTE) { writeFileSync(MASKENLISTE, JSON.stringify(maskenAuftrag, null, 1)); console.log(`Auftragsliste für Masken: ${maskenAuftrag.length} Bilder → ${MASKENLISTE}`); }
const sortiert = Object.fromEntries(Object.keys(ergebnis).sort().map((p) => [p, Object.fromEntries(Object.keys(ergebnis[p]!).sort().map((c) => [c, ergebnis[p]![c]!]))]));
const ts =
  `/**\n * AUTO-GENERIERT von scripts/dunkleHintergruende.mts – NICHT von Hand ändern.\n *\n` +
  ` * Produktfarben, deren Fotos als Variante mit dunklem Hintergrund (\`<ansicht>-dunkel.webp\`) vorliegen (helle Ware:\n` +
  ` * Weiß, Creme, Hellgrau, Pastell). Je Farbe die Ansichten mit Variante. Lesen: src/lib/assets (resolveAnzeigeBilder …).\n */\n` +
  `export const DUNKLER_HINTERGRUND: Record<string, Record<string, readonly string[]>> = ${JSON.stringify(sortiert, null, 2)};\n`;
writeFileSync(path.join(process.cwd(), 'src', 'lib', 'assets', 'dunklerHintergrund.generated.ts'), ts);
console.log(`Helle Farben: ${farben} | mit dunklen Varianten: ${Object.values(sortiert).reduce((s, f) => s + Object.keys(f).length, 0)} | neu erzeugt ${erzeugt}, vorhanden ${vorhanden} | davon mit Modellmaske: ${mitModell} Farben`);
if (ausgeschlossen.length) console.log(`Ausgelassen (Prüfung nicht bestanden, bleibt weiß):\n  ${ausgeschlossen.join('\n  ')}`);
