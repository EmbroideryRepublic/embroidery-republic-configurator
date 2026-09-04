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
import { readFileSync } from 'node:fs';
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

test('setzeBestellstatus lehnt new→in_production ohne freigabe_erteilt_am ab', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'setzeBestellstatus');
  assert.match(
    rumpf,
    /if \(nach === 'in_production' && !bestellung\.freigabe_erteilt_am\) \{\s*\n\s*return \{ ok: false, grund: 'freigabe-fehlt', aktuell: von \};/,
    'der Übergang nach in_production muss ohne erteilte Freigabe abgelehnt werden'
  );
  // Nur der Übergang NACH in_production ist betroffen – shipped/completed
  // können diesen Schritt laut Zustandsmaschine nie überspringen, eine
  // Prüfung dort wäre redundant und könnte fälschlich ältere Bestellungen
  // (freigabe_* dauerhaft null) blockieren.
  const treffer = rumpf.match(/!bestellung\.freigabe_erteilt_am/g) ?? [];
  assert.equal(treffer.length, 1, 'die Freigabeprüfung darf nur an genau einer Stelle (in_production) stehen');
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
