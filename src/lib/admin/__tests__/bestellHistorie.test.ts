/**
 * Absicherung der neuen, UNGEFILTERTEN order_events-Abfrage in
 * getOrderDetail() – Grundlage für BestellVerlauf.tsx (Bestell-Historie).
 *
 * Bewusst als zweiter, eigener Query getestet: die bereits bestehende
 * problemEvents-Abfrage (siehe brauchtAufmerksamkeit.test.ts, dort für
 * listOrders) ist auf drei Fehlerkategorien beschränkt – diese hier MUSS
 * ohne `.in('event_type', …)`-Filter auskommen, sonst zeigt die Zeitleiste
 * nie erfolgreiche Ereignisse wie status_changed oder proof_approved.
 *
 * Gleiche Teststrategie wie brauchtAufmerksamkeit.test.ts: Quelltext-Prüfung.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DATA = path.join(process.cwd(), 'src', 'lib', 'admin', 'data.ts');
const quelltext = readFileSync(DATA, 'utf8');

function funktionsRumpf(name: string): string {
  const start = quelltext.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden`);
  const naechste = quelltext.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? quelltext.slice(start, naechste) : quelltext.slice(start);
}

test('getOrderDetail lädt order_events ein zweites Mal, diesmal OHNE event_type-Filter', () => {
  const rumpf = funktionsRumpf('getOrderDetail');
  const treffer = [...rumpf.matchAll(/\.from\('order_events'\)/g)];
  assert.equal(treffer.length, 2, 'ein gefilterter Query (problemEvents) plus ein ungefilterter (events) für die Zeitleiste');

  const zweiterQueryIndex = rumpf.indexOf(".from('order_events')", treffer[0]!.index! + 1);
  const zweiterQueryEnde = rumpf.indexOf(';', zweiterQueryIndex);
  const zweiterQuery = rumpf.slice(zweiterQueryIndex, zweiterQueryEnde);
  assert.doesNotMatch(zweiterQuery, /\.in\('event_type'/, 'die Zeitleiste darf keine Ereigniskategorie ausschließen');
  assert.match(zweiterQuery, /\.order\('at', \{ ascending: false \}\)/, 'neueste zuerst');
});

test('AdminOrderDetail.events wird aus dem zweiten Query gebaut und im Rückgabeobjekt gesetzt', () => {
  assert.match(quelltext, /const events: AdminOrderEvent\[\] = \(eventRows \?\? \[\]\)\.map\(/);
  const rumpf = funktionsRumpf('getOrderDetail');
  assert.match(rumpf, /items: itemRows,\s*\n\s*events,/);
});

test('AdminOrderEvent-Interface und AdminOrderDetail.events sind exportiert/deklariert', () => {
  assert.match(quelltext, /export interface AdminOrderEvent \{/);
  assert.match(quelltext, /events: AdminOrderEvent\[\];/);
});
