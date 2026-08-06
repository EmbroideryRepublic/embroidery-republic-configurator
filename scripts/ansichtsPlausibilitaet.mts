/**
 * Zeigt jede Ansicht wirklich das, was ihr Name behauptet?
 *
 * Der Ansichten-Audit prüft, ob eine eigene Datei hinterlegt ist. Er kann aber
 * nicht sehen, ob im Front-Slot eine SEITENANSICHT liegt. Genau das ist beim
 * Fruit-of-the-Loom Ladies Iconic 195 in „Navy" passiert: dort lag ein
 * türkisfarbenes Shirt im Profil – falsche Ansicht und falsche Farbe zugleich.
 *
 * Verfahren: Innerhalb EINES Produkts sind alle Farben dasselbe Kleidungsstück
 * in derselben Pose. Die Breite des Kleidungsstücks (Anteil der Bildbreite) ist
 * damit über die Farben nahezu konstant. Eine Seitenansicht ist rund halb so
 * breit wie eine Vorderansicht – sie fällt sofort aus der Reihe. Verglichen wird
 * gegen den MEDIAN des Produkts, nicht gegen einen festen Wert: Ein schmales
 * Damenshirt und ein weiter Hoodie haben verschiedene Absolutwerte, aber jeweils
 * eine enge Streuung.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/ansichtsPlausibilitaet.mts [--abweichung 0.25]
 *
 * Exit 1, wenn eine Ansicht auffällt.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { zeilenProfil } from './analyzeGarmentContour.mjs';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';
import { waehlbareFarben } from '../src/lib/products/farben.ts';

const i = process.argv.indexOf('--abweichung');
const SCHWELLE = Number(i > -1 ? process.argv[i + 1] : undefined) || 0.25;

const befunde: { produkt: string; farbe: string; ansicht: string; breite: number; median: number }[] = [];
let geprueft = 0;

for (const p of PRODUCTS) {
  const farben = waehlbareFarben(p.id, p.colors);
  for (const view of ['front', 'back'] as const) {
    const messungen: { farbe: string; breite: number }[] = [];
    for (const c of farben) {
      const pfad = ASSET_MANIFEST[p.id]?.[c.id]?.views?.[view];
      if (!pfad || pfad.includes('_platzhalter')) continue;
      const f = join(process.cwd(), 'public', pfad.replace(/^\//, '').replace(/\.webp$/i, '.png'));
      if (!existsSync(f)) continue;
      const prof = await zeilenProfil(f);
      const bel = prof.zeilen.filter((z) => z.breite > 0);
      if (!bel.length) continue;
      geprueft++;
      // Maximale Breite = Schulter-/Brustlinie. Robuster als ein Mittelwert,
      // weil Saumwellen und Faltenwurf sie kaum verschieben.
      messungen.push({ farbe: c.id, breite: Math.max(...bel.map((z) => z.breite)) / prof.w });
    }
    if (messungen.length < 3) continue;
    const sortiert = [...messungen].sort((a, b) => a.breite - b.breite);
    const median = sortiert[Math.floor(sortiert.length / 2)]!.breite;
    for (const m of messungen) {
      if (Math.abs(m.breite - median) / median > SCHWELLE) {
        befunde.push({ produkt: p.id, farbe: m.farbe, ansicht: view, breite: m.breite, median });
      }
    }
  }
}

befunde.sort((a, b) => Math.abs(b.breite - b.median) / b.median - Math.abs(a.breite - a.median) / a.median);
console.log(
  `${geprueft} Ansichten geprueft · ${befunde.length} fallen aus der Reihe (> ${(SCHWELLE * 100).toFixed(0)} % Abweichung vom Produkt-Median)\n`
);
for (const b of befunde) {
  const abw = ((b.breite - b.median) / b.median) * 100;
  console.log(
    `  ${abw > 0 ? '+' : ''}${abw.toFixed(0).padStart(4)} %  ${b.produkt} / ${b.farbe} / ${b.ansicht}` +
      `   (${(b.breite * 100).toFixed(1)} % statt ${(b.median * 100).toFixed(1)} % Bildbreite)`
  );
}
if (befunde.length) process.exit(1);
