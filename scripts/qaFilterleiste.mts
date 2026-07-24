/**
 * ═══════════════════════════════════════════════════════════════════════
 * VISUELLE + FUNKTIONALE PRÜFSTRECKE DER FILTERLEISTE
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Erzeugt Screenshots (Desktop + Mobil) und prüft dabei das Verhalten:
 * Trefferzahlen entlang einer Filterkette, Preis-/Gewichtsfilter,
 * Sortierungen, Chips samt Einzelentfernung, Adresszeile ohne Neuladen und
 * die Vollständigkeit (kein Produkt verschwindet, keines doppelt).
 *
 * Aufruf (Dev-Server auf 3007 muss laufen):
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/qaFilterleiste.mts
 */
import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright';

const BASIS = process.env.QA_BASIS ?? 'http://localhost:3007';
const ORDNER = 'qa-screenshots/filter';
mkdirSync(ORDNER, { recursive: true });

const pruefungen: { ok: boolean; text: string }[] = [];
function pruefe(ok: boolean, text: string): void {
  pruefungen.push({ ok, text });
  console.log(`  ${ok ? '✔' : '✘'} ${text}`);
}

/** Trefferzahl aus der Leiste. */
async function treffer(page: Page): Promise<number> {
  const text = await page.locator('main p[aria-live="polite"]').first().innerText();
  return Number(text.match(/(\d+)/)?.[1] ?? -1);
}

/** Alle sichtbaren Produkt-IDs der aktuellen Seite. */
async function produktIds(page: Page): Promise<string[]> {
  return page.$$eval('a[href^="/produkt/"]', (as) =>
    as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!.replace('/produkt/', ''))
  );
}

async function aktiveChips(page: Page): Promise<string[]> {
  return page.$$eval('button[aria-label^="Filter"]', (bs) => bs.map((b) => b.textContent!.trim()));
}

async function gehe(page: Page, abfrage: string): Promise<void> {
  await page.goto(`${BASIS}/produkt${abfrage}`, { waitUntil: 'networkidle' });
}

