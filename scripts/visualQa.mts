/**
 * Visuelle Prüfstrecke des Konfigurators (Playwright).
 *
 * Bedient den Konfigurator wie ein Kunde – Produkt, Farbe und Ansicht werden
 * über die echte Oberfläche gewechselt, nicht über den Zustandsspeicher – und
 * legt von jeder Kombination einen Screenshot des Konva-Canvas ab.
 *
 * Der In-App-Browser scheitert am Konva-Canvas (Zeitüberschreitung), Playwright
 * nicht. Deshalb ist DIESES Skript der Standardweg für visuelle Prüfungen.
 *
 * Voraussetzung: Entwicklungsserver läuft auf Port 3007.
 *
 * Aufruf:
 *   node scripts/visualQa.mjs                      # alle Produkte, Ankerfarbe, 4 Ansichten
 *   node scripts/visualQa.mjs --colors all         # zusätzlich jede Farbe
 *   node scripts/visualQa.mjs --produkt fotl-original-t
 *   node scripts/visualQa.mjs --views front,back
 *   node scripts/visualQa.mjs --breite 1366        # Fenstergröße prüfen
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASIS = 'http://localhost:3007';
const VIEW_INDEX = { front: 0, back: 1, sleeve_left: 2, sleeve_right: 3 };

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const NUR_PRODUKT = arg('produkt');
const FARB_MODUS = arg('colors', 'anchor'); // anchor | all
const VIEWS = (arg('views', 'front,back,sleeve_left,sleeve_right')).split(',');
const BREITE = Number(arg('breite', '1920'));
const HOEHE = Number(arg('hoehe', '1080'));
const OUT = arg('out', 'qa-screenshots/canvas');

const { PRODUCTS } = await import('../src/config/products/index.ts');

const produkte = NUR_PRODUKT ? PRODUCTS.filter((p) => p.id === NUR_PRODUKT) : PRODUCTS;
if (produkte.length === 0) {
  console.error(`Kein Produkt gefunden: ${NUR_PRODUKT}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: BREITE, height: HOEHE } });
const page = await context.newPage();

const fehler = [];
page.on('pageerror', (e) => fehler.push({ typ: 'pageerror', text: String(e).slice(0, 300) }));
page.on('console', (m) => {
  if (m.type() === 'error') fehler.push({ typ: 'console', text: m.text().slice(0, 300) });
});

const protokoll = [];
let n = 0;

/** Wartet, bis Canvas da ist UND das Produktbild wirklich gezeichnet wurde. */
async function warteAufCanvas() {
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForFunction(
    () => {
      const c = document.querySelector('canvas');
      if (!c || !c.width) return false;
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4 * 97) {
        if (d[i + 3] > 10 && !(d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250)) n++;
        if (n > 40) return true;
      }
      return false;
    },
    { timeout: 20000 }
  );
  await page.waitForTimeout(220);
}

for (const p of produkte) {
  const hatAermel = p.hasSleeves !== false;
  const views = VIEWS.filter((v) => hatAermel || !v.startsWith('sleeve'));
  const farben = FARB_MODUS === 'all' ? p.colors : [p.colors[0]];

  await page.goto(`${BASIS}/?produkt=${p.id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  try {
    await warteAufCanvas();
  } catch (e) {
    protokoll.push({ produkt: p.id, fehler: `Canvas nicht gezeichnet: ${String(e).slice(0, 120)}` });
    continue;
  }

  for (let fi = 0; fi < farben.length; fi++) {
    const farbe = farben[fi];
    if (FARB_MODUS === 'all' || fi > 0) {
      const swatches = page.locator('button[title]').filter({ has: page.locator('span.sr-only') });
      const ziel = page.locator(`button[title="${farbe.name.replace(/"/g, '\\"')}"]`).first();
      if (await ziel.count()) {
        await ziel.click();
        await page.waitForTimeout(320);
      }
    }

    for (const view of views) {
      const idx = VIEW_INDEX[view];
      const viewBtns = page.locator('button:has(img[alt])').nth(idx);
      try {
        await viewBtns.click({ timeout: 5000 });
      } catch {
        // Ansichtsleiste evtl. anders aufgebaut – überspringen statt abbrechen
      }
      await page.waitForTimeout(300);

      const datei = path.join(OUT, `${p.id}__${view}__${farbe.id}.png`);
      try {
        await page.locator('canvas').first().screenshot({ path: datei });
        n++;
        protokoll.push({ produkt: p.id, view, farbe: farbe.id, datei });
      } catch (e) {
        protokoll.push({ produkt: p.id, view, farbe: farbe.id, fehler: String(e).slice(0, 120) });
      }
    }
  }
  process.stderr.write(`\r  ${n} Screenshots · ${p.id}                    `);
}
process.stderr.write('\n');

writeFileSync(path.join(OUT, '_protokoll.json'), JSON.stringify({ protokoll, fehler }, null, 2));

console.log(`Screenshots      : ${n}`);
console.log(`Ausgabe          : ${OUT}`);
console.log(`Seitenfehler     : ${fehler.length}`);
for (const f of fehler.slice(0, 15)) console.log(`   [${f.typ}] ${f.text}`);
const misslungen = protokoll.filter((z) => z.fehler);
if (misslungen.length) {
  console.log(`\nNicht aufgenommen: ${misslungen.length}`);
  for (const m of misslungen.slice(0, 20)) console.log(`   ${m.produkt}/${m.view ?? '-'}: ${m.fehler}`);
}

await browser.close();
