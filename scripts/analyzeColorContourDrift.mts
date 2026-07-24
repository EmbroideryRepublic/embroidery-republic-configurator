/**
 * Analyse der Konturabweichung zwischen Farbvarianten desselben Produkts.
 *
 * Anlass: Beim schwarzen Heavy T ragte die Druckfläche über die linke
 * Stoffkante hinaus, beim weißen desselben Produkts saß sie korrekt. Die
 * Flächen werden aus EINEM Bild je Produkt berechnet und auf alle Farben
 * angewendet — die Annahme, alle Varianten hätten dieselbe Silhouette an
 * derselben Bildposition, ist offenbar falsch.
 *
 * Diese Analyse klärt das Ausmaß, BEVOR über die Lösung entschieden wird.
 *
 * ── Die entscheidende Unterscheidung ──────────────────────────────────
 * VERSCHIEBUNG (Mitte wandert, Breite bleibt) → ein Offset je Farbe genügt.
 * FORMÄNDERUNG (Breite ändert sich)           → Flächen müssen je Farbe
 *                                                neu berechnet werden.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/analyzeColorContourDrift.mts
 */
import { existsSync } from 'node:fs';
import { zeilenProfil } from './analyzeGarmentContour.mjs';

const { PRODUCTS } = await import('../src/config/products/index.ts');
const { PRINT_AREA_DATA } = await import('../src/config/printAreaData.generated.ts');

interface Messung {
  produkt: string;
  marke: string;
  farbe: string;
  links: number;
  rechts: number;
  mitte: number;
  breite: number;
}

interface Auswertung extends Messung {
  istReferenz: boolean;
  mitteVersatz: number;
  breiteDifferenz: number;
  abstandLinks: number;
  abstandRechts: number;
  ueberstand: number;
}

/** Torsokante im unteren Drittel – dort ist die Silhouette eindeutig. */
async function miss(pfad: string): Promise<{ links: number; rechts: number } | null> {
  const { w, zeilen } = await zeilenProfil(pfad);
  const belegt = zeilen.filter((z) => z.breite > 0);
  if (belegt.length < 20) return null;
  const yOben = belegt[0]!.y;
  const yUnten = belegt[belegt.length - 1]!.y;
  const von = yOben + Math.round((yUnten - yOben) * 0.6);
  const bis = yUnten - 10;
  const torso = zeilen.slice(von, bis).filter((z) => z.breite > 0);
  if (torso.length === 0) return null;
  return {
    links: (torso.reduce((s, z) => s + z.links, 0) / torso.length / w) * 100,
    rechts: (torso.reduce((s, z) => s + z.rechts, 0) / torso.length / w) * 100,
  };
}

function pfadFuer(url: string | undefined): string | null {
  if (!url) return null;
  const basis = `public${url}`.replace(/\.(webp|png)$/, '');
  if (existsSync(`${basis}.png`)) return `${basis}.png`;
  if (existsSync(`${basis}.webp`)) return `${basis}.webp`;
  return null;
}

const alle: Auswertung[] = [];

for (const p of PRODUCTS) {
  const flaeche = PRINT_AREA_DATA[p.id]?.front;
  if (!flaeche) continue;

  const messungen: Messung[] = [];
  for (const c of p.colors) {
    const pfad = pfadFuer(c.images.front);
    if (!pfad) continue;
    const m = await miss(pfad);
    if (!m) continue;
    messungen.push({
      produkt: p.id,
      marke: String(p.brand),
      farbe: c.id,
      links: m.links,
      rechts: m.rechts,
      mitte: (m.links + m.rechts) / 2,
      breite: m.rechts - m.links,
    });
  }
  if (messungen.length === 0) continue;

  // Referenz ist die Farbe, aus der die Fläche erzeugt wurde: die erste mit Bild.
  const referenz = messungen[0]!;

  for (const m of messungen) {
    const abstandLinks = flaeche.x0 - m.links;
    const abstandRechts = m.rechts - flaeche.x1;
    alle.push({
      ...m,
      istReferenz: m.farbe === referenz.farbe,
      mitteVersatz: m.mitte - referenz.mitte,
      breiteDifferenz: m.breite - referenz.breite,
      abstandLinks,
      abstandRechts,
      ueberstand: Math.min(0, abstandLinks, abstandRechts),
    });
  }
}

