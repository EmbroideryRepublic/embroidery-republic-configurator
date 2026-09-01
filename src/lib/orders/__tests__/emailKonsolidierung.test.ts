/**
 * ARCHITEKTURTEST für die E-Mail-Konsolidierung (Fund vom 2026-09-01, echter
 * PayPal-Live-Test): Bis dahin gingen für EIN Bestellereignis (Kartenzahlung/
 * PayPal, sofort bestätigt) DREI getrennte E-Mails raus –
 * Zahlungsbestätigung (paymentService.ts), Bestellbestätigung
 * (orderIntake.ts) und Rechnung (orderCompletion.ts::erzeugeRechnung), auch
 * wenn alle drei binnen Sekunden verschickt wurden. Für die Kundschaft wirkte
 * das wie Spam für ein einziges Ereignis.
 *
 * Jetzt: EINE Bestellbestätigung, die – sobald verfügbar – die bereits
 * fertige Rechnung als PDF mitschickt. Reine Quelltext-Prüfung statt Mocking,
 * nach demselben Muster wie phasentrennung.test.ts/bestaetigungRetry.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const COMPLETION = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderCompletion.ts');
const PAYMENT_SERVICE = path.join(process.cwd(), 'src', 'lib', 'orders', 'paymentService.ts');

function funktionsRumpf(datei: string, name: string): string {
  const inhalt = readFileSync(datei, 'utf8');
  const start = inhalt.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden in ${datei}`);
  const naechsteExport = inhalt.indexOf('\nexport async function', start + 1);
  const naechsteIntern = inhalt.indexOf('\nasync function', start + 1);
  const kandidaten = [naechsteExport, naechsteIntern].filter((n) => n > start);
  const ende = kandidaten.length > 0 ? Math.min(...kandidaten) : inhalt.length;
  return inhalt.slice(start, ende);
}

test('schliesseBestellungAb erstellt die Rechnung VOR der Kommunikation (nicht mehr danach)', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'schliesseBestellungAb');
  const rechnungStelle = rumpf.indexOf('erzeugeRechnung(');
  const kommunikationStelle = rumpf.indexOf('benachrichtige(');
  assert.ok(rechnungStelle > 0, 'erzeugeRechnung muss aufgerufen werden');
  assert.ok(kommunikationStelle > 0, 'benachrichtige muss aufgerufen werden');
  assert.ok(
    rechnungStelle < kommunikationStelle,
    'die Rechnung muss VOR der Kommunikation entstehen, damit die Bestellbestätigung sie mitschicken kann'
  );
});

test('das Ergebnis von erzeugeRechnung fließt in benachrichtige()', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'schliesseBestellungAb');
  assert.match(
    rumpf,
    /benachrichtige\([^)]*rechnungFuerEmail/,
    'benachrichtige() muss die Rechnungsdaten erhalten, um sie mitzuschicken'
  );
});

test('erzeugeRechnung verschickt bei einem übergebenen Callback KEINE eigene E-Mail mehr', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'erzeugeRechnung');
  // Der Versand darf nur noch im "sonst"-Zweig (Cron-Nachholpfad ohne
  // Callback) stehen – im Erfolgsfall mit Callback ruft die Funktion
  // ausschließlich onErstellt(...) auf.
  assert.match(rumpf, /if\s*\(onErstellt\)\s*\{/, 'der Callback-Zweig muss existieren');
  assert.match(rumpf, /onErstellt\(\{/, 'bei Erfolg müssen die Rechnungsdaten an den Callback übergeben werden');
});

test('bestaetigeZahlung() verschickt keine eigene Zahlungsbestätigungs-E-Mail mehr', () => {
  const rumpf = funktionsRumpf(PAYMENT_SERVICE, 'bestaetigeZahlung');
  assert.doesNotMatch(
    rumpf,
    /PaymentSucceededEmail/,
    'die Zahlungsbestätigung läuft jetzt als Teil der EINEN Bestellbestätigung (siehe OrderConfirmationEmail.tsx), nicht mehr separat'
  );
});

/**
 * Regressionstest für eine beim Zustandslogik-Audit vom 2026-09-01
 * gefundene Lücke: Schlägt beim ERSTEN Versuch nur der Bestätigungsversand
 * fehl, während die Rechnung im selben Lauf bereits erfolgreich erstellt
 * wurde, fand `holeOffeneRechnungenNach` diese Bestellung nie wieder
 * (Filter `invoice_id IS NULL` trifft nicht mehr zu) – die Kundschaft hätte
 * ihre Rechnung dann NIE per E-Mail bekommen. Der Nachhol-Versand muss die
 * bereits existierende Rechnung deshalb selbst nachladen.
 */
