/**
 * Prüfstrecke für den gehärteten Bestellabschluss (Playwright).
 *
 * Weist im ECHTEN Browser nach, was Unit-Tests nicht zeigen können:
 *
 *   1. Mehrfachklick erzeugt genau EINEN Absendevorgang.
 *   2. Ein Fehlschlag wird der Kundschaft sichtbar und verständlich gemeldet.
 *   3. Die Wiederholung nach einem Fehlschlag benutzt DIESELBE Absendekennung
 *      – nur dadurch kann der Server sie als Wiederholung erkennen, statt eine
 *      zweite Bestellung anzulegen.
 *   4. Nach dem Fehlschlag ist der Knopf wieder bedienbar (keine Sackgasse).
 *
 * WICHTIG – keine echte Bestellung: Alle Absende-Requests werden im Browser
 * abgefangen und NICHT an den Server durchgelassen. Das Skript kann deshalb
 * gefahrlos gegen eine Umgebung mit echten Zugangsdaten laufen; es entsteht
 * weder ein Datenbankeintrag noch eine E-Mail.
 *
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║ DIESES SKRIPT PRÜFT NUR DIE BROWSERSEITE.                         ║
 * ║                                                                   ║
 * ║ Weil es jeden Request abfängt, läuft der SERVERPFAD nie mit.      ║
 * ║ Ein grünes Ergebnis sagt NICHTS darüber, ob eine Bestellung       ║
 * ║ tatsächlich gespeichert werden kann. Genau diese Lücke ließ eine  ║
 * ║ fehlende Migration wochenlang unbemerkt: jede echte Bestellung    ║
 * ║ scheiterte, während hier „10/10 bestanden" stand.                 ║
 * ║                                                                   ║
 * ║ Für den vollständigen Ablauf: npm run test:e2e                    ║
 * ║ (scripts/e2eBestellung.mts – echter Serverpfad, echte Datenbank,  ║
 * ║  externe Wirkungen über den Testmodus abgefangen).                ║
 * ║ BEIDE gehören zur Abnahme; keines ersetzt das andere.             ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/qaBestellabschluss.mts
 */
import { chromium, type Route, type Request } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import path from 'node:path';

const BASIS = 'http://localhost:3007';
const OUT = 'qa-screenshots/bestellabschluss';
mkdirSync(OUT, { recursive: true });

const ergebnisse: { pruefung: string; bestanden: boolean; text: string }[] = [];
function pruefe(pruefung: string, bestanden: boolean, text: string) {
  ergebnisse.push({ pruefung, bestanden, text });
  console.log(`  ${bestanden ? '✔' : '✘'} ${pruefung}: ${text}`);
}

const LOGO = path.join(OUT, '_testlogo.png');
await sharp({ create: { width: 400, height: 300, channels: 4, background: { r: 0, g: 90, b: 200, alpha: 1 } } })
  .png()
  .toFile(LOGO);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();

// ── Absende-Requests abfangen ───────────────────────────────────────────
// Server Actions sind POSTs auf die aktuelle Seite mit dem Header
// "next-action". Sie werden gesammelt und gezielt beantwortet – nie
// weitergeleitet.
const abgefangen: { zeit: number; body: string }[] = [];
let modus: 'sammeln_haengen' | 'sammeln_fehler' = 'sammeln_haengen';
const haengende: Route[] = [];

function istAbsendung(request: Request): boolean {
  return request.method() === 'POST' && Boolean(request.headers()['next-action']);
}

await page.route('**/*', async (route) => {
  const request = route.request();
  if (!istAbsendung(request)) return route.continue();

  abgefangen.push({ zeit: Date.now(), body: request.postData() ?? '' });
  if (modus === 'sammeln_haengen') {
    // Antwort bewusst offenlassen: simuliert eine noch laufende Absendung.
    haengende.push(route);
    return;
  }
  // Verbindungsabbruch simulieren.
  return route.abort('connectionfailed');
});

async function screenshot(name: string) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
}

