/**
 * ═══════════════════════════════════════════════════════════════════════
 * SICHTPRÜFUNG IM ECHTEN SHOP – gesamter Katalog, headless (Playwright)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Playwright-Portierung von public/_pruef/farbdurchlauf.html. Identische
 * Prüflogik (jede Farbe, jede Ansicht, Produktseite UND Konfigurator,
 * gelesen wird der tatsächlich im DOM stehende Bildpfad), aber OHNE
 * Browser-Tab – deshalb nicht von der Sichtbarkeits-Drosselung des
 * interaktiven Vorschau-Fensters betroffen (Hintergrund-Tabs drosseln
 * setTimeout auf ~1/Sekunde, was die iframe-Variante bei 154 Produkten von
 * "Minuten" auf "Stunden" verlangsamt hat). Playwright treibt einen echten,
 * headless Chromium-Prozess – dasselbe Werkzeug, das docs/architektur.md
 * für die Konfigurator-Prüfung ohnehin vorschreibt ("der In-App-Browser
 * scheitert am Konva-Canvas").
 *
 * Aufruf (Produktions-Server auf 3007 muss laufen – next build && next start):
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/sichtpruefungKatalog.mts
 *   … --produkt <id>              nur ein Produkt (Debugging)
 *   … --ids-datei public/_pruef/ids.json   IDs aus einer Datei statt "alle"
 *
 * Schreibt laufend nach stdout UND am Ende einen vollständigen JSON-Bericht
 * nach scripts/pruef/sichtpruefung-ergebnis.json.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { chromium, type Page } from 'playwright';
import { PRODUCTS } from '../src/config/products/index.ts';

const BASIS = process.env.QA_BASIS ?? 'http://localhost:3007';

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const nurProdukt = flag('--produkt');
const idsDatei = flag('--ids-datei');

const ids: string[] = nurProdukt
  ? [nurProdukt]
  : idsDatei && existsSync(idsDatei)
    ? (JSON.parse(readFileSync(idsDatei, 'utf8')) as string[])
    : PRODUCTS.map((p) => p.id);

interface Befund {
  id: string;
  farbe: string;
  ansicht: string;
  problem: string;
}

/** Next.js verpackt Bild-URLs in /_next/image?url=… – sonst übersieht man Platzhalter. */
function roh(s: string): string {
  try {
    const u = new URL(s, BASIS);
    return decodeURIComponent(u.searchParams.get('url') || u.pathname);
  } catch {
    return s || '';
  }
}

async function produktPruefen(page: Page, id: string): Promise<Befund[]> {
  const befunde: Befund[] = [];
  await page.goto(`${BASIS}/produkt/${id}`, { waitUntil: 'domcontentloaded' });
  await page.locator('img[data-produktbild]').first().waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});

  const farbKnoepfe = page.locator('button[data-farbe]');
  const anzahlFarben = await farbKnoepfe.count();
  if (anzahlFarben === 0) return [{ id, farbe: '-', ansicht: '-', problem: 'keine Farbwahl gefunden' }];

  for (let fi = 0; fi < anzahlFarben; fi++) {
    const knopf = farbKnoepfe.nth(fi);
    const farbe = (await knopf.getAttribute('data-farbe')) ?? '';
    await knopf.click();

    const ansichtKnoepfe = page.locator('button[data-ansicht]');
    const anzahlAnsichten = await ansichtKnoepfe.count();
    const ansichten: string[] = [];
    for (let vi = 0; vi < anzahlAnsichten; vi++) {
      ansichten.push((await ansichtKnoepfe.nth(vi).getAttribute('data-ansicht')) ?? '');
    }
    const gesehen = new Map<string, string>();

    for (const view of ansichten.length ? ansichten : ['front']) {
      await page.locator(`button[data-ansicht="${view}"]`).click({ trial: false }).catch(() => {});
      const erwartet = `${farbe}/${view}`;
      let zustand = '';
      let pfad = '';
      for (let i = 0; i < 60; i++) {
        const el = page.locator('img[data-produktbild]').first();
        zustand = (await el.getAttribute('data-produktbild').catch(() => null)) ?? '';
        if (zustand === erwartet) {
          pfad = roh((await el.getAttribute('src').catch(() => null)) ?? '');
          break;
        }
        await page.waitForTimeout(25);
      }
      const melde = (problem: string) => befunde.push({ id, farbe, ansicht: view, problem });
      if (zustand !== erwartet) melde('Zustand nicht übernommen: ' + zustand);
      else if (!pfad) melde('kein Bild im DOM');
      else if (pfad.includes('_platzhalter')) melde(view === 'back' ? 'RUECK-PLATZHALTER' : 'Platzhalter: ' + pfad);
      else if (gesehen.has(pfad)) melde('gleiches Bild wie "' + gesehen.get(pfad) + '"');
      else gesehen.set(pfad, view);
    }
  }
  return befunde;
}

