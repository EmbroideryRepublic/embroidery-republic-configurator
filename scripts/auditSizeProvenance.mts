/**
 * Interne Gegenprobe der Maßdaten – ohne externe Quelle.
 *
 * Die Körperlänge in Größe M steht im Projekt an ZWEI unabhängig gepflegten
 * Stellen: `sizeGuide.measurements[M].hoeheCm` (Produktdaten) und
 * `REFERENCE_HEIGHT_CM` (printAreas.ts). Beide sollen dasselbe Maß aus
 * derselben Tabelle abbilden. Weichen sie ab, ist mindestens eine der beiden
 * Eintragungen falsch oder stammt aus einer anderen Quelle – ein direkter
 * Hinweis auf uneinheitliche Herkunft.
 *
 * Zusätzlich wird die Schrittweite der Brustbreite je Größe geprüft. Flach
 * gemessene KLEIDUNGSSTÜCKE wachsen typischerweise in gleichmäßigen Schritten
 * (meist 5 cm bei Herren). KÖRPERMAßtabellen wachsen unregelmäßiger, weil sie
 * Konfektionsgrößen abbilden. Das Muster ist damit ein Indiz für die Bedeutung
 * der Werte.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/auditSizeProvenance.mts
 */
import { readFileSync } from 'node:fs';

const { PRODUCTS } = await import('../src/config/products/index.ts');

// REFERENCE_HEIGHT_CM aus printAreas.ts auslesen, ohne die Datei zu ändern.
const quelle = readFileSync('src/config/printAreas.ts', 'utf8');
const block = quelle.slice(
  quelle.indexOf('const REFERENCE_HEIGHT_CM'),
  quelle.indexOf('const DEFAULT_REFERENCE_HEIGHT_CM')
);
const referenz = new Map<string, number>();
for (const m of block.matchAll(/'([a-z0-9-]+)':\s*([\d.]+)/g)) {
  referenz.set(m[1]!, Number(m[2]));
}

console.log('\n═══ GEGENPROBE: hoeheCm (Produktdaten) vs. REFERENCE_HEIGHT_CM ═══\n');
console.log('Produkt                          | sizeGuide M | printAreas | Differenz');
console.log('---------------------------------|-------------|------------|----------');

let abweichend = 0;
let fehlend = 0;
for (const p of PRODUCTS) {
  const m = p.sizeGuide?.measurements?.find((x) => x.size === 'M') ?? p.sizeGuide?.measurements?.[0];
  const ref = referenz.get(p.id);
  if (!m) continue;
  if (ref === undefined) {
    console.log(`${p.id.padEnd(32)} | ${String(m.hoeheCm).padStart(11)} |          — | KEIN EINTRAG`);
    fehlend++;
    continue;
  }
  const diff = Number((ref - m.hoeheCm).toFixed(1));
  if (diff !== 0) {
    console.log(
      `${p.id.padEnd(32)} | ${String(m.hoeheCm).padStart(11)} | ${String(ref).padStart(10)} | ${diff > 0 ? '+' : ''}${diff} cm`
    );
    abweichend++;
  }
}
console.log(`\nAbweichend: ${abweichend} · ohne printAreas-Eintrag: ${fehlend} · geprüft: ${PRODUCTS.length}`);

// ── Schrittweite der Brustbreite ─────────────────────────────────────────
console.log('\n\n═══ SCHRITTWEITE DER BRUSTBREITE JE PRODUKT ═══\n');
console.log('Produkt                          | Schritte (cm)            | gleichmäßig?');
console.log('---------------------------------|--------------------------|-------------');
for (const p of PRODUCTS) {
  const ms = p.sizeGuide?.measurements ?? [];
  if (ms.length < 3) continue;
  const schritte: number[] = [];
  for (let i = 1; i < ms.length; i++) {
    schritte.push(Number((ms[i]!.breiteCm - ms[i - 1]!.breiteCm).toFixed(1)));
  }
  const eindeutig = [...new Set(schritte)];
  const gleich = eindeutig.length === 1;
  console.log(
    `${p.id.padEnd(32)} | ${schritte.join(', ').padEnd(24)} | ${gleich ? `ja (${eindeutig[0]})` : 'NEIN'}`
  );
}
