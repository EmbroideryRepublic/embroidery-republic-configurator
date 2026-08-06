/**
 * Zeigt ein Produkt seine Ärmelansicht nur bei EINIGEN Farben, springt die
 * Ansichtenleiste beim Farbwechsel. Diese Liste macht solche Sprünge sichtbar.
 */
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

let uneinheitlich = 0;
for (const p of PRODUCTS) {
  const real = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  if (real.length < 2) continue;
  for (const v of ['sleeve_left', 'sleeve_right'] as const) {
    const mit = real.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.views?.[v]).length;
    if (mit > 0 && mit < real.length) {
      uneinheitlich++;
      console.log(`  ${v.padEnd(13)} ${String(mit).padStart(3)}/${String(real.length).padStart(3)}  ${p.id}`);
    }
  }
}
console.log(`\n${uneinheitlich} Produkt/Ansicht-Paare mit uneinheitlicher Ärmelabdeckung`);

// Wie sähe es aus, wenn eine Ärmelansicht nur bei VOLLSTÄNDIGER Abdeckung
// gezeigt würde (keine springende Ansichtenleiste beim Farbwechsel)?
let voll = 0, teil = 0, keine = 0;
for (const p of PRODUCTS) {
  const real = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  const mit = real.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.views?.sleeve_left).length;
  if (mit === 0) keine++;
  else if (mit === real.length) voll++;
  else teil++;
}
console.log(`\nÄrmel links: ${voll} Produkte vollständig · ${teil} teilweise · ${keine} ohne`);
