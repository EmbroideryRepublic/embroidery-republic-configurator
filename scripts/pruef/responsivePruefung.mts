/**
 * ═══════════════════════════════════════════════════════════════════════
 * RESPONSIVE-SICHTPRÜFUNG – horizontaler Overflow über alle Breakpoints
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Lädt eine feste Liste öffentlicher/administrativer Seiten bei mehreren
 * Viewport-Breiten und prüft PROGRAMMATISCH:
 *   1. document.documentElement.scrollWidth > clientWidth + 1  (Seite ist
 *      insgesamt breiter als der Viewport → horizontaler Scrollbalken)
 *   2. einzelne Elemente, deren getBoundingClientRect().right über
 *      innerWidth + 1 hinausragt UND die noch (teilweise) im sichtbaren
 *      Bereich beginnen (rect.left < innerWidth) – das filtert bewusst
 *      absichtlich off-canvas geschobene Elemente heraus (z.B. ein
 *      geschlossenes Mobil-Menü mit translateX(100%)), die sonst als
 *      falsches Positiv auftauchen würden.
 *   3. ob ein horizontaler Scrollbalken durch overflow-x:hidden auf
 *      html/body unterdrückt wird (Inhalt dann unsichtbar abgeschnitten
 *      statt scrollbar – separat vermerkt, da subtiler).
 *
 * Zusätzlich: Screenshots (fullPage) bei den zwei kleinsten Breakpoints
 * (320, 375) je Seite unter scripts/pruef/responsive/ für die manuelle
 * Sichtprüfung von Umbrüchen/Überlappungen, die die Automatik nicht
 * erfasst (Stil wie sichtpruefungKatalog.mts, aber Layout statt Bildpfade).
 *
 * Aufruf (Produktions-Server auf 3007 muss laufen – next build && next start):
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/pruef/responsivePruefung.mts
 *
 * Schreibt laufend nach stdout UND am Ende einen vollständigen JSON-Bericht
 * nach scripts/pruef/responsive-ergebnis.json.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright';

const BASIS = process.env.QA_BASIS ?? 'http://localhost:3007';

// Vier Produkte mit unterschiedlich viel Inhalt (per Skript gegen
// PRODUCTS ermittelt: Farbenanzahl, Beschreibungslänge, Namenslänge):
//  - gildan-ultra-cotton-t-shirt: meiste Farben im Katalog (52) → breiteste
//    Farbwahl-Zeile, Extremfall für Umbruch/Overflow der Swatches.
//  - bundc-t-shirt-e150-women: ebenfalls sehr farbenreich (41).
//  - earthpositive-earthpositive-organic-mensunisex-pullover-hoodie:
//    längster Produktname im Katalog (49 Zeichen) → Extremfall für
//    Titel-Umbruch in Kopfzeile/Karten/Breadcrumb.
//  - earthpositive-pique-polo-shirt: Minimalfall, nur 1 Farbe, kürzeste
//    Beschreibung, kein sizeGuide-Nachbar-Layout-Stress.
const SEITEN: { pfad: string; name: string }[] = [
  { pfad: '/', name: 'startseite' },
  { pfad: '/produkt', name: 'katalog' },
  { pfad: '/produkt/gildan-ultra-cotton-t-shirt', name: 'produkt-viele-farben' },
  { pfad: '/produkt/bundc-t-shirt-e150-women', name: 'produkt-viele-farben-2' },
  {
    pfad: '/produkt/earthpositive-earthpositive-organic-mensunisex-pullover-hoodie',
    name: 'produkt-langer-name',
  },
  { pfad: '/produkt/earthpositive-pique-polo-shirt', name: 'produkt-minimal' },
  { pfad: '/konfigurator', name: 'konfigurator' },
  { pfad: '/konto/anmelden', name: 'konto-anmelden' },
  { pfad: '/konto/registrieren', name: 'konto-registrieren' },
  { pfad: '/kontakt', name: 'kontakt' },
  { pfad: '/faq', name: 'faq' },
  { pfad: '/impressum', name: 'impressum' },
  { pfad: '/datenschutz', name: 'datenschutz' },
  { pfad: '/agb', name: 'agb' },
  { pfad: '/admin', name: 'admin-login' },
  { pfad: '/diese-seite-gibt-es-nicht-404-check', name: '404' },
];

const BREITEN = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const HOEHE = 800;
const SCREENSHOT_BREITEN = new Set([320, 375]);

interface ElementBefund {
  selektor: string;
  tag: string;
  klassen: string;
  text: string;
  rectRight: number;
  ueberstand: number;
}

interface Befund {
  seite: string;
  pfad: string;
  breite: number;
  htmlOverflow: boolean;
  scrollWidth: number;
  clientWidth: number;
  overflowVerdeckt: boolean; // overflow-x:hidden auf html/body trotz Overflow
  ueberstehendeElemente: ElementBefund[];
}

async function seitePruefen(page: Page, seite: { pfad: string; name: string }, breite: number): Promise<Befund> {
  await page.setViewportSize({ width: breite, height: HOEHE });
  await page.goto(`${BASIS}${seite.pfad}`, { waitUntil: 'load', timeout: 30000 });
  // Netzwerk-Ruhe zusätzlich versuchen (Bilder/Fonts), aber nicht blockieren,
  // falls die Seite dauerhaft aktive Verbindungen hält (z.B. Konfigurator).
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400); // CSS-Übergänge/Layout-Shift durch Web Fonts abklingen lassen

  // WICHTIG: Innerhalb von page.evaluate() dürfen KEINE benannten
  // Funktionen/Konstanten mit Funktionswert stehen (weder `function foo(){}`
  // noch `const foo = () => {}`) – tsx/esbuild fügt für benannte Funktionen
  // einen `__name(...)`-Hilfsaufruf ein, der nur im Node-Bündel existiert.
  // Playwright serialisiert den (bereits transformierten) Funktionskörper
  // 1:1 in den Browser-Kontext, wo `__name` dann undefiniert ist
  // (reproduzierbar: ReferenceError: __name is not defined, auch bei einer
  // trivialen `const x = () => 1`). Deshalb ausschließlich anonyme, inline
  // übergebene Arrow-Funktionen (z.B. als Argument von .map/.filter/.some)
  // und einfache Variablen ohne Funktionswert.
  const ergebnis = await page.evaluate(() => {
    const innerWidth = window.innerWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const htmlOverflow = scrollWidth > clientWidth + 1;

    const htmlOverflowX = getComputedStyle(document.documentElement).overflowX;
    const bodyOverflowX = getComputedStyle(document.body).overflowX;
    const overflowVerdeckt = htmlOverflow && (htmlOverflowX === 'hidden' || bodyOverflowX === 'hidden');

    const kandidaten: { el: Element; rect: DOMRect }[] = [];
    const alle = document.querySelectorAll('*');
    for (const el of Array.from(alle)) {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.right <= innerWidth + 1) continue;
      // Nur zählen, wenn das Element (teilweise) im sichtbaren Bereich
      // beginnt – sonst ist es vermutlich absichtlich off-canvas (Drawer,
      // Mobilmenü) und kein Layout-Fehler.
      if (rect.left >= innerWidth) continue;
      const stil = getComputedStyle(el);
      if (stil.display === 'none' || stil.visibility === 'hidden' || Number(stil.opacity) === 0) continue;
      kandidaten.push({ el, rect });
    }

    // Eltern-Element überspringen, wenn ein Kind praktisch denselben
    // Überstand hat (Rauschen durch verschachtelte Container reduzieren) –
    // wir behalten das INNERSTE Element mit dem jeweiligen Überstand.
    const behalten = kandidaten.filter((k1) => {
      return !kandidaten.some(
        (k2) => k2.el !== k1.el && k1.el.contains(k2.el) && Math.abs(k2.rect.right - k1.rect.right) <= 1
      );
    });

    behalten.sort((a, b) => b.rect.right - a.rect.right);

    const ueberstehendeElemente = behalten.slice(0, 12).map((k) => {
      const el = k.el;
      const rect = k.rect;
      const klassen = (el.className && typeof el.className === 'string' ? el.className : '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .join('.');
      const selektor = el.id ? `#${el.id}` : el.tagName.toLowerCase() + (klassen ? `.${klassen}` : '');
      return {
        selektor,
        tag: el.tagName.toLowerCase(),
        klassen: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 120),
        text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
        rectRight: Math.round(rect.right),
        ueberstand: Math.round(rect.right - innerWidth),
      };
    });

    return { htmlOverflow, scrollWidth, clientWidth, overflowVerdeckt, ueberstehendeElemente };
  });

  return {
    seite: seite.name,
    pfad: seite.pfad,
    breite,
    ...ergebnis,
  };
}

async function main(): Promise<void> {
  console.log('='.repeat(78));
  console.log(`RESPONSIVE-PRÜFUNG – ${SEITEN.length} Seite(n) × ${BREITEN.length} Breakpoint(s) gegen ${BASIS}`);
  console.log('='.repeat(78));

  mkdirSync('scripts/pruef/responsive', { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const alleBefunde: Befund[] = [];
  const start = Date.now();
  let n = 0;
  const gesamt = SEITEN.length * BREITEN.length;

  for (const seite of SEITEN) {
    for (const breite of BREITEN) {
      n++;
      try {
        const befund = await seitePruefen(page, seite, breite);
        alleBefunde.push(befund);

        const probleme: string[] = [];
        if (befund.htmlOverflow) {
          probleme.push(
            `HORIZONTALER OVERFLOW (scrollWidth=${befund.scrollWidth} > clientWidth=${befund.clientWidth}${
              befund.overflowVerdeckt ? ', overflow-x:hidden verdeckt Scrollbalken' : ''
            })`
          );
        }
        if (befund.ueberstehendeElemente.length > 0) {
          probleme.push(`${befund.ueberstehendeElemente.length} überstehende(s) Element(e)`);
        }

        const sek = ((Date.now() - start) / 1000).toFixed(0);
        console.log(
          `[${n}/${gesamt}] ${seite.name} @ ${breite}px · ${sek}s${probleme.length ? '  ✘ ' + probleme.join(' | ') : '  ok'}`
        );
        for (const el of befund.ueberstehendeElemente) {
          console.log(
            `      → ${el.selektor} rectRight=${el.rectRight} Überstand=${el.ueberstand}px Text="${el.text}"`
          );
        }

        if (SCREENSHOT_BREITEN.has(breite)) {
          const dateiname = `scripts/pruef/responsive/${seite.name}_${breite}.png`;
          await page.screenshot({ path: dateiname, fullPage: true }).catch((e) => {
            console.log(`      (Screenshot fehlgeschlagen: ${e instanceof Error ? e.message : String(e)})`);
          });
        }
      } catch (e) {
        console.log(`[${n}/${gesamt}] ${seite.name} @ ${breite}px · FEHLER: ${e instanceof Error ? e.message : String(e)}`);
        alleBefunde.push({
          seite: seite.name,
          pfad: seite.pfad,
          breite,
          htmlOverflow: false,
          scrollWidth: -1,
          clientWidth: -1,
          overflowVerdeckt: false,
          ueberstehendeElemente: [{ selektor: 'FEHLER', tag: '-', klassen: '', text: String(e), rectRight: -1, ueberstand: -1 }],
        });
      }
    }
  }

  await browser.close();

  const mitOverflow = alleBefunde.filter((b) => b.htmlOverflow || b.ueberstehendeElemente.length > 0);

  writeFileSync(
    'scripts/pruef/responsive-ergebnis.json',
    JSON.stringify(
      {
        geprueft: { seiten: SEITEN.length, breiten: BREITEN, kombinationen: gesamt },
        treffer: mitOverflow.length,
        befunde: alleBefunde,
        erzeugtAm: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log('\n' + '─'.repeat(78));
  console.log(`FERTIG: ${gesamt} Kombinationen geprüft, ${mitOverflow.length} mit Overflow/Überstand.`);
  console.log('Bericht: scripts/pruef/responsive-ergebnis.json');
  console.log(`Screenshots: scripts/pruef/responsive/*_320.png, *_375.png`);
  console.log('─'.repeat(78));
  if (mitOverflow.length > 0) process.exitCode = 1;
}

void main();
