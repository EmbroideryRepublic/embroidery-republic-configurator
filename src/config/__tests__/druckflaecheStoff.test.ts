/**
 * Die Druckfläche liegt bei JEDER wählbaren Farbe auf Stoff (Befund vom 2026-11-11).
 *
 * `scripts/druckflaechePruefung.mts` misst das für den ganzen Katalog, meldet aber noch Altfälle von 1–3,4 % (helle
 * Melange-Farben) und kann deshalb nicht als harte Schranke laufen. Dieser Test hält die Produkte fest, bei denen der
 * Überstand ein echter Fehler war und behoben wurde, und misst GENAU wie das Skript (dieselbe Konturerkennung, dasselbe
 * Perzentil, derselbe Saumabzug).
 *
 * earthpositive-unisex-organic-pullover-hood-ep: Die Farben stammen aus zwei Aufnahmen – Schwarz/Bordeaux/Navy mit breiten
 * Schultern, Salbeigrün/Blau/Weiß mit hochstehender Kapuze. Die Fläche war auf der Schwarz-Aufnahme abgelesen und ragte
 * bei den anderen Farben bis zu 12,2 % der Bildbreite in den Hintergrund (in Höhe von 29–36 % ist der Stoff dort nur
 * ein Viertel der Bildbreite breit: Kapuze und Hals). Seit y0 = 36 liegt sie in jeder Farbe auf dem Rumpf.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PRINT_AREA_DATA } from '../printAreaData';
import { ASSET_MANIFEST } from '@/lib/assets/assetManifest.generated';
import { PRODUCTS } from '../products';
import { waehlbareFarben } from '@/lib/products/farben';

/** Produkte, bei denen ein Überstand behoben wurde – hier darf er nie wiederkommen. */
const BEHOBEN = ['earthpositive-unisex-organic-pullover-hood-ep'] as const;
const TOLERANZ_PROZENT = 1.0;

async function ueberstaende(productId: string, ansicht: 'front' | 'back') {
  // Dynamisch: das Skript hat am Ende eine Top-Level-await-Kommandozeile, die sich nicht statisch (cjs) einbinden lässt.
  // @ts-expect-error – Node-Skript ohne Typdeklaration; der Rückgabetyp wird unten zugesichert.
  const { zeilenProfil } = (await import('../../../scripts/analyzeGarmentContour.mjs')) as {
    zeilenProfil: (pfad: string) => Promise<{ w: number; h: number; zeilen: { y: number; links: number; rechts: number; breite: number }[] }>;
  };
  const produkt = PRODUCTS.find((p) => p.id === productId);
  assert.ok(produkt, `${productId} fehlt im Katalog`);
  const a = PRINT_AREA_DATA[productId]?.[ansicht];
  assert.ok(a, `${productId}: keine Druckfläche für ${ansicht}`);
  const befunde: string[] = [];
  let geprueft = 0;
  for (const c of waehlbareFarben(productId, produkt.colors)) {
    const pfad = ASSET_MANIFEST[productId]?.[c.id]?.views?.[ansicht];
    if (!pfad || pfad.includes('_platzhalter')) continue;
    const datei = join(process.cwd(), 'public', pfad.replace(/^\//, '').replace(/\.webp$/i, '.png'));
    if (!existsSync(datei)) continue;
    const prof = await zeilenProfil(datei);
    geprueft++;
    const y0 = Math.round((a.y0 / 100) * prof.h);
    const y1 = Math.round((a.y1 / 100) * prof.h);
    const bel = prof.zeilen.filter((z: { breite: number }) => z.breite > 0);
    const saumAb = bel.length ? bel[bel.length - 1]!.y - Math.round(prof.h * 0.03) : Infinity;
    const werte: { l: number; r: number }[] = [];
    for (let y = y0; y < Math.min(y1, saumAb); y++) {
      const z = prof.zeilen[y];
      if (!z || z.breite === 0) continue;
      werte.push({ l: z.links, r: z.rechts });
    }
    if (werte.length <= 20) continue;
    const links = [...werte].sort((x, y) => x.l - y.l);
    const rechts = [...werte].sort((x, y) => x.r - y.r);
    const engL = links[Math.floor(links.length * 0.98)]!.l;
    const engR = rechts[Math.floor(rechts.length * 0.02)]!.r;
    const ueberL = ((engL - (a.x0 / 100) * prof.w) / prof.w) * 100;
    const ueberR = (((a.x1 / 100) * prof.w - engR) / prof.w) * 100;
    if (ueberL > TOLERANZ_PROZENT) befunde.push(`${c.id}: links ${ueberL.toFixed(1)} %`);
    if (ueberR > TOLERANZ_PROZENT) befunde.push(`${c.id}: rechts ${ueberR.toFixed(1)} %`);
  }
  return { geprueft, befunde };
}

for (const id of BEHOBEN) {
  for (const ansicht of ['front', 'back'] as const) {
    test(`${id}: Druckfläche (${ansicht}) ragt bei keiner Farbe über die Stoffkante`, async () => {
      const { geprueft, befunde } = await ueberstaende(id, ansicht);
      assert.ok(geprueft >= 4, `zu wenige Farben gemessen (${geprueft}) – der Test würde sonst nichts prüfen`);
      assert.deepEqual(befunde, [], `Überstand über ${TOLERANZ_PROZENT} % der Bildbreite: ${befunde.join('; ')}`);
    });
  }
}

test('Der Test erkennt einen Überstand (Gegenprobe mit der alten Fläche)', async () => {
  const id = BEHOBEN[0];
  const echt = PRINT_AREA_DATA[id]!.front!;
  const alt = { ...echt, y0: 29 };
  (PRINT_AREA_DATA[id] as Record<string, unknown>).front = alt;
  try {
    const { befunde } = await ueberstaende(id, 'front');
    assert.ok(befunde.length > 0, 'mit der alten Oberkante (29 %) muss der Überstand gemessen werden');
  } finally {
    (PRINT_AREA_DATA[id] as Record<string, unknown>).front = echt;
  }
});
