/**
 * Herleitung der Ärmelgeometrie aus bereits verifizierten Daten.
 *
 * ── Warum das ohne Herstellermaße geht ────────────────────────────────
 * Kein Hersteller im Bestand veröffentlicht Ärmellänge, Schulterbreite oder
 * Oberarmweite. Diese Größen sind aber in der FRONTANSICHT sichtbar und dort
 * messbar, weil der Ärmel bei einem getragen fotografierten Kleidungsstück
 * seitlich absteht. Die Bildkontur liefert seine Ausdehnung, die verifizierte
 * Körperlänge liefert den Maßstab.
 *
 * ── Die vier Bezugspunkte ─────────────────────────────────────────────
 *   SCHULTER  – erste Zeile, in der die Silhouette die Schulterbreite
 *               erreicht (Breitenzuwachs bricht ein). Oberkante des Ärmels.
 *   ACHSEL    – Zeile des stärksten Breitenrückgangs. Unterkante des Ärmels,
 *               zugleich Ansatz der Seitennaht. Bereits validiert.
 *   TORSOKANTE– Median der Rumpfkante unterhalb der Achsel. Innenkante des
 *               Ärmels.
 *   AUSSENKANTE – Silhouettenrand auf Ärmelhöhe. Außenkante des Ärmels.
 *
 * Zwischen Torso- und Außenkante liegt der Ärmel; zwischen Schulter und
 * Achsel seine Länge. Beides in Pixeln messbar, über px/cm (aus der
 * verifizierten Körperlänge) in Zentimeter überführbar.
 *
 * ── Warum das belastbar ist ───────────────────────────────────────────
 * Es fließt KEIN geschätzter Wert ein. Maßstab = verifizierte Körperlänge.
 * Geometrie = gemessene Bildkontur. Beide Größen sind unabhängig voneinander
 * belegt. Das Ergebnis ist reproduzierbar: gleiches Bild, gleiche Zahlen.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/deriveSleeveGeometry.mts
 */
import { readdirSync, existsSync } from 'node:fs';
import { zeilenProfil } from './analyzeGarmentContour.mjs';


const { PRODUCTS } = await import('../src/config/products/index.ts');

function frontBild(productId: string): string | null {
  for (const d of readdirSync('public/products').filter((x) => x === productId || x.startsWith(`${productId}-`))) {
    for (const e of ['png', 'webp']) {
      const p = `public/products/${d}/front.${e}`;
      if (existsSync(p)) return p;
    }
  }
  return null;
}

