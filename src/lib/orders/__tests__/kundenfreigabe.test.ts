/**
 * Absicherung der Kundenfreigabe (siehe FAQ: "Vor Produktionsstart erhalten
 * Sie eine finale Vorschau zur Freigabe") – der verbindliche Schritt, der
 * `orders.freigabe_erteilt_am` setzt und `setzeBestellstatus()` zusätzlich
 * gegen den Übergang nach 'in_production' ohne Freigabe absichert.
 *
 * Gleiche Teststrategie wie statusEmailLogging.test.ts/statusmailErneutSenden.test.ts:
 * Quelltext-Prüfung statt Mocking des Supabase-Clients – etabliertes Muster
 * für diese DB-nahen Dateien in diesem Projekt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ORDER_SERVICE = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderService.ts');
const ORDER_VISIBILITY = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderVisibility.ts');
const STATUS_ACTIONS = path.join(process.cwd(), 'src', 'lib', 'actions', 'orderStatusActions.ts');
const PROOF_REQUEST_ACTIONS = path.join(process.cwd(), 'src', 'lib', 'actions', 'proofRequestActions.ts');

const serviceQuelltext = readFileSync(ORDER_SERVICE, 'utf8');
const visibilityQuelltext = readFileSync(ORDER_VISIBILITY, 'utf8');
const statusActionsQuelltext = readFileSync(STATUS_ACTIONS, 'utf8');
const proofRequestActionsQuelltext = readFileSync(PROOF_REQUEST_ACTIONS, 'utf8');

function funktionsRumpf(quelltext: string, name: string): string {
  const start = quelltext.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden`);
  const naechste = quelltext.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? quelltext.slice(start, naechste) : quelltext.slice(start);
}

test('setzeBestellstatus lehnt new→in_production ohne freigabe_erteilt_am ab – außer der Betreiber startet ausdrücklich ohne Freigabe', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'setzeBestellstatus');
  assert.match(
    rumpf,
    /if \(nach === 'in_production' && !bestellung\.freigabe_erteilt_am && !optionen\.ohneKundenfreigabe\) \{\s*\n\s*return \{ ok: false, grund: 'freigabe-fehlt', aktuell: von \};/,
    'der Übergang nach in_production muss ohne erteilte Freigabe abgelehnt werden, wenn nicht ausdrücklich ohne Freigabe gestartet wird'
  );
  // Nur der Übergang NACH in_production ist betroffen – shipped/completed
  // können diesen Schritt laut Zustandsmaschine nie überspringen, eine
  // Prüfung dort wäre redundant und könnte fälschlich ältere Bestellungen
  // (freigabe_* dauerhaft null) blockieren.
  const stellen = rumpf.split('\n').filter((zeile) => zeile.includes('!bestellung.freigabe_erteilt_am'));
  assert.ok(stellen.length >= 1);
  for (const zeile of stellen) {
    assert.match(zeile, /nach === 'in_production'/, `die Freigabeprüfung darf nur den Übergang nach in_production betreffen: ${zeile.trim()}`);
  }
});

// ── Betreiber-Ausnahme „Ohne Kundenfreigabe starten“ ──────────────────────
// Der Betreiber darf die Produktion ausdrücklich ohne Freigabe der Druckvorschau starten (z. B. Zustimmung per Telefon).
// Das ist eine bewusste, protokollierte Ausnahme – kein stilles Umgehen der Prüfung.

const aktionenQuelltext = statusActionsQuelltext;
const kontrolleQuelltext = readFileSync(path.join(process.cwd(), 'src', 'components', 'admin', 'OrderStatusControl.tsx'), 'utf8');
const detailSeiteQuelltext = readFileSync(path.join(process.cwd(), 'src', 'app', 'admin', 'bestellung', '[id]', 'page.tsx'), 'utf8');

test('Ausnahme gilt nur bei ausdrücklichem true, nur nach in_production und nur, wenn die Freigabe wirklich fehlt', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'setzeBestellstatus');
  assert.match(
    rumpf,
    /const ohneFreigabeGestartet = nach === 'in_production' && !bestellung\.freigabe_erteilt_am && optionen\.ohneKundenfreigabe === true;/
  );
});

test('die Ausnahme umgeht weder Stornofrist noch Zahlungsprüfung (die stehen davor und lehnen unabhängig ab)', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'setzeBestellstatus');
  const frist = rumpf.indexOf("grund: 'noch-nicht-freigegeben'");
  const ausnahme = rumpf.indexOf('const ohneFreigabeGestartet');
  const uebergang = rumpf.indexOf("grund: 'uebergang-unzulaessig'");
  assert.ok(uebergang > 0 && frist > uebergang && ausnahme > frist, 'Reihenfolge: Übergang erlaubt → Stornofrist/Zahlung → Freigabe-Ausnahme');
});

test('die Ausnahme steht im Verlauf (reason + detail.ohneKundenfreigabe) und setzt freigabe_erteilt_am NICHT', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'setzeBestellstatus');
  assert.match(rumpf, /OHNE Freigabe der Druckvorschau durch die Kundschaft/);
  assert.match(rumpf, /ohneKundenfreigabe: true/);
  assert.ok(!/patch\.freigabe_erteilt_am|freigabe_erteilt_am:\s*jetzt/.test(rumpf), 'der Zustand „nie freigegeben“ darf nicht verfälscht werden');
});

test('Server Action: nur Admins, Flag nur für in_production und nur bei ausdrücklichem true', () => {
  const start = aktionenQuelltext.indexOf('export async function aendereBestellstatus');
  const ende = aktionenQuelltext.indexOf('export async function', start + 10);
  const rumpf = aktionenQuelltext.slice(start, ende);
  assert.ok(rumpf.indexOf('istAdmin()') > 0 && rumpf.indexOf('istAdmin()') < rumpf.indexOf('setzeBestellstatus('), 'Adminprüfung vor dem Statuswechsel');
  assert.match(rumpf, /nach === 'in_production' && ohneKundenfreigabe === true \? \{ ohneKundenfreigabe: true \} : \{\}/);
  assert.match(rumpf, /Ohne Kundenfreigabe starten/, 'die Fehlermeldung nennt den Weg über das Häkchen');
});

test('Steuerelement: Häkchen nur bei fehlender Freigabe, „In Produktion“ bleibt bis zum Häkchen gesperrt, Flag geht nur dann mit', () => {
  assert.match(kontrolleQuelltext, /freigabeErteilt = true/, 'Standard = bisheriges Verhalten');
  assert.match(kontrolleQuelltext, /const fehlendeFreigabe = !freigabeErteilt && naechste\.includes\('in_production'\);/);
  assert.match(kontrolleQuelltext, /Ohne Kundenfreigabe starten/);
  assert.match(kontrolleQuelltext, /disabled=\{laeuft \|\| \(s === 'in_production' && fehlendeFreigabe && !ohneFreigabe\)\}/);
  assert.match(kontrolleQuelltext, /nach === 'in_production' && fehlendeFreigabe \? ohneFreigabe : undefined/);
});

test('Bestell-Detailseite gibt den Freigabe-Zustand an die Statussteuerung', () => {
  assert.match(detailSeiteQuelltext, /freigabeErteilt=\{Boolean\(order\.freigabeErteiltAm\)\}/);
});

test('„ohneKundenfreigabe“ kommt im Programmcode nur im Dienst und in der Admin-Server-Action vor (die Oberfläche reicht nur das Häkchen durch)', () => {
  const treffer: string[] = [];
  const suche = (ordner: string) => {
    for (const e of readdirSync(ordner, { withFileTypes: true })) {
      const voll = path.join(ordner, e.name);
      if (e.isDirectory()) { if (e.name !== '__tests__' && e.name !== 'node_modules') suche(voll); continue; }
      if (/\.(ts|tsx)$/.test(e.name) && readFileSync(voll, 'utf8').includes('ohneKundenfreigabe')) treffer.push(path.relative(process.cwd(), voll).split(path.sep).join('/'));
    }
  };
  suche(path.join(process.cwd(), 'src'));
  assert.deepEqual(treffer.sort(), ['src/lib/actions/orderStatusActions.ts', 'src/lib/orders/orderService.ts']);
});

test('setzeBestellstatus lädt freigabe_erteilt_am mit und die freigabe-fehlt-Prüfung steht NACH der Stornofrist-/Zahlungsprüfung', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'setzeBestellstatus');
  const selectIndex = rumpf.indexOf(".from('orders')");
  const selectEnde = rumpf.indexOf(');', selectIndex);
  assert.match(rumpf.slice(selectIndex, selectEnde), /freigabe_erteilt_am/);

  const fristIndex = rumpf.indexOf("grund: 'noch-nicht-freigegeben'");
  const freigabeIndex = rumpf.indexOf("grund: 'freigabe-fehlt'");
  assert.ok(fristIndex > 0 && freigabeIndex > 0 && fristIndex < freigabeIndex);
});

test("StatusErgebnis kennt den Ablehnungsgrund 'freigabe-fehlt' und orderStatusActions.ts hat einen passenden Text dafür", () => {
  assert.match(serviceQuelltext, /'nicht-gefunden' \| 'uebergang-unzulaessig' \| 'noch-nicht-freigegeben' \| 'freigabe-fehlt' \| 'fehler'/);
  assert.match(statusActionsQuelltext, /'freigabe-fehlt':\s*'[^']+'/);
});

test('sendeVorschauFreigabeAnfrage setzt freigabe_angefragt_am, nutzt den signierten Bestellansicht-Token und verschickt über protokolliereVersand', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'sendeVorschauFreigabeAnfrage');
  assert.match(rumpf, /erzeugeBestellToken\(orderId\)/, 'muss denselben signierten Link wie die Bestellbestätigung nutzen');
  assert.match(rumpf, /if \(!token\)/, 'ein nicht erzeugbarer Token (ORDER_TOKEN_SECRET fehlt) muss abgefangen werden, statt eine Mail ohne Link zu verschicken');
  assert.match(rumpf, /freigabe_angefragt_am: jetzt\.toISOString\(\)/);
  assert.match(rumpf, /eventType: 'proof_requested'/);
  assert.match(rumpf, /protokolliereVersand\(orderId, 'order_proof_request'/);
  assert.match(rumpf, /sendOrderProofRequestEmail\(/);
});

test('freigebeVorschauDurchKunden lehnt eine nie angefragte Freigabe ab und ist gegen einen doppelten Effekt abgesichert', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'freigebeVorschauDurchKunden');
  assert.match(rumpf, /if \(!bestellung\.freigabe_angefragt_am\) return \{ ok: false, grund: 'nicht-angefragt' \};/);
  assert.match(rumpf, /if \(bestellung\.freigabe_erteilt_am\) return \{ ok: true, bereitsErteilt: true \};/);
  assert.match(
    rumpf,
    /\.is\('freigabe_erteilt_am', null\)/,
    'das UPDATE muss bedingt sein – schützt gegen zwei gleichzeitige Freigabe-Klicks (zweiter Tab, Doppelklick)'
  );
  assert.match(rumpf, /eventType: 'proof_approved'/);
  assert.match(rumpf, /sendProofFeedbackEmail\(\{[\s\S]*?art: 'freigegeben'/);
});

test('wuenscheAenderungDurchKunden setzt KEINEN Freigabe-Zeitstempel, nur ein Ereignis mit Kommentar', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'wuenscheAenderungDurchKunden');
  assert.doesNotMatch(
    rumpf,
    /freigabe_erteilt_am:/,
    'ein Änderungswunsch ist reines Kommunikationssignal – er darf den Produktionsschritt nicht freischalten'
  );
  assert.match(rumpf, /eventType: 'proof_change_requested'/);
  assert.match(rumpf, /detail: \{ kommentar \}/);
  assert.match(rumpf, /sendProofFeedbackEmail\(\{[\s\S]*?art: 'aenderung_gewuenscht'/);
});

test('orderVisibility.ts (produktionsfreigabeErlaubt/enqueueSupplierOrdersForOrder-Gate) bleibt von der Kundenfreigabe unberührt', () => {
  // Die Lieferanten-/Textilbestellung soll unabhängig vom Motiv-Freigabe-
  // status weiterlaufen können – siehe Kopfkommentar von setzeBestellstatus's
  // freigabe-fehlt-Prüfung. Der Funktionsname produktionsfreigabeErlaubt()
  // enthält selbst "freigabe" (falscher Alarm bei einer reinen Substring-
  // Prüfung) – hier geht es gezielt um die NEUEN Kundenfreigabe-Felder, die
  // hier nicht auftauchen dürfen: SichtbarkeitsEingabe darf kein
  // freigabe_erteilt_am/freigabeErteiltAm kennen.
  assert.doesNotMatch(visibilityQuelltext, /freigabe_erteilt_am|freigabeErteiltAm|freigabe_angefragt_am|freigabeAngefragtAm/);
});

test('proofRequestActions.ts prüft istAdmin() und leitet an sendeVorschauFreigabeAnfrage weiter', () => {
  assert.match(proofRequestActionsQuelltext, /if \(!\(await istAdmin\(\)\)\)/);
  assert.match(proofRequestActionsQuelltext, /await sendeVorschauFreigabeAnfrage\(orderId\)/);
  assert.match(proofRequestActionsQuelltext, /revalidatePath\(`\/admin\/bestellung\/\$\{orderId\}`\)/);
});
