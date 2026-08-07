/**
 * ═══════════════════════════════════════════════════════════════════════
 * TOUCH-ZIEL- UND STICKY-PRÜFUNG – mobile (375×812) und tablet (768×1024)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Einmaliger Prüflauf für den Auftrag "Mobile/Touch-Prüfung": misst die
 * TATSÄCHLICH gerenderten Klickflächen (getBoundingClientRect, kein
 * Tailwind-Klassen-Raten) der laut Auftrag kritischen Bedienelemente
 * ("In den Warenkorb", Farbwahl-Swatches, Größen-Eingabe, Cart-Icon,
 * Hamburger-Menü) gegen die 44×44px-Empfehlung (WCAG 2.5.5 AAA / Apple HIG),
 * UND prüft programmatisch, ob sticky positionierte Elemente sich beim
 * Scrollen gegenseitig überlappen (elementFromPoint an der erwarteten
 * Header-Logo-Position).
 *
 * Läuft als eigener, isolierter Playwright-Chromium-Prozess (nicht über die
 * interaktive Claude_Browser-MCP-Tab-Bridge), weil diese in dieser Umgebung
 * von parallelen Agenten mitbenutzt wird und dadurch keine stabilen
 * Messungen liefert (Tab wechselte während der Prüfung wiederholt selbständig
 * die URL).
 *
 * Aufruf (Produktions-Server auf 3007 muss laufen – next build && next start):
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/pruef/touchZielePruefung.mts
 *
 * Schreibt nach stdout UND scripts/pruef/touchziele-ergebnis.json.
 */
import { writeFileSync } from 'node:fs';
import { chromium, type Page } from 'playwright';

const BASIS = process.env.QA_BASIS ?? 'http://localhost:3007';
const MIN = 44; // WCAG 2.5.5 AAA / gängige Praxisempfehlung

interface Ziel {
  name: string;
  seite: string;
  breite: number;
  gefunden: boolean;
  w: number;
  h: number;
  unterMindestgroesse: boolean;
}

const ergebnisse: Ziel[] = [];
const stickyBefunde: Record<string, unknown>[] = [];

async function messeZiel(
  page: Page,
  name: string,
  seite: string,
  breite: number,
  selektor: string,
  index = 0
): Promise<void> {
  const loc = page.locator(selektor).nth(index);
  const anzahl = await loc.count();
  if (anzahl === 0) {
    ergebnisse.push({ name, seite, breite, gefunden: false, w: -1, h: -1, unterMindestgroesse: false });
    return;
  }
  const box = await loc.boundingBox();
  if (!box) {
    ergebnisse.push({ name, seite, breite, gefunden: false, w: -1, h: -1, unterMindestgroesse: false });
    return;
  }
  const w = Math.round(box.width);
  const h = Math.round(box.height);
  ergebnisse.push({ name, seite, breite, gefunden: true, w, h, unterMindestgroesse: w < MIN || h < MIN });
}