async function konfigPruefen(page: Page, id: string): Promise<Befund[]> {
  const befunde: Befund[] = [];
  await page.goto(`${BASIS}/konfigurator?produkt=${id}`, { waitUntil: 'domcontentloaded' });
  await page
    .locator('[data-konfigbild]')
    .first()
    .waitFor({ state: 'attached', timeout: 20000 })
    .catch(() => {});
  await page.locator('button[data-farbe]').first().waitFor({ state: 'attached', timeout: 20000 }).catch(() => {});

  const farbKnoepfe = page.locator('button[data-farbe]');
  const anzahlFarben = await farbKnoepfe.count();
  if (anzahlFarben === 0) return [{ id, farbe: '-', ansicht: '-', problem: 'Konfigurator: keine Farbwahl' }];

  for (let fi = 0; fi < anzahlFarben; fi++) {
    const knopf = farbKnoepfe.nth(fi);
    const farbe = (await knopf.getAttribute('data-farbe')) ?? '';
    await knopf.click();

    const ansichtKnoepfe = page.locator('button[data-ansicht]');
    const anzahlAnsichten = await ansichtKnoepfe.count();
    const ansichten: string[] = [];
    for (let vi = 0; vi < anzahlAnsichten; vi++) {
      ansichten.push((await ansichtKnoepfe.nth(vi).getAttribute('data-ansicht')) ?? '');
    }
    const gesehen = new Map<string, string>();

    for (const view of ansichten.length ? ansichten : ['front']) {
      await page.locator(`button[data-ansicht="${view}"]`).click().catch(() => {});
      let anker = '';
      for (let i = 0; i < 60; i++) {
        anker = (await page.locator('[data-konfigbild]').first().getAttribute('data-konfigbild').catch(() => null)) ?? '';
        if (anker.startsWith(`${farbe}/${view}/`)) break;
        await page.waitForTimeout(25);
      }
      const pfad = anker.split('/').slice(2).join('/');
      const melde = (problem: string) => befunde.push({ id, farbe, ansicht: view, problem: 'Konfigurator: ' + problem });
      if (!anker.startsWith(`${farbe}/${view}/`)) melde('Zustand nicht übernommen: ' + anker);
      else if (!pfad) melde('kein Bild');
      else if (pfad.includes('_platzhalter')) melde(view === 'back' ? 'RUECK-PLATZHALTER' : 'Platzhalter');
      else if (gesehen.has(pfad)) melde('gleiches Bild wie "' + gesehen.get(pfad) + '"');
      else gesehen.set(pfad, view);
    }
  }
  return befunde;
}

async function main(): Promise<void> {
  console.log('='.repeat(78));
  console.log(`SICHTPRÜFUNG KATALOG – ${ids.length} Produkt(e) gegen ${BASIS}`);
  console.log('='.repeat(78));

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const alleBefunde: Befund[] = [];
  const start = Date.now();
  let n = 0;
  for (const id of ids) {
    try {
      alleBefunde.push(...(await produktPruefen(page, id)));
      alleBefunde.push(...(await konfigPruefen(page, id)));
    } catch (e) {
      alleBefunde.push({ id, farbe: '-', ansicht: '-', problem: 'Fehler: ' + (e instanceof Error ? e.message : String(e)) });
    }
    n++;
    const sek = ((Date.now() - start) / 1000).toFixed(0);
    console.log(`[${n}/${ids.length}] ${id} · ${alleBefunde.length} Befunde bisher · ${sek}s`);
    for (const b of alleBefunde.filter((b) => b.id === id)) {
      console.log(`    ✘ ${b.farbe} / ${b.ansicht}: ${b.problem}`);
    }
  }

  await browser.close();

  mkdirSync('scripts/pruef', { recursive: true });
  writeFileSync(
    'scripts/pruef/sichtpruefung-ergebnis.json',
    JSON.stringify({ geprueft: ids.length, befunde: alleBefunde, erzeugtAm: new Date().toISOString() }, null, 2)
  );

  console.log('\n' + '─'.repeat(78));
  console.log(`FERTIG: ${ids.length} Produkte geprüft, ${alleBefunde.length} Befunde.`);
  console.log('Bericht: scripts/pruef/sichtpruefung-ergebnis.json');
  console.log('─'.repeat(78));
  if (alleBefunde.length > 0) process.exitCode = 1;
}

void main();