// ── Auswertung ───────────────────────────────────────────────────────────
const mitUeberstand = alle.filter((a) => a.ueberstand < 0);
const produkteMitUeberstand = new Set(mitUeberstand.map((a) => a.produkt));
const nichtReferenz = alle.filter((a) => !a.istReferenz);
const versatzWerte = nichtReferenz.map((a) => Math.abs(a.mitteVersatz));
const breitenWerte = nichtReferenz.map((a) => Math.abs(a.breiteDifferenz));
const mw = (x: number[]) => (x.length ? x.reduce((s, v) => s + v, 0) / x.length : 0);
const max = (x: number[]) => (x.length ? Math.max(...x) : 0);

console.log('═══ KONTURABWEICHUNG ZWISCHEN FARBVARIANTEN ═══\n');
console.log(`Produkte geprüft        : ${new Set(alle.map((a) => a.produkt)).size}`);
console.log(`Farbvarianten geprüft   : ${alle.length}`);
console.log(`davon Nicht-Referenz    : ${nichtReferenz.length}\n`);

console.log('── Verschiebung der Stoffmitte gegenüber der Referenzfarbe ──');
console.log(`  Mittelwert : ${mw(versatzWerte).toFixed(2)} Prozentpunkte`);
console.log(`  Maximum    : ${max(versatzWerte).toFixed(2)} Prozentpunkte`);
console.log(`  > 1 pp     : ${versatzWerte.filter((v) => v > 1).length} Varianten`);
console.log(`  > 2 pp     : ${versatzWerte.filter((v) => v > 2).length} Varianten\n`);

console.log('── Breitenunterschied gegenüber der Referenzfarbe ──');
console.log(`  Mittelwert : ${mw(breitenWerte).toFixed(2)} Prozentpunkte`);
console.log(`  Maximum    : ${max(breitenWerte).toFixed(2)} Prozentpunkte`);
console.log(`  > 1 pp     : ${breitenWerte.filter((v) => v > 1).length} Varianten`);
console.log(`  > 2 pp     : ${breitenWerte.filter((v) => v > 2).length} Varianten\n`);

console.log('── Überstand über die Stoffkante (der eigentliche Fehler) ──');
console.log(`  Betroffene Farbvarianten : ${mitUeberstand.length} von ${alle.length}`);
console.log(`  Betroffene Produkte      : ${produkteMitUeberstand.size}`);
console.log(`  Größter Überstand        : ${Math.abs(Math.min(0, ...alle.map((a) => a.ueberstand))).toFixed(2)} pp\n`);

console.log('── Je Marke ──');
const marken = new Map<string, Auswertung[]>();
for (const a of alle) marken.set(a.marke, [...(marken.get(a.marke) ?? []), a]);
for (const [marke, as] of [...marken.entries()].sort()) {
  const betroffen = as.filter((a) => a.ueberstand < 0).length;
  const versatz = as.filter((a) => !a.istReferenz).map((a) => Math.abs(a.mitteVersatz));
  console.log(
    `  ${marke.padEnd(18)} ${String(as.length).padStart(3)} Varianten · ${String(betroffen).padStart(3)} mit Überstand · Ø Versatz ${mw(versatz).toFixed(2)} pp · max ${max(versatz).toFixed(2)} pp`
  );
}

console.log('\n── Schlimmste 15 Varianten ──');
for (const a of [...alle].sort((x, y) => x.ueberstand - y.ueberstand).slice(0, 15)) {
  console.log(
    `  ${a.produkt.padEnd(30)} ${a.farbe.padEnd(16)} Versatz ${a.mitteVersatz >= 0 ? '+' : ''}${a.mitteVersatz.toFixed(1)} pp · Breite ${a.breiteDifferenz >= 0 ? '+' : ''}${a.breiteDifferenz.toFixed(1)} pp · Abstand L ${a.abstandLinks.toFixed(1)} R ${a.abstandRechts.toFixed(1)}`
  );
}