async function pruefeBreite(page: Page, breite: number, hoehe: number): Promise<void> {
  await page.setViewportSize({ width: breite, height: hoehe });

  // ── Startseite: Hamburger + Cart-Icon in der Kopfzeile ──────────────
  await page.goto(`${BASIS}/`, { waitUntil: 'load' });
  await messeZiel(page, 'Hamburger-Menü', 'startseite', breite, 'header button[aria-label="Menü"]');
  await messeZiel(page, 'Cart-Icon (Kopfzeile)', 'startseite', breite, 'header button:has-text("Warenkorb")');

  // ── Produktseite: Farbwahl-Swatches + "Jetzt konfigurieren" ─────────
  await page.goto(`${BASIS}/produkt/fotl-ladies-iconic195-t`, { waitUntil: 'load' });
  await messeZiel(page, 'Farbwahl-Swatch #1 (Produktseite)', 'produktseite', breite, 'button[data-farbe]', 0);
  await messeZiel(page, 'Ansicht-Umschalter (Produktseite)', 'produktseite', breite, 'button[data-ansicht]', 0);
  await messeZiel(page, '"Jetzt konfigurieren"-CTA', 'produktseite', breite, 'a:has-text("Jetzt konfigurieren")');

  // ── Katalogseite: Sticky-Filterband vs. Sticky-Header ────────────────
  await page.goto(`${BASIS}/produkt`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);
  const stickyKatalog = await page.evaluate(() => {
    const header = document.querySelector('header');
    const filterBand = document.querySelector('div.sticky.top-0.z-40');
    let headerRect = null;
    if (header) {
      const r = header.getBoundingClientRect();
      headerRect = { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), zIndex: getComputedStyle(header).zIndex };
    }
    let filterBandRect = null;
    if (filterBand) {
      const r = filterBand.getBoundingClientRect();
      filterBandRect = { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), zIndex: getComputedStyle(filterBand).zIndex };
    }
    // Erwartete Position des Kopfzeilen-Logos: 20px von links/oben.
    const elAt = document.elementFromPoint(20, 20);
    let elementAtLogoPosition = null;
    if (elAt) {
      elementAtLogoPosition = {
        tag: elAt.tagName,
        klassen: (elAt.className || '').toString().slice(0, 80),
        liegtInHeader: !!elAt.closest('header'),
        liegtInFilterBand: filterBand ? filterBand.contains(elAt) : false,
      };
    }
    return { headerRect, filterBandRect, elementAtLogoPosition };
  });
  stickyBefunde.push({ seite: 'katalog', breite, ...stickyKatalog });

  // ── Konfigurator: Größen-Eingabe, Farbwahl, "In den Warenkorb" ──────
  await page.goto(`${BASIS}/konfigurator?produkt=fotl-ladies-iconic195-t`, { waitUntil: 'load' });
  await page.waitForTimeout(800); // Hydration + Preload
  await messeZiel(page, 'Farbwahl-Swatch #1 (Konfigurator)', 'konfigurator', breite, 'button[data-farbe]', 0);
  await messeZiel(page, 'Größen-Mengeneingabe (erstes Feld)', 'konfigurator', breite, 'input[type="number"]', 0);
  await messeZiel(page, '"In den Warenkorb"-Button', 'konfigurator', breite, 'button:has-text("In den Warenkorb")');

  // Sticky-Überlappung Header vs. Stepper im Konfigurator
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(200);
  const stickyKonfigurator = await page.evaluate(() => {
    const header = document.querySelector('header');
    const stepper = document.querySelector('div.sticky[class*="top-\\["]');
    let headerRect = null;
    if (header) {
      const r = header.getBoundingClientRect();
      headerRect = { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), zIndex: getComputedStyle(header).zIndex };
    }
    let stepperRect = null;
    if (stepper) {
      const r = stepper.getBoundingClientRect();
      stepperRect = { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), zIndex: getComputedStyle(stepper).zIndex };
    }
    const elAtLogo = document.elementFromPoint(20, 20);
    let elementAtLogoPosition = null;
    if (elAtLogo) {
      elementAtLogoPosition = { tag: elAtLogo.tagName, liegtInHeader: !!elAtLogo.closest('header') };
    }
    return { headerRect, stepperRect, elementAtLogoPosition };
  });
  stickyBefunde.push({ seite: 'konfigurator', breite, ...stickyKonfigurator });

  // ── Konfigurator-Touch-Bedienbarkeit: echtes Touch-Drag auf dem Canvas ──
  // Ohne hochgeladenes Motiv gibt es kein verschiebbares Element; stattdessen
  // wird geprüft, ob die Canvas-Fläche überhaupt im sichtbaren Bereich liegt
  // (kein Scrollen INNERHALB der Leinwand nötig) und ob ein Pinch-Zoom-zu-
  // Element (touch-action) das Ziehen blockieren würde.
  const canvasInfo = await page.evaluate(() => {
    const stage = document.querySelector('.konvajs-content, canvas');
    if (!stage) return null;
    const r = stage.getBoundingClientRect();
    const cs = getComputedStyle(stage);
    return {
      w: Math.round(r.width),
      h: Math.round(r.height),
      top: Math.round(r.top),
      passtInViewportBreite: r.width <= window.innerWidth + 1,
      touchAction: cs.touchAction,
    };
  });
  stickyBefunde.push({ seite: 'konfigurator-canvas', breite, canvasInfo });
}

async function main(): Promise<void> {
  console.log('='.repeat(78));
  console.log(`TOUCH-ZIEL- UND STICKY-PRÜFUNG gegen ${BASIS}`);
  console.log('='.repeat(78));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  });
  const page = await context.newPage();

  await pruefeBreite(page, 375, 812); // mobile
  await pruefeBreite(page, 768, 1024); // tablet

  await browser.close();

  console.log('\n── Touch-Ziel-Größen ─────────────────────────────────────');
  for (const e of ergebnisse) {
    const status = !e.gefunden ? 'NICHT GEFUNDEN' : e.unterMindestgroesse ? `✘ ${e.w}×${e.h}px (< ${MIN}px)` : `ok ${e.w}×${e.h}px`;
    console.log(`[${e.breite}px] ${e.seite} · ${e.name}: ${status}`);
  }

  console.log('\n── Sticky-Elemente ────────────────────────────────────────');
  for (const s of stickyBefunde) {
    console.log(JSON.stringify(s));
  }

  writeFileSync(
    'scripts/pruef/touchziele-ergebnis.json',
    JSON.stringify({ ergebnisse, stickyBefunde, erzeugtAm: new Date().toISOString() }, null, 2)
  );
  console.log('\nBericht: scripts/pruef/touchziele-ergebnis.json');
}

void main();
