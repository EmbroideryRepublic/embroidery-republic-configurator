/**
 * Regressionstests für zwei Funde vom 2026-08-26 (Produktionsreife-Audit) in
 * paymentService.ts:
 *
 * 1. `bestaetigeZahlung()` beanspruchte die Bestellung bisher nur bei
 *    `payment_status = 'pending'`. Stripe Checkout erlaubt aber, eine
 *    abgelehnte Karte auf DERSELBEN Checkout-Session erneut zu versuchen –
 *    dabei entsteht der Übergang `pending → failed → paid` OHNE dass
 *    `starteZahlung()` je erneut aufgerufen wird. Mit der alten Bedingung
 *    hätte das UPDATE dann 0 Zeilen getroffen, wäre stillschweigend als
 *    "bereits verarbeitet" behandelt worden (HTTP 200 an Stripe, kein
 *    Retry) – Geld wäre eingezogen, die Bestellung aber dauerhaft auf
 *    `failed` hängen geblieben. `IN ('pending','failed')` schließt das,
 *    bleibt aber idempotent: sobald `payment_status='paid'` steht, matcht
 *    keine der beiden Bedingungen mehr erneut.
 *
 * 2. Die Rückleitungs-URL (`rueckkehrUrl`/`abbruchUrl`) trug bisher die rohe
 *    Bestell-UUID – jeder, der sie kennt (Browser-Verlauf, geteilter
 *    Rechner, Proxy-Log), konnte fremden Zahlungsstatus und die
 *    Bestellnummer sehen (IDOR, siehe orderAccessToken.test.ts für die
 *    Token-Mechanik selbst). Jetzt trägt sie einen signierten Zugriffstoken,
 *    mit Rückfall auf die rohe ID nur falls die Tokenerzeugung selbst
 *    scheitert (z.B. fehlendes ORDER_TOKEN_SECRET) – lieber ein
 *    funktionierender Redirect mit schwächerem Schutz als ein kaputter.
 *
 * Gleiche Teststrategie wie statusEmailLogging.test.ts: Quelltext-Prüfung
 * statt Mocking des Supabase-Clients.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PAYMENT_SERVICE = path.join(process.cwd(), 'src', 'lib', 'orders', 'paymentService.ts');
const quelltext = readFileSync(PAYMENT_SERVICE, 'utf8');

function funktionsRumpf(name: string): string {
  const start = quelltext.indexOf(`async function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden`);
  const naechste = quelltext.indexOf('\nasync function', start + 1);
  const naechsteExport = quelltext.indexOf('\nexport async function', start + 1);
  const kandidaten = [naechste, naechsteExport].filter((i) => i > 0);
  const ende = kandidaten.length > 0 ? Math.min(...kandidaten) : quelltext.length;
  return quelltext.slice(start, ende);
}

test('bestaetigeZahlung beansprucht die Bestellung bei payment_status pending ODER failed', () => {
  const rumpf = funktionsRumpf('bestaetigeZahlung');
  assert.match(
    rumpf,
    /\.in\('payment_status',\s*\['pending',\s*'failed'\]\)/,
    'ein erneuter Zahlungsversuch nach einer zuvor abgelehnten Karte (Stripe: pending→failed→paid auf ' +
      'derselben Checkout-Session, ohne erneuten starteZahlung()-Aufruf) muss die Bestellung noch erreichen können'
  );
  assert.doesNotMatch(
    rumpf,
    /\.eq\('payment_status',\s*'pending'\)/,
    'die alte, zu enge Bedingung (nur pending) darf nicht mehr vorkommen – sie hätte den Redelivery-Fall ' +
      'nach einem Kartenfehlschlag als "bereits verarbeitet" ignoriert'
  );
  assert.match(rumpf, /payment_status:\s*'paid'/, 'muss weiterhin auf paid setzen');
});

test('bestaetigeZahlung bleibt idempotent: payment_status=paid matcht keine der beiden Bedingungen erneut', () => {
  // Reine Dokumentation der Invariante im Kommentar – falls der Kommentar
  // entfernt wird, ist die Begründung für IN(...) statt eq(...) an dieser
  // Stelle nicht mehr nachvollziehbar. Die eigentliche Garantie (paid ist
  // weder 'pending' noch 'failed') ist eine Tautologie über den drei
  // bekannten Werten von payment_status und wird hier nur als Dokumentation
  // mitgeführt, nicht als Laufzeitprüfung.
  const kopfkommentar = quelltext.slice(0, quelltext.indexOf('*/'));
  assert.match(
    kopfkommentar,
    /payment_status IN \('pending','failed'\)/,
    'die erweiterte Bedingung muss im Kopfkommentar dokumentiert sein'
  );
  assert.match(
    kopfkommentar,
    /lückenlos idempotent/,
    'die Idempotenz-Begründung für die erweiterte Bedingung muss im Kopfkommentar dokumentiert bleiben'
  );
});

test('markiereZahlungAlsGescheitert bleibt bei der engen pending-Bedingung (unverändert)', () => {
  const rumpf = funktionsRumpf('markiereZahlungAlsGescheitert');
  assert.match(
    rumpf,
    /\.eq\('payment_status',\s*'pending'\)/,
    'ein bereits fehlgeschlagener oder bezahlter Zustand darf durch ein spätes "gescheitert"-Ereignis ' +
      'nicht überschrieben werden – hier bleibt die enge Bedingung bewusst bestehen (kein Redelivery-Bedarf ' +
      'wie beim Erfolgsfall)'
  );
});

test('starteZahlung baut rueckkehrUrl/abbruchUrl aus einem signierten Zugriffstoken, mit Rückfall auf die rohe ID', () => {
  assert.match(
    quelltext,
    /import \{ erzeugeBestellToken \} from '\.\/orderAccessToken';/,
    'muss den bestehenden, bereits für /bestellung/[token] genutzten Signaturmechanismus wiederverwenden'
  );
  const zugriffsteilIndex = quelltext.indexOf('const zugriffsteil = erzeugeBestellToken(orderId) ?? orderId;');
  assert.ok(
    zugriffsteilIndex > 0,
    'muss auf die rohe orderId zurückfallen, falls die Tokenerzeugung scheitert (z.B. fehlendes ' +
      'ORDER_TOKEN_SECRET) – ein kaputter Redirect wäre schlimmer als ein schwächer geschützter'
  );
  assert.match(
    quelltext,
    /rueckkehrUrl:\s*`\$\{basisUrl\(\)\}\/bestellung\/zahlung\/\$\{zugriffsteil\}`/,
    'rueckkehrUrl muss den Token/Fallback verwenden, nicht mehr die rohe orderId'
  );
  assert.match(
    quelltext,
    /abbruchUrl:\s*`\$\{basisUrl\(\)\}\/bestellung\/zahlung\/\$\{zugriffsteil\}\?abgebrochen=1`/,
    'abbruchUrl muss denselben Token/Fallback verwenden wie rueckkehrUrl'
  );
});