function median(w: number[]): number {
  const s = [...w].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

interface Ergebnis {
  id: string;
  typ: string;
  ok: boolean;
  grund?: string;
  aermelLaengeCm?: number;
  aermelBreiteCm?: number;
  schulterBreiteCm?: number;
  pxProCm?: number;
}

const ergebnisse: Ergebnis[] = [];

for (const p of PRODUCTS) {
  const bild = frontBild(p.id);
  const mass = p.sizeGuide?.measurements?.find((x) => x.size === 'M') ?? p.sizeGuide?.measurements?.[0];
  if (!bild || !mass) {
    ergebnisse.push({ id: p.id, typ: p.productType, ok: false, grund: 'kein Bild/Maß' });
    continue;
  }

  const { zeilen } = await zeilenProfil(bild);
  const belegt = zeilen.filter((z) => z.breite > 0);
  const yOben = belegt[0]!.y;
  const yUnten = belegt[belegt.length - 1]!.y;
  const hoehePx = yUnten - yOben + 1;
  const pxProCm = hoehePx / mass.hoeheCm;

  // ── Achselerkennung über den Breitenrückgang ─────────────────────────
  // VERWORFENE ALTERNATIVE: Erkennung über die Krümmung des Breitenprofils
  // (lib/contourFeatures.mjs, findeAermelansatz). Idee war, den Übergang
  // „wird breiter" → „Plateau" zu finden, der auch bei anliegenden Ärmeln
  // existiert. Gemessenes Ergebnis: für Hoodies/Zip-Hoodies landete der
  // erkannte Punkt am Kapuzenansatz statt an der Achsel und lieferte
  // NEGATIVE Ärmelbreiten (−5,6 bis −10,2 cm); für T-Shirts sank die Breite
  // von 10,9 auf 8,6 cm und entfernte sich damit von der unabhängig
  // bestätigten Größenordnung. Die Methode ist nachweislich schlechter und
  // wird nicht verwendet. Das Modul bleibt für Nachvollziehbarkeit liegen.
  let yMax = yOben;
  let maxBreite = 0;
  const obenBis = yOben + Math.round(hoehePx * 0.6);
  for (let y = yOben; y <= obenBis; y++) {
    if (zeilen[y]!.breite > maxBreite) {
      maxBreite = zeilen[y]!.breite;
      yMax = y;
    }
  }

  // Suche endet bei 65 % Höhe – sonst gewinnt die Saumkante (Torso → 0).
  const suchEnde = yOben + Math.round(hoehePx * 0.65);
  const fenster = Math.max(3, Math.round(hoehePx * 0.02));
  let besterAbfall = 0;
  let yAchsel: number | null = null;
  for (let y = yMax; y + fenster <= suchEnde; y++) {
    const abfall = zeilen[y]!.breite - zeilen[y + fenster]!.breite;
    if (abfall > besterAbfall) {
      besterAbfall = abfall;
      yAchsel = y + fenster;
    }
  }
  if (yAchsel === null || besterAbfall < maxBreite * 0.15) {
    ergebnisse.push({ id: p.id, typ: p.productType, ok: false, grund: 'Achsel nicht erkennbar' });
    continue;
  }

  let ySchulter = yOben;
  for (let y = yOben; y <= yMax; y++) {
    if (zeilen[y]!.breite >= maxBreite * 0.85) {
      ySchulter = y;
      break;
    }
  }

  // Torsokante unterhalb der Achsel = Innenkante des Ärmels.
  const torso = zeilen.slice(yAchsel, yUnten - Math.round(hoehePx * 0.05)).filter((z) => z.breite > 0);
  const torsoLinks = median(torso.map((z) => z.links));
  const torsoRechts = median(torso.map((z) => z.rechts));

  // Außenkante auf Ärmelhöhe (Mitte zwischen Schulter und Achsel).
  const yMitte = Math.round((ySchulter + yAchsel) / 2);
  const aussenLinks = zeilen[yMitte]!.links;
  const aussenRechts = zeilen[yMitte]!.rechts;

  // Ärmelbreite = horizontaler Streifen zwischen Torso- und Außenkante,
  // beide Seiten gemittelt (der Schnitt ist symmetrisch).
  const aermelBreitePx = ((torsoLinks - aussenLinks) + (aussenRechts - torsoRechts)) / 2;
  const aermelLaengePx = yAchsel - ySchulter;
  const schulterPx = torsoRechts - torsoLinks;

  ergebnisse.push({
    id: p.id,
    typ: p.productType,
    ok: true,
    aermelLaengeCm: Number((aermelLaengePx / pxProCm).toFixed(1)),
    aermelBreiteCm: Number((aermelBreitePx / pxProCm).toFixed(1)),
    schulterBreiteCm: Number((schulterPx / pxProCm).toFixed(1)),
    pxProCm: Number(pxProCm.toFixed(2)),
  });
}

console.log('\n═══ ÄRMELGEOMETRIE AUS FRONTANSICHT ═══\n');
console.log('Produkt                          | Typ     | Ärmel L | Ärmel B | Schulter');
console.log('---------------------------------|---------|---------|---------|---------');
for (const r of ergebnisse.filter((x) => x.ok).sort((a, b) => a.typ.localeCompare(b.typ) || a.id.localeCompare(b.id))) {
  console.log(
    `${r.id.padEnd(32)} | ${r.typ.slice(0, 7).padEnd(7)} | ${String(r.aermelLaengeCm).padStart(7)} | ${String(r.aermelBreiteCm).padStart(7)} | ${String(r.schulterBreiteCm).padStart(8)}`
  );
}

console.log('\nSTREUUNG JE PRODUKTGRUPPE (zeigt, ob ein Gruppenmodell trägt):');
const proTyp = new Map<string, Ergebnis[]>();
for (const r of ergebnisse.filter((x) => x.ok)) proTyp.set(r.typ, [...(proTyp.get(r.typ) ?? []), r]);
for (const [typ, rs] of [...proTyp.entries()].sort()) {
  const l = rs.map((x) => x.aermelLaengeCm!);
  const b = rs.map((x) => x.aermelBreiteCm!);
  const mw = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const sd = (a: number[]) => Math.sqrt(a.reduce((s, v) => s + (v - mw(a)) ** 2, 0) / a.length);
  console.log(
    `  ${typ.padEnd(12)} n=${String(rs.length).padStart(2)}  Länge ${mw(l).toFixed(1)} ± ${sd(l).toFixed(1)} cm   Breite ${mw(b).toFixed(1)} ± ${sd(b).toFixed(1)} cm`
  );
}

const fehl = ergebnisse.filter((x) => !x.ok);
console.log(`\nNICHT ABLEITBAR: ${fehl.length}`);
for (const r of fehl) console.log(`  ${r.id.padEnd(32)} | ${r.typ.padEnd(11)} | ${r.grund}`);
