/**
 * Ansichten-Audit: prüft Produkt für Produkt und Bild für Bild, dass jede
 * Ansicht logisch korrekt belegt ist.
 *
 * Hintergrund: Der Manifest-Generator hat früher JEDE fehlende Ansicht auf das
 * Vorderbild aliased. Dadurch zeigten „Rückseite", „Ärmel links" und „Ärmel
 * rechts" schlicht dasselbe Frontfoto – im Konfigurator klar sichtbar falsch.
 *
 * Geprüfte Regeln je Farbe mit echten Fotos:
 *   1. `front` ist ein echtes Frontbild (Datei <ordner>/front.webp).
 *   2. `back` ist entweder ein echtes Rückbild oder der neutrale Platzhalter –
 *      NIEMALS die Frontdatei.
 *   3. Ärmelansichten existieren nur mit eigener Datei – nie als Front-Alias.
 *   4. Keine zwei Ansichten zeigen dieselbe Datei.
 *   5. Jede referenzierte Datei liegt auch wirklich unter public/.
 *
 * Aufruf: npx tsx scripts/ansichtenAudit.mts
 * Exit 1 bei jedem Verstoß.
 */
import { existsSync } from 'node:fs';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';
import { PLATZHALTER_BILD } from '../src/lib/assets/index.ts';
import { PRODUCTS } from '../src/config/products/index.ts';

const fehler: string[] = [];
let gepruefteFarben = 0;
let gepruefteAnsichten = 0;
const ansichtStatistik: Record<string, { echt: number; fallback: number }> = {};

for (const p of PRODUCTS) {
  const proFarbe = ASSET_MANIFEST[p.id];
  if (!proFarbe) {
    fehler.push(`${p.id}: gar kein Manifest-Eintrag`);
    continue;
  }

  for (const [colorId, eintrag] of Object.entries(proFarbe)) {
    if (eintrag.status !== 'real') continue;
    gepruefteFarben++;

    const frontPfad = eintrag.views.front;
    if (!frontPfad || frontPfad === PLATZHALTER_BILD) {
      fehler.push(`${p.id}/${colorId}: status "real", aber keine echte Vorderansicht`);
      continue;
    }

    const gesehen = new Map<string, string>();
    for (const [view, pfad] of Object.entries(eintrag.views)) {
      gepruefteAnsichten++;
      const stat = (ansichtStatistik[view] ??= { echt: 0, fallback: 0 });

      if (pfad === PLATZHALTER_BILD) {
        stat.fallback++;
        if (view !== 'back') {
          fehler.push(`${p.id}/${colorId}/${view}: Platzhalter ist nur für "back" als Fallback vorgesehen`);
        }
        continue;
      }
      stat.echt++;

      // Regel 5: Datei muss existieren.
      if (!existsSync(`public${pfad}`)) {
        fehler.push(`${p.id}/${colorId}/${view}: Datei fehlt → ${pfad}`);
      }

      // Regel 2 + 3: keine Ansicht darf heimlich die Frontdatei sein.
      if (view !== 'front' && pfad === frontPfad) {
        fehler.push(`${p.id}/${colorId}/${view}: zeigt die VORDERANSICHT (${pfad})`);
      }

      // Der Dateiname muss zur Ansicht passen (front.webp nur unter front usw.).
      const erwartet = `/${view.replace(/_/g, '-')}.webp`;
      if (!pfad.endsWith(erwartet)) {
        fehler.push(`${p.id}/${colorId}/${view}: Dateiname passt nicht zur Ansicht → ${pfad}`);
      }

      // Regel 4: keine Doppelverwendung derselben Datei.
      const schon = gesehen.get(pfad);
      if (schon) fehler.push(`${p.id}/${colorId}: "${schon}" und "${view}" nutzen dieselbe Datei ${pfad}`);
      gesehen.set(pfad, view);
    }
  }
}

console.log(`${PRODUCTS.length} Produkte, ${gepruefteFarben} Farbsätze mit echten Fotos, ${gepruefteAnsichten} Ansichten geprüft.\n`);
console.log('Ansichten (echtes Bild / neutraler Fallback):');
for (const [view, s] of Object.entries(ansichtStatistik)) {
  console.log(`  ${view.padEnd(14)} ${String(s.echt).padStart(4)} echt   ${String(s.fallback).padStart(4)} Fallback`);
}

if (fehler.length) {
  console.log(`\n${fehler.length} VERSTÖSSE:`);
  for (const f of fehler.slice(0, 60)) console.log('  ' + f);
  if (fehler.length > 60) console.log(`  … und ${fehler.length - 60} weitere`);
  process.exit(1);
}
console.log('\nAlle Ansichten logisch korrekt belegt.');