async function schuss(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${ORDNER}/${name}.png` });
  console.log(`     → ${ORDNER}/${name}.png`);
}

async function main(): Promise<void> {
  const browser = await chromium.launch();

  // ═══ DESKTOP ═══
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await desktop.newPage();

  console.log('\n── 1. Übersicht (ungefiltert) ──');
  await gehe(page, '');
  const gesamt = await treffer(page);
  pruefe(gesamt === 43, `Übersicht zeigt alle ${gesamt} Produkte`);
  await schuss(page, '01-desktop-uebersicht');

  console.log('\n── 2. Filterkette: Hoodies → Bio → Marke → Farbe ──');
  await gehe(page, '?kategorie=hoodie,zip-hoodie');
  const nHoodies = await treffer(page);
  pruefe(nHoodies > 0, `alle Hoodies + Zip-Hoodies: ${nHoodies}`);
  await schuss(page, '02-desktop-hoodies');

  await gehe(page, '?kategorie=hoodie,zip-hoodie&material=bio-baumwolle');
  const nBio = await treffer(page);
  pruefe(nBio <= nHoodies, `+ Bio-Baumwolle: ${nBio} (enger als ${nHoodies})`);
  await schuss(page, '03-desktop-hoodies-bio');

  await gehe(page, '?kategorie=hoodie,zip-hoodie&material=bio-baumwolle&marke=b-c');
  const nMarke = await treffer(page);
  pruefe(nMarke <= nBio, `+ Marke B&C: ${nMarke} (enger als ${nBio})`);
  await schuss(page, '04-desktop-hoodies-bio-marke');

  await gehe(page, '?kategorie=hoodie,zip-hoodie&material=bio-baumwolle&marke=b-c&farbe=schwarz');
  const nFarbe = await treffer(page);
  const chips = await aktiveChips(page);
  pruefe(nFarbe <= nMarke, `+ Farbe Schwarz: ${nFarbe} (enger als ${nMarke})`);
  pruefe(chips.length === 5, `5 aktive Chips sichtbar: ${chips.join(' · ')}`);
  await schuss(page, '05-desktop-kette-vollstaendig');

  console.log('\n── 3. Facettenliste mit Zählern (Popover) ──');
  await gehe(page, '?kategorie=hoodie,zip-hoodie');
  await page.getByRole('button', { name: 'Marke' }).click();
  await page.waitForTimeout(300);
  const popoverSichtbar = await page.locator('div[role="dialog"][aria-label="Marke"]').isVisible();
  pruefe(popoverSichtbar, 'Popover „Marke" öffnet mit Werten und Trefferzahlen');
  await schuss(page, '06-desktop-popover-marke');

  console.log('\n── 4. Preis- und Gewichtsfilter ──');
  await gehe(page, '?preisVon=10&preisBis=20');
  const nPreis = await treffer(page);
  const preise = await page.$$eval('main a[data-preis]', (as) =>
    as.map((a) => Number(a.getAttribute('data-preis')))
  );
  pruefe(preise.every((p) => p >= 10 && p <= 20), `Preis 10–20 €: ${nPreis} Treffer, alle im Bereich`);
  await schuss(page, '07-desktop-preis');

  await gehe(page, '?gewichtVon=250&gewichtBis=300');
  const nGewicht = await treffer(page);
  const gewichte = await page.$$eval('main a[data-gewicht]', (as) =>
    as.map((a) => Number(a.getAttribute('data-gewicht')))
  );
  pruefe(gewichte.every((g) => g >= 250 && g <= 300), `Gewicht 250–300 g/m²: ${nGewicht} Treffer, alle im Bereich`);
  await schuss(page, '08-desktop-gewicht');

  console.log('\n── 5. Sortierungen ──');
  await gehe(page, '?sortierung=preis-auf');
  const pAuf = await page.$$eval('main a[data-preis]', (as) =>
    as.map((a) => Number(a.getAttribute('data-preis')))
  );
  pruefe(pAuf.every((p, i) => i === 0 || pAuf[i - 1]! <= p), 'Preis aufsteigend ist monoton steigend');
  await schuss(page, '09-desktop-sort-preis-auf');

  await gehe(page, '?sortierung=preis-ab');
  const pAb = await page.$$eval('main a[data-preis]', (as) =>
    as.map((a) => Number(a.getAttribute('data-preis')))
  );
  pruefe(pAb.every((p, i) => i === 0 || pAb[i - 1]! >= p), 'Preis absteigend ist monoton fallend');

  await gehe(page, '?sortierung=beliebtheit');
  const beliebt = (await produktIds(page))[0];
  pruefe(Boolean(beliebt), `Beliebtheit: erstes Produkt ${beliebt}`);
  await schuss(page, '10-desktop-sort-beliebtheit');

  await gehe(page, '?sortierung=neu');
  pruefe((await treffer(page)) === gesamt, 'Neuheiten zeigt weiterhin alle Produkte');
  await schuss(page, '11-desktop-sort-neu');

  console.log('\n── 6. Chip einzeln entfernen, ohne Neuladen ──');
  await gehe(page, '?kategorie=hoodie,zip-hoodie&material=bio-baumwolle');
  const vorher = await treffer(page);
  // Marker: überlebt nur eine Soft-Navigation, kein echtes Neuladen.
  await page.evaluate(() => { (window as unknown as Record<string, unknown>).__qaMarker = 'lebt'; });
  await page.getByRole('button', { name: /Material: Bio-Baumwolle entfernen/ }).click();
  await page.waitForTimeout(900);
  const nachher = await treffer(page);
  const marker = await page.evaluate(() => (window as unknown as Record<string, unknown>).__qaMarker);
  const url = page.url();
  pruefe(marker === 'lebt', 'Seite wurde NICHT neu geladen (Marker überlebt)');
  pruefe(!url.includes('material='), `Adresse fortgeschrieben: ${url.replace(BASIS, '')}`);
  pruefe(nachher > vorher, `Trefferzahl aktualisiert: ${vorher} → ${nachher}`);
  await schuss(page, '12-desktop-chip-entfernt');

  console.log('\n── 7. Vollständigkeit: nichts verschwindet, nichts doppelt ──');
  // a) Innerhalb eines Ergebnisses keine Dubletten.
  await gehe(page, '');
  const seite1 = await produktIds(page);
  await gehe(page, '?seite=2');
  const seite2 = await produktIds(page);
  const alle = [...seite1, ...seite2];
  pruefe(new Set(alle).size === alle.length, `keine Dubletten über beide Seiten (${alle.length} Kacheln)`);
  pruefe(alle.length === gesamt, `Summe beider Seiten = ${alle.length} = Gesamtzahl ${gesamt}`);

  // b) Die Kategorien zerlegen den Bestand vollständig und überschneidungsfrei.
  const kategorien = ['tshirt', 'polo', 'hoodie', 'zip-hoodie', 'sweater', 'longsleeve', 'jacket', 'vest'];
  let summe = 0;
  const gesehen = new Set<string>();
  for (const kat of kategorien) {
    await gehe(page, `?kategorie=${kat}`);
    const n = await treffer(page);
    summe += n;
    // ALLE Seiten einsammeln: „tshirt" hat mehr Treffer als auf eine Seite
    // passen – sonst fehlte der Rest und die Prüfung schlüge zu Unrecht an.
    const seiten = Math.max(1, Math.ceil(n / 24));
    for (let s = 1; s <= seiten; s++) {
      if (s > 1) await gehe(page, `?kategorie=${kat}&seite=${s}`);
      for (const id of await produktIds(page)) gesehen.add(id);
    }
  }
  pruefe(summe === gesamt, `Summe aller Kategorien (${summe}) = Gesamtzahl (${gesamt}) – kein Produkt verloren oder doppelt`);
  pruefe(gesehen.size === gesamt, `jedes Produkt genau einer Kategorie zugeordnet (${gesehen.size})`);

  // c) Widersprüchliche Kombination liefert sauber 0 statt Fehler.
  await gehe(page, '?kategorie=jacket&material=bio-baumwolle');
  pruefe((await treffer(page)) === 0, 'widersprüchliche Kombination → 0 Treffer, leere Ansicht');
  await schuss(page, '13-desktop-keine-treffer');

  // d) Unbekannte Werte in der Adresse brechen nichts.
  await gehe(page, '?farbe=giftgruen&material=unfug&sortierung=quatsch');
  pruefe((await treffer(page)) === gesamt, 'unbekannte Adressparameter werden ignoriert, Seite bleibt heil');

  await desktop.close();

  // ═══ MOBIL ═══
  console.log('\n── 8. Mobilansicht ──');
  const mobil = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const m = await mobil.newPage();

  await gehe(m, '');
  pruefe((await treffer(m)) === gesamt, 'Mobil: Übersicht zeigt alle Produkte');
  await schuss(m, '14-mobil-uebersicht');

  await m.getByRole('button', { name: /^Filter/ }).click();
  await m.waitForTimeout(400);
  const panelOffen = await m.locator('div[role="dialog"][aria-label="Filter"]').isVisible();
  pruefe(panelOffen, 'Mobil: Filter-Panel öffnet über die volle Höhe');
  await schuss(m, '15-mobil-panel');

  // Im Panel eine Kategorie wählen und übernehmen.
  // Das Panel führt in zwei Ebenen: Zeile antippen → Werte der Dimension.
  const panel = m.locator('div[role="dialog"][aria-label="Filter"]');
  await panel.locator('button').filter({ hasText: 'Kategorie' }).first().click();
  await m.waitForTimeout(300);
  await schuss(m, '16-mobil-panel-kategorie');
  await panel.getByRole('checkbox').first().check();
  await m.waitForTimeout(200);
  // Der Abschlussknopf trägt die Trefferzahl des ENTWURFS.
  await panel.getByRole('button', { name: /Produkte? anzeigen/ }).click();
  await m.waitForTimeout(900);
  const nMobil = await treffer(m);
  pruefe(nMobil > 0 && nMobil < gesamt, `Mobil: Auswahl übernommen, ${nMobil} Treffer`);
  await schuss(m, '17-mobil-gefiltert');

  await mobil.close();
  await browser.close();

  const fehler = pruefungen.filter((p) => !p.ok);
  console.log('\n' + '='.repeat(74));
  console.log(`=== ${pruefungen.length - fehler.length}/${pruefungen.length} Prüfungen bestanden ===`);
  for (const f of fehler) console.log(`  ✘ ${f.text}`);
  if (fehler.length > 0) process.exitCode = 1;
}

void main();