// ── Warenkorb befüllen (echter Kundenweg) ───────────────────────────────
console.log('\n── Warenkorb befüllen ──');
await page.goto(`${BASIS}/?produkt=fotl-valueweight-t`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('canvas', { timeout: 30000 });
await page.waitForTimeout(900);

await page.locator('input[type="file"]').first().setInputFiles(LOGO);
await page.waitForTimeout(1800);

// Menge je Größe: Zahlenfeld in der Größentabelle (SizeQuantityTable).
const mengenfeld = page.locator('input[type="number"]').first();
await mengenfeld.waitFor({ timeout: 15000 });
await mengenfeld.fill('3');
await page.waitForTimeout(600);

// Exakter Text – ein unscharfes Muster trifft sonst den Warenkorb-Knopf in
// der Kopfzeile und öffnet nur das (leere) Panel.
await page.getByRole('button', { name: 'In den Warenkorb', exact: true }).first().click();
await page.waitForTimeout(1800);
await screenshot('01-warenkorb');

// ── Zur Kasse ───────────────────────────────────────────────────────────
console.log('\n── Zur Kasse ──');
const zurKasse = page.getByRole('button', { name: 'Zur Kasse', exact: true }).first();
if (!(await zurKasse.count())) {
  // Panel öffnet sich nicht von selbst → über die Kopfzeile öffnen.
  await page.getByRole('button', { name: /Warenkorb/i }).first().click();
  await page.waitForTimeout(1000);
}
await zurKasse.waitFor({ timeout: 15000 });
await zurKasse.click();
await page.waitForTimeout(1500);
await screenshot('02-checkout');

// Formular ausfüllen.
const felder: [RegExp, string][] = [
  [/Vorname/i, 'Alex'],
  [/Nachname/i, 'Beispiel'],
  [/E-?Mail/i, 'qa-test@example.de'],
  [/Straße|Strasse/i, 'Musterweg 1'],
  [/PLZ|Postleitzahl/i, '12345'],
  [/Stadt|Ort/i, 'Musterstadt'],
];
for (const [muster, wert] of felder) {
  const feld = page.getByPlaceholder(muster).first();
  if (await feld.count()) await feld.fill(wert);
}
const agb = page.locator('input[type="checkbox"]').first();
if (await agb.count()) await agb.check();
await page.waitForTimeout(400);
await screenshot('03-formular-ausgefuellt');

const absenden = page.getByRole('button', { name: /Zahlungspflichtig bestellen|Wird verarbeitet/i }).last();
const bereit = await absenden.isEnabled();
pruefe('Formular absendebereit', bereit, bereit ? 'Absendeknopf ist aktiv' : 'Absendeknopf blieb gesperrt – Formular unvollständig?');

if (!bereit) {
  writeFileSync(path.join(OUT, '_ergebnisse.json'), JSON.stringify(ergebnisse, null, 2));
  await browser.close();
  process.exit(1);
}

// ── PRÜFUNG 1: Mehrfachklick ────────────────────────────────────────────
console.log('\n── Prüfung 1: Mehrfachklick ──');
abgefangen.length = 0;
// Drei Klicks so schnell wie möglich – schneller, als React neu zeichnen kann.
await absenden.click({ force: true });
await absenden.click({ force: true }).catch(() => {});
await absenden.click({ force: true }).catch(() => {});
await page.waitForTimeout(2500);

pruefe(
  'Mehrfachklick erzeugt nur einen Absendevorgang',
  abgefangen.length === 1,
  `${abgefangen.length} Absendevorgang/-vorgänge bei 3 Klicks`
);

const gesperrt = await absenden.isDisabled();
pruefe('Knopf während der Absendung gesperrt', gesperrt, gesperrt ? 'gesperrt' : 'weiterhin klickbar');
await screenshot('04-absendung-laeuft');

const ersteKennung = kennungAus(abgefangen[0]?.body ?? '');
pruefe('Absendekennung wird mitgeschickt', Boolean(ersteKennung), ersteKennung ?? 'KEINE gefunden');

// ── PRÜFUNG 2: Verbindungsabbruch ───────────────────────────────────────
console.log('\n── Prüfung 2: Verbindungsabbruch ──');
modus = 'sammeln_fehler';
for (const route of haengende) await route.abort('connectionfailed').catch(() => {});
haengende.length = 0;
await page.waitForTimeout(2500);

const meldung = await fehlermeldung();
pruefe('Fehlschlag wird sichtbar gemeldet', Boolean(meldung), meldung ? `„${meldung.slice(0, 90)}…"` : 'KEINE Meldung sichtbar');
pruefe(
  'Meldung ist verständlich (kein technischer Text)',
  Boolean(meldung) && !/undefined|null|Error|fetch|TypeError|\[object/i.test(meldung!),
  meldung ? 'keine technischen Begriffe' : 'entfällt'
);

const wiederBedienbar = await absenden.isEnabled();
pruefe('Knopf nach Fehlschlag wieder bedienbar', wiederBedienbar, wiederBedienbar ? 'bedienbar' : 'bleibt gesperrt – Sackgasse');
await screenshot('05-fehlermeldung');

// ── PRÜFUNG 3: Wiederholung nutzt dieselbe Kennung ──────────────────────
console.log('\n── Prüfung 3: Wiederholung ──');
abgefangen.length = 0;
await absenden.click({ force: true });
await page.waitForTimeout(2500);

const zweiteKennung = kennungAus(abgefangen[0]?.body ?? '');
pruefe(
  'Wiederholung verwendet dieselbe Absendekennung',
  Boolean(ersteKennung) && ersteKennung === zweiteKennung,
  ersteKennung === zweiteKennung ? `unverändert (${zweiteKennung})` : `WEICHT AB: ${ersteKennung} → ${zweiteKennung}`
);
await screenshot('06-wiederholung');

// ── PRÜFUNG 4: Neuladen der Seite ───────────────────────────────────────
// Der praxisnächste Fall: die Verbindung bricht ab, und statt erneut zu
// klicken lädt die Kundschaft die Seite neu. Läge die Kennung nur im
// Formular, wäre sie jetzt verloren und es entstünde eine ZWEITE Bestellung.
console.log('\n── Prüfung 4: Neuladen der Seite ──');
const kennungVorNeuladen = await kennungAusSpeicher();
pruefe(
  'Absendekennung wird dauerhaft gespeichert',
  kennungVorNeuladen === ersteKennung,
  kennungVorNeuladen ? `im Speicher: ${kennungVorNeuladen}` : 'NICHT im Speicher abgelegt'
);

await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

const kennungNachNeuladen = await kennungAusSpeicher();

pruefe(
  'Absendekennung überlebt das Neuladen der Seite',
  Boolean(kennungNachNeuladen) && kennungNachNeuladen === ersteKennung,
  kennungNachNeuladen
    ? kennungNachNeuladen === ersteKennung
      ? `unverändert (${kennungNachNeuladen})`
      : `WEICHT AB: ${ersteKennung} → ${kennungNachNeuladen}`
    : 'nach dem Neuladen NICHT mehr vorhanden – eine Wiederholung würde eine zweite Bestellung erzeugen'
);
await screenshot('07-nach-neuladen');

// ── Ergebnis ────────────────────────────────────────────────────────────
writeFileSync(path.join(OUT, '_ergebnisse.json'), JSON.stringify(ergebnisse, null, 2));
const durchgefallen = ergebnisse.filter((e) => !e.bestanden);
console.log(`\n=== ${ergebnisse.length - durchgefallen.length}/${ergebnisse.length} Prüfungen bestanden ===`);
for (const e of durchgefallen) console.log(`  ✘ ${e.pruefung}: ${e.text}`);

await browser.close();
process.exit(durchgefallen.length === 0 ? 0 : 1);

// ── Hilfsfunktionen ─────────────────────────────────────────────────────

/** Liest die Absendekennung aus dem serialisierten Server-Action-Body. */
function kennungAus(body: string): string | null {
  // GEZIELT das Feld clientRequestId lesen. Ein blosses UUID-Muster greift
  // daneben: der Body enthaelt auch die Warenkorb-Positions-ID, die ebenfalls
  // eine UUID ist und im Text frueher steht.
  // Server-Action-Bodies sind teils doppelt maskiert – beide Formen zulassen.
  const treffer = body.match(/clientRequestId\\?":\\?"([^"\\]+)/);
  return treffer ? treffer[1]! : null;
}

/** Liest die dauerhaft abgelegte Absendekennung (siehe useSubmitGuard). */
async function kennungAusSpeicher(): Promise<string | null> {
  return page.evaluate(() => window.localStorage.getItem('er-absendung-bestellung'));
}

/** Sucht die angezeigte Fehlermeldung im Formular. */
async function fehlermeldung(): Promise<string | null> {
  return page.evaluate(() => {
    const kandidaten = [...document.querySelectorAll<HTMLElement>('[role="alert"], [class*="red"], [class*="error"]')];
    for (const el of kandidaten) {
      const text = el.innerText?.trim();
      if (text && text.length > 20) return text;
    }
    return null;
  });
}
