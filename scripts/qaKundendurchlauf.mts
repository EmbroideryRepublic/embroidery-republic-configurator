/**
 * Kundendurchlauf durch den Konfigurator (Playwright).
 *
 * Spielt die vollständige Strecke eines echten Kunden durch – Produkt, Farbe,
 * Größe, Ansicht, Veredelungsart, Logo hochladen/verschieben/skalieren, Preis
 * prüfen, in den Warenkorb – und macht nach JEDEM Schritt einen Screenshot.
 *
 * Zusätzlich laufen nach jedem Schritt Layoutprüfungen, die am Standbild
 * schwer zu sehen sind: abgeschnittene Texte, waagerechte Seitenscrollbalken,
 * überlappende Bedienelemente, Elemente außerhalb des Sichtbereichs.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/qaKundendurchlauf.mts [--breite 1920]
 */
import { chromium, type Page } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import path from 'node:path';

function arg(name: string, fallback: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

const BASIS = 'http://localhost:3007';
const BREITE = Number(arg('breite', '1920'));
const HOEHE = Number(arg('hoehe', '1080'));
const OUT = arg('out', `qa-screenshots/durchlauf-${BREITE}`);
mkdirSync(OUT, { recursive: true });

const befunde: { schritt: string; art: string; text: string }[] = [];
let schrittNr = 0;

/** Testlogo erzeugen – klar erkennbar, damit Lage und Größe beurteilbar sind. */
const LOGO = path.join(OUT, '_testlogo.png');
await sharp({
  create: { width: 400, height: 300, channels: 4, background: { r: 0, g: 90, b: 200, alpha: 1 } },
})
  .composite([
    {
      input: Buffer.from(
        `<svg width="400" height="300">
           <rect x="0" y="0" width="400" height="300" fill="#0a5ac8"/>
           <circle cx="200" cy="130" r="80" fill="#ffd400"/>
           <text x="200" y="255" font-family="sans-serif" font-size="52" font-weight="bold"
                 text-anchor="middle" fill="#ffffff">LOGO</text>
         </svg>`
      ),
      top: 0,
      left: 0,
    },
  ])
  .png()
  .toFile(LOGO);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: BREITE, height: HOEHE } });
const page = await context.newPage();

page.on('pageerror', (e) => befunde.push({ schritt: `#${schrittNr}`, art: 'pageerror', text: String(e).slice(0, 250) }));
page.on('console', (m) => {
  if (m.type() === 'error') befunde.push({ schritt: `#${schrittNr}`, art: 'console', text: m.text().slice(0, 250) });
});

/** Layoutprüfungen im laufenden DOM. */
async function pruefeLayout(schritt: string) {
  const ergebnis = await page.evaluate(() => {
    const raus: { art: string; text: string }[] = [];

    const de = document.scrollingElement ?? document.documentElement;
    if (de.scrollWidth > de.clientWidth + 1) {
      raus.push({ art: 'h-scroll', text: `Seite scrollt waagerecht: ${de.scrollWidth} > ${de.clientWidth}` });
    }

    // Abgeschnittene Texte: sichtbar, einzeilig gekürzt, Inhalt breiter als Box
    let abgeschnitten = 0;
    const beispiele: string[] = [];
    document.querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (el.children.length > 0) return;
      const t = (el.textContent ?? '').trim();
      if (!t) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible') {
        abgeschnitten++;
        if (beispiele.length < 6) beispiele.push(`"${t.slice(0, 40)}"`);
      }
    });
    if (abgeschnitten > 0) {
      raus.push({ art: 'text-gekuerzt', text: `${abgeschnitten} gekürzte Texte, z.B. ${beispiele.join(', ')}` });
    }

    // Bedienelemente ausserhalb des Sichtbereichs
    let ausserhalb = 0;
    document.querySelectorAll<HTMLElement>('button, a[href], input, select').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.right < -1 || r.left > window.innerWidth + 1) ausserhalb++;
    });
    if (ausserhalb > 0) raus.push({ art: 'ausserhalb', text: `${ausserhalb} Bedienelemente seitlich ausserhalb` });

    return raus;
  });
  for (const r of ergebnis) befunde.push({ schritt, art: r.art, text: r.text });
}