test('holeOffeneBestellbestaetigungenNach lädt eine bereits erstellte Rechnung nach, bevor es die Bestätigung erneut versucht', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'holeOffeneBestellbestaetigungenNach');
  const ladeStelle = rumpf.indexOf('ladeBereitsErstellteRechnungFuerEmail(');
  const versuchStelle = rumpf.indexOf('versucheBestellbestaetigung(order,');
  assert.ok(ladeStelle > 0, 'die bereits erstellte Rechnung muss nachgeladen werden');
  assert.ok(versuchStelle > 0, 'versucheBestellbestaetigung muss die nachgeladene Rechnung erhalten (zweites Argument)');
  assert.ok(
    ladeStelle < versuchStelle,
    'die Rechnung muss VOR dem Bestätigungsversand geladen sein, sonst kommt sie zu spät'
  );
});

test('ladeBereitsErstellteRechnungFuerEmail wirft nie – ein Nachlade-Fehler darf den Bestätigungsversand nicht blockieren', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'ladeBereitsErstellteRechnungFuerEmail');
  assert.match(rumpf, /catch\s*\(/, 'ein Download-Fehler muss abgefangen werden');
  assert.match(rumpf, /return null/, 'bei fehlender oder nicht ladbarer Rechnung muss null zurückgegeben werden, kein Wurf');
});

/**
 * Regressionstest für einen beim Go-Live-Abnahmetest vom 2026-09-01 durch
 * unabhängige Verifikation gefundenen Fund: Der eigenständige Nachtragspfad
 * (Cron-Rechnungs-Retry ohne onErstellt-Callback) verschickte Text UND
 * Anhang bisher UNGEPRÜFT, sobald erstelle() ohne Wurf zurückkehrte – anders
 * als sendOrderConfirmationEmail()s rechnungGeprueft-Gate (orderEmails.tsx),
 * das beide an DIESELBE echte-PDF-Prüfung koppelt. Kein beobachteter Bug
 * (der einzige verdrahtete Anbieter liefert nie einen leeren Puffer ohne zu
 * werfen), aber eine unbewachte Asymmetrie zur ausdrücklichen Anforderung
 * "Text und tatsächlicher Anhang müssen über dieselbe Gültigkeitsprüfung
 * abgesichert sein".
 */
test('erzeugeRechnung verschickt die eigenständige Nachtrags-Mail nur bei einem echten, nicht-leeren PDF-Puffer', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'erzeugeRechnung');
  assert.match(
    rumpf,
    /\}\s*else if\s*\(rechnung\.pdf\s*&&\s*rechnung\.pdf\.length\s*>\s*0\)\s*\{/,
    'der Nachtragspfad (Cron-Retry ohne Callback) muss denselben echte-Puffer-Schutz tragen wie sendOrderConfirmationEmail'
  );
  // Der Erfolgs-Anhang darf nur innerhalb dieses geprüften Zweigs stehen,
  // nicht mehr unbedingt im ursprünglichen "sonst"-Zweig.
  const geprueftStelle = rumpf.indexOf('else if (rechnung.pdf');
  const anhangStelle = rumpf.indexOf('attachments: [{ filename:');
  assert.ok(geprueftStelle > 0 && anhangStelle > geprueftStelle, 'der Anhang muss innerhalb des geprüften Zweigs verschickt werden');
});
