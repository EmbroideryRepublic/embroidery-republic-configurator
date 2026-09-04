/**
 * Absicherung von BestellVerlauf.tsx (Bestell-Historie im Admin).
 *
 * `EVENT_LABELS` ist eine reine Anzeige-Lookup-Tabelle, gepflegt getrennt von
 * den ~15 Stellen im Code, die tatsächlich order_events schreiben
 * (protokolliereBestellereignis-Aufrufer in orders/*.ts und
 * suppliers/lifecycle/enqueue.ts). Ohne diesen Test könnte ein künftiger
 * neuer eventType dort ergänzt werden, ohne dass die Zeitleiste ein Label
 * dafür bekommt – die Zeile fällt dann nicht aus (EVENT_LABELS[x] ?? x zeigt
 * den rohen technischen Namen), aber unbemerkt.
 *
 * Gleiche Teststrategie wie admin/__tests__/brauchtAufmerksamkeit.test.ts:
 * Quelltext-Prüfung statt Rendering (kein Testing-Library-Setup in diesem
 * Projekt für Komponenten).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const KOMPONENTE = path.join(process.cwd(), 'src', 'components', 'admin', 'BestellVerlauf.tsx');
const ORDERS_DIR = path.join(process.cwd(), 'src', 'lib', 'orders');
const ENQUEUE_TS = path.join(process.cwd(), 'src', 'lib', 'suppliers', 'lifecycle', 'enqueue.ts');

function alleQuelldateien(dir: string): string[] {
  return readdirSync(dir).flatMap((eintrag) => {
    const voll = path.join(dir, eintrag);
    if (statSync(voll).isDirectory()) {
      return eintrag === '__tests__' ? [] : alleQuelldateien(voll);
    }
    return voll.endsWith('.ts') && !voll.endsWith('.test.ts') ? [voll] : [];
  });
}

function gefundeneEventTypen(): Set<string> {
  const gefunden = new Set<string>();
  const dateien = [...alleQuelldateien(ORDERS_DIR), ENQUEUE_TS];
  for (const datei of dateien) {
    const inhalt = readFileSync(datei, 'utf8');
    for (const treffer of inhalt.matchAll(/eventType:\s*'([a-z_]+)'/g)) {
      gefunden.add(treffer[1]!);
    }
  }
  return gefunden;
}

test('jeder in orders/*.ts bzw. suppliers/lifecycle/enqueue.ts geschriebene order_events.event_type hat ein Label in BestellVerlauf.tsx', () => {
  const komponente = readFileSync(KOMPONENTE, 'utf8');
  const labelBlock = komponente.slice(
    komponente.indexOf('const EVENT_LABELS'),
    komponente.indexOf('};', komponente.indexOf('const EVENT_LABELS'))
  );

  const fehlend = [...gefundeneEventTypen()].filter((typ) => !labelBlock.includes(`${typ}:`));
  assert.deepEqual(
    fehlend,
    [],
    `folgende event_type-Werte werden geschrieben, haben aber kein Label in EVENT_LABELS: ${fehlend.join(', ')}`
  );
});

test('istFehlschlag erkennt jedes *_failed/*_failure-Muster als Fehlschlag (Rot-Konvention)', () => {
  const komponente = readFileSync(KOMPONENTE, 'utf8');
  const fehlschlagTypen = [...gefundeneEventTypen()].filter((t) => t.endsWith('_failed') || t.endsWith('_failure'));
  assert.ok(fehlschlagTypen.length > 0, 'Sanity-Check: es muss mindestens einen *_failed/*_failure-Typ geben');
  assert.match(komponente, /eventType\.endsWith\('_failed'\)/);
  assert.match(komponente, /eventType\.endsWith\('_failure'\)/);
});

test('detail.kommentar (Änderungswunsch-Text) wird angezeigt, nicht nur die generische reason', () => {
  // Regressionsfund (Live-Verifikation 2026-09-04): wuenscheAenderungDurchKunden
  // (orderService.ts) protokolliert den eigentlichen Kundentext ausschließlich
  // in detail.kommentar, reason bleibt für JEDEN Änderungswunsch derselbe
  // generische Satz ("Kundschaft wünscht eine Änderung..."). Ohne diese
  // Anzeige sähe der Admin, DASS etwas geändert werden soll, aber nie WAS –
  // exakt der Punkt der Funktion.
  const komponente = readFileSync(KOMPONENTE, 'utf8');
  assert.match(komponente, /ev\.detail\?\.kommentar/, 'detail.kommentar muss gelesen werden');
  const rumpfStart = komponente.indexOf('export function BestellVerlauf');
  const rumpf = komponente.slice(rumpfStart);
  assert.match(rumpf, /\{kommentar &&/, 'ein vorhandener Kommentar muss tatsächlich gerendert werden, nicht nur gelesen');
});
