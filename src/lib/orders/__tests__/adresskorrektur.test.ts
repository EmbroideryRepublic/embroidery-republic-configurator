/**
 * Absicherung der Admin-Adresskorrektur (Ausbauplan, quickwins: "Adresse im
 * Admin korrigierbar machen") – der häufigste Support-Fall ("Tippfehler in
 * der Hausnummer") ließ sich bislang nur per Storno beheben.
 *
 * Gleiche Teststrategie wie kundenfreigabe.test.ts: Quelltext-Prüfung statt
 * Mocking des Supabase-Clients.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ORDER_SERVICE = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderService.ts');
const ACTIONS = path.join(process.cwd(), 'src', 'lib', 'actions', 'addressCorrectionActions.ts');

const serviceQuelltext = readFileSync(ORDER_SERVICE, 'utf8');
const actionsQuelltext = readFileSync(ACTIONS, 'utf8');

function funktionsRumpf(quelltext: string, name: string): string {
  const start = quelltext.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden`);
  const naechste = quelltext.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? quelltext.slice(start, naechste) : quelltext.slice(start);
}

test('korrigiereLieferadresseDurchAdmin lehnt eine Korrektur ab, sobald ein DHL-Label existiert', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'korrigiereLieferadresseDurchAdmin');
  assert.match(
    rumpf,
    /if \(bestellung\.dhl_label_url\) return \{ ok: false, grund: 'bereits-label-erstellt' \};/,
    'ein bereits erstelltes Label trägt die alte Adresse physisch – eine DB-Korrektur danach wäre irreführend'
  );
});

test('korrigiereLieferadresseDurchAdmin protokolliert die vorherige Adresse, bevor sie überschrieben wird', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'korrigiereLieferadresseDurchAdmin');
  const updateIndex = rumpf.indexOf(".update(patch)");
  const vorherIndex = rumpf.indexOf('const vorher =');
  assert.ok(updateIndex > 0 && vorherIndex > 0, 'beide Stellen müssen existieren');
  assert.ok(updateIndex < vorherIndex, 'vorher wird aus der VOR dem Update geladenen bestellung gebaut, nicht aus dem Patch');
  assert.match(rumpf, /eventType: 'address_corrected'/);
  assert.match(rumpf, /detail: \{ vorher, geaenderteFelder: Object\.keys\(patch\) \}/);
});

test('korrigiereLieferadresseDurchAdmin übernimmt nur tatsächlich ausgefüllte Felder (kein versehentliches Leeren)', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'korrigiereLieferadresseDurchAdmin');
  for (const feld of ['customerName', 'strasse', 'plz', 'ort', 'land']) {
    assert.match(rumpf, new RegExp(`if \\(korrektur\\.${feld}\\?\\.trim\\(\\)\\)`));
  }
});

test('korrigiereLieferadresseAction (Server Action) prüft istAdmin() und reicht alle Fehlergründe durch', () => {
  assert.match(actionsQuelltext, /if \(!\(await istAdmin\(\)\)\)/);
  assert.match(actionsQuelltext, /await korrigiereLieferadresseDurchAdmin\(orderId, korrektur\)/);
  for (const grund of ['nicht-gefunden', 'bereits-label-erstellt']) {
    assert.match(actionsQuelltext, new RegExp(`'${grund}':`));
  }
  assert.match(actionsQuelltext, /\bfehler:/, 'der grund "fehler" braucht als gültiger Bezeichner keine Anführungszeichen');
  assert.match(actionsQuelltext, /revalidatePath\(`\/admin\/bestellung\/\$\{orderId\}`\)/);
});
