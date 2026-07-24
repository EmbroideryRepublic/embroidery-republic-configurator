/**
 * Flächen-Audit gegen die ECHTE Bildkontur – über den GESAMTEN Bestand.
 *
 * Beantwortet für jede Kombination aus Produkt, Farbe und Ansicht die
 * Fragen, die ein Textilveredler vor dem Druck stellt:
 *
 *   1. Liegt die Druckfläche vollständig auf dem Stoff?
 *   2. Sind die Sicherheitsabstände links und rechts gleich groß?
 *   3. Sitzt die Fläche optisch mittig auf dem Kleidungsstück?
 *
 * Die Antworten stammen NICHT aus den generierten Zahlen, sondern aus dem
 * Produktfoto selbst: `zeilenProfil()` liefert je Bildzeile den linken und
 * rechten Stoffrand, die Druckfläche wird dagegen geprüft. Dadurch fällt
 * auch auf, wenn eine EINZELNE Farbvariante anders freigestellt ist als die
 * Ankerfarbe, aus der die Fläche erzeugt wurde.
 *
 * Das ist die Suchstufe: Sie zeigt, WO hingesehen werden muss. Die
 * Bewertung erfolgt anschließend visuell an den Screenshots aus
 * `scripts/visualQa.mjs`.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/qaContourAudit.mts [--json <datei>]
 */
import { existsSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { PRODUCTS } from '../src/config/products/index';
import { PRINT_AREA_DATA } from '../src/config/printAreaData.generated';
import { zeilenProfil } from './analyzeGarmentContour.mjs';
import type { PrintView } from '../src/types';

const VIEWS: PrintView[] = ['front', 'back', 'sleeve_left', 'sleeve_right'];
const PUBLIC = path.resolve('public');

/** Ab wann eine Abweichung berichtet wird (in % der Bildbreite). */
const SCHWELLE_UEBERLAUF = 0.0; // jeder Überlauf ist ein Fehler
const SCHWELLE_ASYMMETRIE = 2.0; // ab 2 Prozentpunkten Differenz auffällig

export interface Befund {
  produkt: string;
  marke: string;
  typ: string;
  farbe: string;
  ansicht: PrintView;
  bild: string;
  /** Größter seitlicher Überlauf über den Stoffrand, in % der Bildbreite. */
  ueberlaufPct: number;
  /** Überlauf nach oben/unten über die Kontur, in % der Bildhöhe. */
  ueberlaufObenPct: number;
  ueberlaufUntenPct: number;
  /** Mittlerer Abstand Flächenkante -> Stoffkante, in % der Bildbreite. */
  randLinksPct: number;
  randRechtsPct: number;
  /** |links - rechts| */
  asymmetriePct: number;
  /** Versatz Flächenmitte gegenüber Stoffmitte, in % der Bildbreite. */
  mittenversatzPct: number;
}

/** Engere Toleranz als die Voreinstellung – sonst gilt weißer Stoff auf
 *  weißem Grund als Hintergrund und die Kontur zerfällt (siehe
 *  analyzeGarmentContour.mjs). */
const QA_TOLERANZ = 6;

const profilCache = new Map<string, Awaited<ReturnType<typeof zeilenProfil>>>();
async function profilVon(bildPfad: string) {
  const cached = profilCache.get(bildPfad);
  if (cached) return cached;
  const p = await zeilenProfil(bildPfad, QA_TOLERANZ);
  profilCache.set(bildPfad, p);
  return p;
}

export async function pruefeKombination(
  produktId: string,
  marke: string,
  typ: string,
  farbeName: string,
  view: PrintView,
  bildUrl: string
): Promise<Befund | null> {
  const bildPfad = path.join(PUBLIC, bildUrl.replace(/^\//, ''));
  if (!existsSync(bildPfad)) return null;

  const flaeche = PRINT_AREA_DATA[produktId]?.[view];
  if (!flaeche) return null;

  const { w, h, zeilen } = await profilVon(bildPfad);

  // Druckfläche in Bildpixel umrechnen (Prozentwerte sind relativ zum
  // GESAMTEN Bild – siehe computeAreaPx in lib/canvas/containRect.ts).
  const ax0 = (flaeche.x0 / 100) * w;
  const ax1 = (flaeche.x1 / 100) * w;
  const ay0 = (flaeche.y0 / 100) * h;
  const ay1 = (flaeche.y1 / 100) * h;

  const yStart = Math.max(0, Math.round(ay0));
  const yEnd = Math.min(h - 1, Math.round(ay1));

  let maxUeberlauf = 0;
  let summeLinks = 0;
  let summeRechts = 0;
  let summeMitte = 0;
  let gezaehlt = 0;

  for (let y = yStart; y <= yEnd; y++) {
    const z = zeilen[y];
    if (!z || z.breite === 0) continue;

    const randL = ax0 - z.links; // >0 = Fläche liegt innerhalb
    const randR = z.rechts - ax1;
    maxUeberlauf = Math.max(maxUeberlauf, -randL, -randR);

    summeLinks += randL;
    summeRechts += randR;
    summeMitte += (ax0 + ax1) / 2 - (z.links + z.rechts) / 2;
    gezaehlt++;
  }

  if (gezaehlt === 0) {
    return {
      produkt: produktId, marke, typ, farbe: farbeName, ansicht: view, bild: bildUrl,
      ueberlaufPct: 100, ueberlaufObenPct: 0, ueberlaufUntenPct: 0,
      randLinksPct: 0, randRechtsPct: 0, asymmetriePct: 0, mittenversatzPct: 0,
    };
  }

  // Vertikaler Überlauf: Kontur-Ober-/Unterkante gegen Flächenkanten.
  const belegt = zeilen.filter((z) => z.breite > 0);
  const konturOben = belegt[0]?.y ?? 0;
  const konturUnten = belegt[belegt.length - 1]?.y ?? h - 1;

  const randLinksPct = (summeLinks / gezaehlt / w) * 100;
  const randRechtsPct = (summeRechts / gezaehlt / w) * 100;

  return {
    produkt: produktId,
    marke,
    typ,
    farbe: farbeName,
    ansicht: view,
    bild: bildUrl,
    ueberlaufPct: +((maxUeberlauf / w) * 100).toFixed(2),
    ueberlaufObenPct: +(((konturOben - ay0) / h) * 100).toFixed(2),
    ueberlaufUntenPct: +(((ay1 - konturUnten) / h) * 100).toFixed(2),
    randLinksPct: +randLinksPct.toFixed(2),
    randRechtsPct: +randRechtsPct.toFixed(2),
    asymmetriePct: +Math.abs(randLinksPct - randRechtsPct).toFixed(2),
    mittenversatzPct: +((summeMitte / gezaehlt / w) * 100).toFixed(2),
  };
}

async function main() {
  const befunde: Befund[] = [];
  let geprueft = 0;
  let fehlendeBilder = 0;

  for (const p of PRODUCTS) {
    const views = (p.hasSleeves ?? true) ? VIEWS : VIEWS.filter((v) => !v.startsWith('sleeve'));
    for (const color of p.colors) {
      for (const view of views) {
        const url = color.images[view];
        if (!url) { fehlendeBilder++; continue; }
        const b = await pruefeKombination(p.id, p.brand, p.productType, color.name, view, url);
        if (!b) { fehlendeBilder++; continue; }
        befunde.push(b);
        geprueft++;
      }
    }
    process.stderr.write(`\r  geprüft: ${geprueft}   `);
  }
  process.stderr.write('\n');

  const ueberlauf = befunde.filter((b) => b.ueberlaufPct > SCHWELLE_UEBERLAUF);
  const asym = befunde.filter((b) => b.asymmetriePct > SCHWELLE_ASYMMETRIE);
  const obenRaus = befunde.filter((b) => b.ueberlaufObenPct > 0.2);
  const untenRaus = befunde.filter((b) => b.ueberlaufUntenPct > 0.2);

  console.log(`\n=== FLÄCHEN-AUDIT GEGEN BILDKONTUR ===`);
  console.log(`geprüfte Kombinationen : ${geprueft}`);
  console.log(`ohne Bild/Fläche       : ${fehlendeBilder}`);
  console.log(`seitlicher Überlauf    : ${ueberlauf.length}`);
  console.log(`über Konturoberkante   : ${obenRaus.length}`);
  console.log(`unter Konturunterkante : ${untenRaus.length}`);
  console.log(`Asymmetrie > ${SCHWELLE_ASYMMETRIE} Pp      : ${asym.length}`);

  const zeige = (titel: string, liste: Befund[], key: keyof Befund, n = 25) => {
    if (liste.length === 0) return;
    console.log(`\n--- ${titel} (Top ${Math.min(n, liste.length)} von ${liste.length}) ---`);
    console.table(
      [...liste]
        .sort((a, b) => Math.abs(Number(b[key])) - Math.abs(Number(a[key])))
        .slice(0, n)
        .map((b) => ({
          produkt: b.produkt,
          ansicht: b.ansicht,
          farbe: b.farbe,
          ueberlauf: b.ueberlaufPct,
          oben: b.ueberlaufObenPct,
          unten: b.ueberlaufUntenPct,
          links: b.randLinksPct,
          rechts: b.randRechtsPct,
          asym: b.asymmetriePct,
          versatz: b.mittenversatzPct,
        }))
    );
  };

  zeige('SEITLICHER ÜBERLAUF (Fläche ragt über den Stoff)', ueberlauf, 'ueberlaufPct');
  zeige('ÜBER DER KONTUROBERKANTE', obenRaus, 'ueberlaufObenPct');
  zeige('UNTER DER KONTURUNTERKANTE', untenRaus, 'ueberlaufUntenPct');
  zeige('ASYMMETRISCHE SEITENABSTÄNDE', asym, 'asymmetriePct');

  // Produkt-/Ansichtsebene: wo ist es systematisch, wo einzelne Farbe?
  const proProduktAnsicht = new Map<string, Befund[]>();
  for (const b of befunde) {
    const k = `${b.produkt}|${b.ansicht}`;
    if (!proProduktAnsicht.has(k)) proProduktAnsicht.set(k, []);
    proProduktAnsicht.get(k)!.push(b);
  }

  const systematisch: { schluessel: string; farben: number; maxAsym: number; maxUeberlauf: number; versatz: number }[] = [];
  for (const [k, liste] of proProduktAnsicht) {
    systematisch.push({
      schluessel: k,
      farben: liste.length,
      maxAsym: Math.max(...liste.map((b) => b.asymmetriePct)),
      maxUeberlauf: Math.max(...liste.map((b) => b.ueberlaufPct)),
      versatz: +(liste.reduce((s, b) => s + b.mittenversatzPct, 0) / liste.length).toFixed(2),
    });
  }

  console.log(`\n--- GRÖSSTER MITTENVERSATZ je Produkt+Ansicht (Top 25) ---`);
  console.table(
    systematisch.sort((a, b) => Math.abs(b.versatz) - Math.abs(a.versatz)).slice(0, 25)
  );

  const jsonIdx = process.argv.indexOf('--json');
  if (jsonIdx !== -1 && process.argv[jsonIdx + 1]) {
    writeFileSync(process.argv[jsonIdx + 1]!, JSON.stringify(befunde, null, 2));
    console.log(`\nRohdaten geschrieben: ${process.argv[jsonIdx + 1]}`);
  }
}

if (process.argv[1]?.endsWith('qaContourAudit.mts')) {
  await main();
}
