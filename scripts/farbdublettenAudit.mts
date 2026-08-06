/**
 * Zwei Farbfelder eines Produkts, dahinter dasselbe Foto.
 *
 * Der Bilddubletten-Audit sucht über Produkte hinweg (Fremdprodukt-Bild). Diese
 * Prüfung sucht INNERHALB eines Produkts: Wenn zwei Katalogfarben auf dieselbe
 * Datei zeigen, klickt der Kunde zwei Punkte an und sieht zweimal dasselbe.
 * Das ist fast immer ein doppelter Katalogeintrag (oft eine unbenannte Farbe,
 * die nur als Hexwert geführt wird) – kein Bildfehler, aber sichtbar.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

let paare = 0;
for (const p of PRODUCTS) {
  const nach = new Map<string, string[]>();
  for (const c of p.colors) {
    const pfad = ASSET_MANIFEST[p.id]?.[c.id]?.views?.front;
    if (!pfad) continue;
    const f = join(process.cwd(), 'public', pfad.replace(/^\//, '').replace(/\.webp$/i, '.png'));
    if (!existsSync(f)) continue;
    const h = createHash('md5').update(readFileSync(f)).digest('hex');
    (nach.get(h) ?? nach.set(h, []).get(h)!).push(`${c.id} (${c.name})`);
  }
  for (const [, farben] of nach) {
    if (farben.length > 1) {
      paare++;
      console.log(`  ${p.id}: ${farben.join('  ==  ')}`);
    }
  }
}
console.log(`\n${paare} Farbgruppen mit identischem Foto innerhalb desselben Produkts`);