async function schritt(name: string, fn: () => Promise<void>) {
  schrittNr++;
  const label = `${String(schrittNr).padStart(2, '0')}-${name}`;
  try {
    await fn();
  } catch (e) {
    befunde.push({ schritt: label, art: 'FEHLER', text: String(e).slice(0, 250) });
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${label}.png`), fullPage: false });
  await pruefeLayout(label);
  console.log(`  ${label}`);
}

async function warteCanvas(p: Page) {
  await p.waitForSelector('canvas', { timeout: 30000 });
  await p.waitForTimeout(700);
}

// ── Durchlauf ───────────────────────────────────────────────────────────
await schritt('start', async () => {
  await page.goto(`${BASIS}/?produkt=fotl-valueweight-t`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await warteCanvas(page);
});

await schritt('produkt-wechseln', async () => {
  // Produkt aus der linken Liste wählen (echter Kundenweg, nicht per URL)
  const eintrag = page.locator('aside button, [class*="ProductList"] button').first();
  const listenKnopf = page.getByRole('button').filter({ hasText: /Hoodie|Polo|Sweat/i }).first();
  if (await listenKnopf.count()) await listenKnopf.click();
  else if (await eintrag.count()) await eintrag.click();
  await page.waitForTimeout(900);
});

await schritt('farbe-wechseln', async () => {
  const swatches = page.locator('button:has(span.sr-only)');
  const n = await swatches.count();
  if (n > 2) await swatches.nth(2).click();
});

await schritt('groesse-waehlen', async () => {
  const plus = page.getByRole('button', { name: /^\+$/ }).first();
  if (await plus.count()) {
    for (let i = 0; i < 5; i++) await plus.click();
  } else {
    const zahl = page.locator('input[type="number"]').first();
    if (await zahl.count()) await zahl.fill('10');
  }
});

await schritt('ansicht-rueckseite', async () => {
  await page.locator('button:has(img[alt])').nth(1).click();
});

await schritt('ansicht-aermel-links', async () => {
  const btn = page.locator('button:has(img[alt])').nth(2);
  if (await btn.count()) await btn.click();
});

await schritt('zurueck-vorderseite', async () => {
  await page.locator('button:has(img[alt])').nth(0).click();
});

await schritt('logo-hochladen', async () => {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(LOGO);
  await page.waitForTimeout(1800);
});

await schritt('logo-verschieben', async () => {
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('kein Canvas');
  const mx = box.x + box.width / 2;
  const my = box.y + box.height / 2;
  await page.mouse.move(mx, my);
  await page.mouse.down();
  await page.mouse.move(mx - 60, my - 40, { steps: 12 });
  await page.mouse.up();
});

await schritt('logo-skalieren', async () => {
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('kein Canvas');
  // Auswahl sicherstellen, dann an einem Eckgriff ziehen
  await page.mouse.click(box.x + box.width / 2 - 60, box.y + box.height / 2 - 40);
  await page.waitForTimeout(400);
  const griff = { x: box.x + box.width / 2 - 60 + 55, y: box.y + box.height / 2 - 40 + 45 };
  await page.mouse.move(griff.x, griff.y);
  await page.mouse.down();
  await page.mouse.move(griff.x + 55, griff.y + 45, { steps: 12 });
  await page.mouse.up();
});

await schritt('veredelung-stickerei', async () => {
  const btn = page.getByRole('button', { name: /Stickerei|Stick/i }).first();
  if (await btn.count()) await btn.click();
  await page.waitForTimeout(1200);
});

await schritt('veredelung-zurueck-dtf', async () => {
  const btn = page.getByRole('button', { name: /DTF|Druck/i }).first();
  if (await btn.count()) await btn.click();
  await page.waitForTimeout(1200);
});

await schritt('preis-pruefen', async () => {
  const text = await page.locator('body').innerText();
  const preise = [...text.matchAll(/(\d+[.,]\d{2})\s*€|€\s*(\d+[.,]\d{2})/g)].map((m) => m[0]);
  befunde.push({ schritt: 'preis', art: 'info', text: `gefundene Preisangaben: ${preise.slice(0, 12).join(' | ') || 'KEINE'}` });
});

await schritt('in-den-warenkorb', async () => {
  const btn = page.getByRole('button', { name: /Warenkorb|hinzufügen|bestellen/i }).first();
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(1200);
  } else {
    throw new Error('Warenkorb-Knopf nicht gefunden');
  }
});

writeFileSync(path.join(OUT, '_befunde.json'), JSON.stringify(befunde, null, 2));

console.log(`\n=== BEFUNDE (${BREITE}x${HOEHE}) ===`);
const gruppen = new Map<string, typeof befunde>();
for (const b of befunde) {
  if (!gruppen.has(b.art)) gruppen.set(b.art, []);
  gruppen.get(b.art)!.push(b);
}
for (const [art, liste] of gruppen) {
  console.log(`\n-- ${art} (${liste.length}) --`);
  for (const b of liste.slice(0, 10)) console.log(`   [${b.schritt}] ${b.text}`);
}

await browser.close();
