/**
 * Regressionstest für den Fund vom 2026-08-26 (Produktionsreife-Audit): die
 * Zahlungs-Rückleitungsseite (src/app/bestellung/zahlung/[orderId]/page.tsx)
 * nutzte die ROHE Bestell-UUID als URL-Baustein, ohne jede Zugriffsprüfung –
 * wer die UUID kennt (Browser-Verlauf, geteilter Rechner, Proxy-Log), konnte
 * fremden Zahlungsstatus und die Bestellnummer sehen (IDOR, geringe Schwere:
 * keine PII, nur Zahlungsstatus + ableitbare Bestellnummer).
 *
 * Behoben durch denselben signierten Zugriffstoken, der bereits für
 * `/bestellung/[token]` existiert (orderAccessToken.ts, siehe
 * orderAccessToken.test.ts für die Signaturmechanik selbst) – mit
 * befristetem Rückfall auf das rohe UUID-Format, damit zum Deploy-Zeitpunkt
 * bereits eröffnete Stripe/PayPal-Sitzungen (deren Rückkehr-URL vorher gebaut
 * wurde) nicht ins Leere laufen.
 *
 * Gleiche Teststrategie wie statusEmailLogging.test.ts: Quelltext-Prüfung
 * statt Rendering der Server-Component (kein Testing-Library-Setup in diesem
 * Projekt für Server Components).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SEITE = path.join(process.cwd(), 'src', 'app', 'bestellung', 'zahlung', '[orderId]', 'page.tsx');
const quelltext = readFileSync(SEITE, 'utf8');

test('aufgeloesteOrderId() prüft den Zugriffstoken zuerst, bevor sie auf eine rohe UUID zurückfällt', () => {
  const start = quelltext.indexOf('function aufgeloesteOrderId(');
  assert.ok(start > 0, 'aufgeloesteOrderId muss existieren');
  const rumpf = quelltext.slice(start, quelltext.indexOf('\n}', start));

  const tokenIndex = rumpf.indexOf('pruefeBestellToken(segment)');
  const uuidIndex = rumpf.indexOf('UUID_MUSTER.test(segment)');
  assert.ok(tokenIndex > 0 && uuidIndex > 0, 'beide Prüfungen müssen vorhanden sein');
  assert.ok(
    tokenIndex < uuidIndex,
    'der Token muss zuerst geprüft werden – die rohe UUID ist nur ein befristeter Übergangsweg, kein ' +
      'gleichwertiger zweiter Pfad'
  );
  assert.match(rumpf, /return null/, 'ein ungültiges Segment (weder Token noch UUID) muss null liefern, nicht werfen');
});

test('die Seite verwendet ausschließlich die aufgelöste orderId, nicht mehr params.orderId direkt', () => {
  assert.match(
    quelltext,
    /const orderId = aufgeloesteOrderId\(params\.orderId\);/,
    'die rohe URL muss durch aufgeloesteOrderId() laufen'
  );
  // Die einzige verbleibende Stelle mit `params.orderId` darf der Aufruf von
  // aufgeloesteOrderId() selbst sein – kein zweiter, ungeprüfter Gebrauch.
  const treffer = quelltext.match(/params\.orderId/g) ?? [];
  assert.equal(
    treffer.length,
    1,
    'params.orderId darf nur an EINER Stelle vorkommen (innerhalb von aufgeloesteOrderId()) – ' +
      'jede weitere Verwendung würde den Zugriffsschutz umgehen'
  );
});

test('die Datenbankabfrage ist auf orderId !== null gegated, kein Query mit null-ID', () => {
  const abfrageIndex = quelltext.indexOf(".from('orders')");
  assert.ok(abfrageIndex > 0, 'die orders-Abfrage muss existieren');
  const davor = quelltext.slice(Math.max(0, abfrageIndex - 300), abfrageIndex);
  assert.match(davor, /if \(orderId\)/, 'die Abfrage muss innerhalb eines if(orderId)-Blocks stehen');
});

test('ein ungültiges/fehlendes Segment zeigt neutral "ausstehend", verrät nicht WARUM (kein Orakel)', () => {
  assert.match(
    quelltext,
    /const anzeige = gefunden \? bestimmeAnzeige\(paymentStatus, abgebrochen\) : 'ausstehend';/,
    'ohne Treffer (ungültiger Token, falsches UUID-Format, Lesefehler) muss dieselbe neutrale Anzeige ' +
      'erscheinen wie bei einer echten, noch offenen Zahlung – sonst ließe sich aus der Antwort ablesen, ' +
      'ob eine ID gültig ist'
  );
});
