/**
 * ═══════════════════════════════════════════════════════════════════════
 * BARRIEREFREIHEITS-PRÜFUNG (WCAG 2.1 AA) – axe-core über alle Seiten-Templates
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Lädt dieselbe Seitenliste wie scripts/pruef/responsivePruefung.mts (ein
 * Vertreter je Templatetyp: Start, Katalog, mehrere Produktseiten,
 * Konfigurator, Konto-Anmeldung/Registrierung, Kontakt, FAQ, Rechtstexte)
 * und lässt axe-core (WCAG2A + WCAG2AA + WCAG2AAA-Regelsätze, gefiltert auf
 * mind. Level AA) darüber laufen. axe-core wird per page.addScriptTag aus
 * node_modules injiziert – kein Netzwerkzugriff nötig.
 *
 * Aufruf (Produktions-Server auf 3007 muss laufen – next build && next start):
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/pruef/a11yPruefung.mts
 *
 * Schreibt laufend nach stdout UND am Ende einen vollständigen JSON-Bericht
 * nach scripts/pruef/a11y-ergebnis.json.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const BASIS = process.env.QA_BASIS ?? 'http://localhost:3007';

// Dieselben Seiten-Templates wie responsivePruefung.mts, Desktop-Breite
// (1280px) – Kontrast/Struktur/ARIA sind breitenunabhängig, der
// Tastatur-/Fokus-Teil wird separat manuell über die Claude_Browser-MCP
// geprüft (siehe Bericht).
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
];

const BREITE = 1280;
const HOEHE = 900;

// Nur AA (inkl. A als Grundlage) auswerten – AAA-Regeln (z.B. 1.4.6
// Kontrast erhöht) sind laut Auftrag nicht Prüfmaßstab, würden aber sonst
// unter "best-practice"/"wcag2aaa" mitgeloggt und das Bild verzerren.
const RELEVANTE_TAGS = new Set(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

interface AxeKnotenBefund {
  html: string;
  ziel: string[];
  fehlerZusammenfassung?: string;
}

interface AxeRegelBefund {
  id: string;
  impact: string | null;
  beschreibung: string;
  hilfe: string;
  hilfeUrl: string;
  tags: string[];
  knoten: AxeKnotenBefund[];
}

interface SeitenBefund {
  seite: string;
  pfad: string;
  fehler: number;
  verstoesse: AxeRegelBefund[];
  fehlerBeimLaden?: string;
}

async function seitePruefen(page: Page, seite: { pfad: string; name: string }): Promise<SeitenBefund> {
  await page.setViewportSize({ width: BREITE, height: HOEHE });
  await page.goto(`${BASIS}${seite.pfad}`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);

  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });

  const ergebnis = await page.evaluate(async (relevanteTags: string[]) => {
    // @ts-expect-error – axe wird zur Laufzeit per addScriptTag global bereitgestellt
    const roh = await axe.run(document, {
      resultTypes: ['violations'],
    });
    const violations = roh.violations
      .map((v: any) => ({
        ...v,
        // Nur Tags behalten, die tatsächlich Level A/AA betreffen –
        // Regeln, die AUSSCHLIESSLICH best-practice/AAA sind, rausfiltern.
        istRelevant: v.tags.some((t: string) => relevanteTags.includes(t)),
      }))
      .filter((v: any) => v.istRelevant);
    return violations;
  }, Array.from(RELEVANTE_TAGS));

  const verstoesse: AxeRegelBefund[] = ergebnis.map((v: any) => ({
    id: v.id,
    impact: v.impact ?? null,
    beschreibung: v.description,
    hilfe: v.help,
    hilfeUrl: v.helpUrl,
    tags: v.tags,
    knoten: v.nodes.map((n: any) => ({
      html: String(n.html).slice(0, 300),
      ziel: n.target,
      fehlerZusammenfassung: n.failureSummary,
    })),
  }));

  return {
    seite: seite.name,
    pfad: seite.pfad,
    fehler: verstoesse.reduce((sum, v) => sum + v.knoten.length, 0),
    verstoesse,
  };
}

async function main(): Promise<void> {
  console.log('='.repeat(78));
  console.log(`A11Y-PRÜFUNG (axe-core, WCAG2 A/AA) – ${SEITEN.length} Seite(n) gegen ${BASIS}`);
  console.log('='.repeat(78));

  mkdirSync('scripts/pruef', { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const alleBefunde: SeitenBefund[] = [];
  let n = 0;

  for (const seite of SEITEN) {
    n++;
    try {
      const befund = await seitePruefen(page, seite);
      alleBefunde.push(befund);
      console.log(
        `[${n}/${SEITEN.length}] ${seite.name} (${seite.pfad})${
          befund.fehler ? `  ✘ ${befund.fehler} Knoten in ${befund.verstoesse.length} Regel(n)` : '  ok'
        }`
      );
      for (const v of befund.verstoesse) {
        console.log(`      → [${v.impact ?? '?'}] ${v.id}: ${v.hilfe} (${v.knoten.length}×) — ${v.tags.join(', ')}`);
        for (const k of v.knoten.slice(0, 5)) {
          console.log(`          · ${k.ziel.join(' ')} :: ${k.html}`);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`[${n}/${SEITEN.length}] ${seite.name} · FEHLER: ${msg}`);
      alleBefunde.push({ seite: seite.name, pfad: seite.pfad, fehler: 0, verstoesse: [], fehlerBeimLaden: msg });
    }
  }

  await browser.close();

  const gesamtFehler = alleBefunde.reduce((sum, b) => sum + b.fehler, 0);

  writeFileSync(
    'scripts/pruef/a11y-ergebnis.json',
    JSON.stringify(
      {
        geprueft: { seiten: SEITEN.length, breite: BREITE, relevanteTags: Array.from(RELEVANTE_TAGS) },
        gesamtFehler,
        befunde: alleBefunde,
        erzeugtAm: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log('\n' + '─'.repeat(78));
  console.log(`FERTIG: ${SEITEN.length} Seiten geprüft, ${gesamtFehler} axe-Verstöße (Knotenebene) gefunden.`);
  console.log('Bericht: scripts/pruef/a11y-ergebnis.json');
  console.log('─'.repeat(78));
  if (gesamtFehler > 0) process.exitCode = 1;
}

void main();
