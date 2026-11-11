/**
 * Katalog-Durchlauf im echten Browser: öffnet den Konfigurator für JEDES Produkt,
 * schaltet durch ALLE angebotenen Ansichten (Vorderseite, Rückseite, Ärmel links,
 * Ärmel rechts) und meldet, was kaputt wäre:
 *   - Konsolenfehler / unbehandelte Seitenfehler
 *   - fehlgeschlagene Bildabrufe (HTTP >= 400 oder Netzwerkfehler)
 *   - Ansichtsleiste ≠ erwartete Ansichten (sichtbareAnsichten der Standardfarbe)
 *   - Vorschaubild einer Ansicht nicht geladen (naturalWidth 0)
 *   - Zeichenfläche (canvas) fehlt oder hat Größe 0
 *
 * Der Durchlauf ist read-only (keine Bestellung, kein Schreibzugriff auf Daten).
 * Er gehört gegen einen Produktions-Build ohne Zugang zur Produktions-Datenbank
 * (next build && next start, Supabase-URL unerreichbar) – siehe Memory
 * "lokal testen ohne Produktions-DB".
 *
 * Aufruf (Server muss laufen):
 *   QA_BASIS=http://localhost:3011 npx tsx --tsconfig tsconfig.scripts.json scripts/pruef/katalogDurchlauf.mts [produkt-id …]
 *
 * Exit 1, wenn mindestens ein Befund bleibt.
 */
import { chromium, type Browser, type BrowserContext } from 'playwright';
import { PRODUCTS } from '../../src/config/products/index.ts';
import { ansichtenVon } from '../../src/lib/products/ansichten.ts';

const BASIS = process.env.QA_BASIS ?? 'http://localhost:3011';
const PARALLEL = Number(process.env.QA_PARALLEL ?? 4);
const nur = process.argv.slice(2);
const produkte = nur.length ? PRODUCTS.filter((p) => nur.includes(p.id)) : PRODUCTS;

/** Bekannte, unkritische Abrufe: Besucherzähler und Beliebtheit brauchen die Datenbank. */
const IGNORIEREN = [/\/api\/besuch/, /\/_vercel\//, /favicon/];

interface Befund {
  produkt: string;
  was: string;
}
const befunde: Befund[] = [];
let ansichtenGeprueft = 0;

async function pruefeProdukt(ctx: BrowserContext, id: string, erwartet: Set<string>) {
  const page = await ctx.newPage();
  const meld = (was: string) => befunde.push({ produkt: id, was });
  page.on('pageerror', (e) => meld(`Seitenfehler: ${String(e.message).slice(0, 160)}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (IGNORIEREN.some((r) => r.test(text))) return;
    // Ressourcenfehler der Konsole verweisen auf die Antwort-Prüfung unten.
    if (/Failed to load resource/.test(text)) return;
    meld(`Konsole: ${text.slice(0, 160)}`);
  });
  page.on('response', (r) => {
    if (r.status() < 400) return;
    const u = r.url();
    if (IGNORIEREN.some((x) => x.test(u))) return;
    meld(`HTTP ${r.status()}: ${u.replace(BASIS, '').slice(0, 120)}`);
  });
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (IGNORIEREN.some((x) => x.test(u))) return;
    if (r.failure()?.errorText === 'net::ERR_ABORTED') return; // Navigation/Wechsel bricht Abrufe legitim ab
    meld(`Abruf fehlgeschlagen: ${u.replace(BASIS, '').slice(0, 120)} (${r.failure()?.errorText})`);
  });

  try {
    await page.goto(`${BASIS}/konfigurator?produkt=${encodeURIComponent(id)}`, { waitUntil: 'load', timeout: 45000 });
    await page.waitForSelector('[data-ansicht]', { timeout: 20000 });
    const angeboten = await page.$$eval('[data-ansicht]', (els) => els.map((e) => e.getAttribute('data-ansicht') ?? ''));
    for (const a of angeboten) if (!erwartet.has(a)) meld(`Ansicht "${a}" wird angeboten, ist aber nicht im Produkt geführt`);
    if (!angeboten.includes('front')) meld('Vorderseite fehlt in der Ansichtsleiste');

    for (const a of angeboten) {
      await page.click(`[data-ansicht="${a}"]`, { timeout: 5000 });
      // Die Zeichenfläche wird als eigener Chunk nachgeladen (Konva): beim ersten
      // Wechsel darauf warten statt eine feste Zeit zu schlafen – sonst meldet der
      // Durchlauf unter Last (4 Seiten parallel) einen Fehler, der keiner ist.
      await page
        .waitForFunction(
          () => {
            const cv = document.querySelector('canvas') as HTMLCanvasElement | null;
            return !!cv && cv.width > 0 && cv.height > 0;
          },
          undefined,
          { timeout: 8000 }
        )
        .catch(() => undefined);
      await page.waitForTimeout(150);
      ansichtenGeprueft++;
      const info = await page.evaluate((view) => {
        const knopf = document.querySelector(`[data-ansicht="${view}"]`);
        const bild = knopf?.querySelector('img') as HTMLImageElement | null;
        const cv = document.querySelector('canvas') as HTMLCanvasElement | null;
        return {
          bildOk: !!bild && bild.complete && bild.naturalWidth > 0,
          canvasOk: !!cv && cv.width > 0 && cv.height > 0,
          aktiv: /border-gold/.test(knopf?.className ?? '') && !/border-transparent/.test(knopf?.className ?? ''),
        };
      }, a);
      if (!info.bildOk) meld(`Vorschaubild der Ansicht "${a}" nicht geladen`);
      if (!info.canvasOk) meld(`Zeichenfläche bei Ansicht "${a}" fehlt oder ist leer`);
      if (!info.aktiv) meld(`Ansicht "${a}" wird nach dem Klick nicht als aktiv markiert`);
    }
  } catch (e) {
    meld(`Durchlauf abgebrochen: ${String((e as Error).message).split('\n')[0]!.slice(0, 160)}`);
  } finally {
    await page.close();
  }
}

async function main() {
  const browser: Browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const warteschlange = produkte.map((p) => ({ id: p.id, erwartet: new Set<string>(ansichtenVon(p)) }));
  let fertig = 0;
  const arbeiter = Array.from({ length: PARALLEL }, async () => {
    for (;;) {
      const naechstes = warteschlange.shift();
      if (!naechstes) return;
      await pruefeProdukt(ctx, naechstes.id, naechstes.erwartet);
      fertig++;
      if (fertig % 20 === 0) console.log(`… ${fertig}/${produkte.length} Produkte, ${befunde.length} Befunde bisher`);
    }
  });
  await Promise.all(arbeiter);
  await browser.close();

  console.log(`\n${produkte.length} Produkte, ${ansichtenGeprueft} Ansichten durchgeschaltet.`);
  if (befunde.length === 0) {
    console.log('Keine Befunde: alle Ansichten laden, Bilder und Zeichenfläche vorhanden, keine Konsolenfehler.');
    return;
  }
  const je = new Map<string, number>();
  for (const b of befunde) je.set(b.was, (je.get(b.was) ?? 0) + 1);
  console.log(`\n${befunde.length} Befunde (${je.size} verschiedene):`);
  for (const [was, n] of [...je.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(`  ${String(n).padStart(4)} ×  ${was}`);
  console.log('\nBetroffene Produkte (erste 40):');
  for (const id of [...new Set(befunde.map((b) => b.produkt))].slice(0, 40)) {
    console.log(`  ${id}: ${befunde.filter((b) => b.produkt === id).map((b) => b.was).slice(0, 3).join(' | ')}`);
  }
  process.exit(1);
}

await main();
