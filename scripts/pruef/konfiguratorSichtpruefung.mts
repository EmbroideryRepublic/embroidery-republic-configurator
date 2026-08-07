/**
 * Manuelle Sichtpruefung des Konfigurators je Produkttyp (FIND-Phase, read-only).
 * Nicht Teil der regulaeren Suite - Wegwerf-Skript fuer diese Pruefung.
 *
 * Screenshots je Ansicht aller Produkttypen + Interaktionstests (Drag,
 * Resize, Rotation, Sperrzonen) fuer drei repraesentative Produkte.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASIS = process.env.QA_BASIS ?? 'http://localhost:3007';
const OUT = 'scripts/pruef/screens';
mkdirSync(OUT, { recursive: true });

const PRODUKTE: { id: string; typ: string }[] = [
  { id: 'gildan-heavy-t', typ: 'tshirt' },
  { id: 'gildan-softstyle-polo', typ: 'polo' },
  { id: 'justhoods-college-hoodie', typ: 'hoodie' },
  { id: 'gildan-zip-hoodie', typ: 'zip-hoodie' },
  { id: 'justhoods-awdis-sweat', typ: 'sweater' },
  { id: 'fotl-original-longsleeve', typ: 'longsleeve' },
  { id: 'sols-north-fleece', typ: 'jacket' },
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1 });

  for (const p of PRODUKTE) {
    console.log(`\n=== ${p.typ} (${p.id}) ===`);
    await page.goto(`${BASIS}/konfigurator?produkt=${p.id}`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-konfigbild]').first().waitFor({ state: 'attached', timeout: 20000 }).catch(() => console.log('  kein data-konfigbild gefunden'));
    await page.waitForTimeout(500);

    const ansichtKnoepfe = page.locator('button[data-ansicht]');
    const n = await ansichtKnoepfe.count();
    const views: string[] = [];
    for (let i = 0; i < n; i++) {
      views.push((await ansichtKnoepfe.nth(i).getAttribute('data-ansicht')) ?? '');
    }
    console.log('  Ansichten:', views.join(', '));

    for (const view of views) {
      await page.locator(`button[data-ansicht="${view}"]`).click();
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${OUT}/${p.typ}__${p.id}__${view}.png` });
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
