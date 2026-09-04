/**
 * IDOR-Absicherung der Kundenfreigabe-Server-Actions (freigebeVorschauAction/
 * wuenscheAenderungAction) – dasselbe Sicherheitsmuster wie
 * orderCancellation.ts::storniereBestellungAction: die Bestell-ID kommt NIE
 * direkt vom Client, sondern wird bei 'token' aus dem signierten Token und
 * bei 'konto' über pruefeBestellzugriff() gegen die serverseitige Sitzung
 * aufgelöst.
 *
 * Gleiche Teststrategie wie die übrigen Server-Action-/orderService-Tests in
 * diesem Projekt: Quelltext-Prüfung statt Mocking des Supabase-Clients.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DATEI = path.join(process.cwd(), 'src', 'lib', 'actions', 'proofApproval.ts');
const quelltext = readFileSync(DATEI, 'utf8');

function funktionsRumpf(name: string): string {
  const start = quelltext.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden`);
  const naechste = quelltext.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? quelltext.slice(start, naechste) : quelltext.slice(start);
}

test('loeseZugriffAuf nutzt für den Konto-Pfad die Kunden-ID aus der Sitzung, nicht eine vom Client mitgeschickte ID', () => {
  const rumpf = funktionsRumpf('loeseZugriffAuf');
  assert.match(rumpf, /const kunde = await aktuellerKunde\(\);/);
  assert.match(
    rumpf,
    /pruefeBestellzugriff\(\{ art: 'konto', kundenId: kunde\.id, orderId: anfrage\.orderId \}\)/,
    'pruefeBestellzugriff muss serverseitig prüfen, ob die vom Client übergebene Bestell-ID wirklich diesem Konto gehört'
  );
});

test('loeseZugriffAuf nutzt für den Token-Pfad ausschließlich die Signaturprüfung, keine rohe ID', () => {
  const rumpf = funktionsRumpf('loeseZugriffAuf');
  assert.match(rumpf, /pruefeBestellzugriff\(\{ art: 'token', token: anfrage\.token \}\)/);
});

test('freigebeVorschauAction und wuenscheAenderungAction verwenden ausschließlich die aus loeseZugriffAuf aufgelöste orderId, nie anfrage.orderId direkt', () => {
  for (const name of ['freigebeVorschauAction', 'wuenscheAenderungAction']) {
    const rumpf = funktionsRumpf(name);
    assert.match(rumpf, /zugriff\.orderId/, `${name} muss zugriff.orderId verwenden`);
    assert.doesNotMatch(
      rumpf,
      /anfrage\.orderId/,
      `${name} darf anfrage.orderId (unmittelbar vom Client) nicht direkt an die Fachlogik weiterreichen`
    );
  }
});

test('beide Aktionen sind rate-limitiert, bevor irgendeine Datenbankaktion läuft', () => {
  const rumpf = funktionsRumpf('loeseZugriffAuf');
  assert.match(rumpf, /pruefeRateLimit\('kundenfreigabe', kunde\.id\)/);
  assert.match(rumpf, /pruefeRateLimit\('kundenfreigabe', anfrage\.token\.slice\(0, 32\)\)/);
});

test('wuenscheAenderungAction weist einen leeren Kommentar zurück, bevor der Zugriff aufgelöst wird', () => {
  const rumpf = funktionsRumpf('wuenscheAenderungAction');
  const trimIndex = rumpf.indexOf('kommentar.trim()');
  const zugriffIndex = rumpf.indexOf('loeseZugriffAuf(anfrage)');
  assert.ok(trimIndex > 0 && zugriffIndex > 0 && trimIndex < zugriffIndex);
});

test("'kundenfreigabe' ist als eigener Rate-Limit-Bucket konfiguriert", () => {
  const rateLimits = readFileSync(path.join(process.cwd(), 'src', 'config', 'rateLimits.ts'), 'utf8');
  assert.match(rateLimits, /kundenfreigabe:\s*\{/);
});
