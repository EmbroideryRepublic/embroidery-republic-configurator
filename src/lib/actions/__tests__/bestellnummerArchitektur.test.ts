/**
 * ARCHITEKTURTEST: buildOrderNumber() darf außerhalb der Bestellerzeugung
 * NIE mehr bloß aufgerufen werden.
 *
 * Hintergrund (Migration 0036, Bestellnummer-Jahreswechsel-Fix):
 * buildOrderNumber(dbId) berechnete bislang bei JEDEM Lesen die Nummer neu
 * aus `new Date().getFullYear()` – ab Januar 2027 hätte jede 2026 angelegte
 * Bestellung überall eine ANDERE Nummer gezeigt als die bereits verschickte.
 * Der Fix legt die Nummer einmalig bei der Erstellung fest
 * (orders.ts::persistAndNotifyCore, `orders.order_number`) und macht jeden
 * Lesepfad zu einem Rückfall: `<row>.order_number ?? buildOrderNumber(id)`.
 *
 * Dieser Test verhindert, dass künftig wieder ein bloßer, ungeschützter
 * Aufruf einschleicht (z.B. ein neuer Lesepfad, der die Spalte vergisst) –
 * jeder Aufruf außerhalb der EINEN erlaubten Erzeugungsstelle muss als
 * `?? buildOrderNumber(` auftauchen.
 *
 * Gleiche Teststrategie wie pricing/__tests__/architektur.test.ts: rekursiver
 * Quelltext-Scan über den ganzen src-Baum.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'src');
const ORDERS_TS = path.join('src', 'lib', 'actions', 'orders.ts');
const ORDER_TYPES_TS = path.join('src', 'lib', 'actions', 'orderTypes.ts');

function alleQuelldateien(dir: string): string[] {
  return readdirSync(dir).flatMap((eintrag) => {
    const voll = path.join(dir, eintrag);
    if (statSync(voll).isDirectory()) {
      return eintrag === '__tests__' || eintrag === 'node_modules' ? [] : alleQuelldateien(voll);
    }
    return /\.tsx?$/.test(voll) ? [voll] : [];
  });
}

test('jeder Aufruf von buildOrderNumber( ist entweder die eine erlaubte Erzeugungsstelle oder ein ??-Rückfall', () => {
  const verstoesse: string[] = [];

  for (const datei of alleQuelldateien(SRC)) {
    const relativ = path.relative(process.cwd(), datei);
    const inhalt = readFileSync(datei, 'utf8');

    for (const [i, zeile] of inhalt.split('\n').entries()) {
      // Kommentarzeilen (//, /** ... */, Fortsetzungszeilen mit *) dürfen den
      // Namen frei erwähnen – geprüft wird nur echter Code.
      if (/^\s*(\/\/|\*|\/\*\*)/.test(zeile)) continue;
      const treffer = [...zeile.matchAll(/buildOrderNumber\(/g)];
      for (const t of treffer) {
        // Die Funktionsdefinition selbst ist kein Aufruf.
        if (relativ === ORDER_TYPES_TS && /export function buildOrderNumber\(/.test(zeile)) continue;

        const davor = zeile.slice(0, t.index);
        const istRueckfall = /\?\?\s*$/.test(davor);

        // Die EINE erlaubte Erzeugungsstelle: orders.ts legt die Bestell-ID
        // gerade erst per randomUUID() an, eine Zeile kann dort noch gar
        // kein order_number haben, aus dem ein Rückfall lesen könnte.
        const istErzeugungsstelle = relativ === ORDERS_TS && /const orderNumber = buildOrderNumber\(orderId\);/.test(zeile);

        if (!istRueckfall && !istErzeugungsstelle) {
          verstoesse.push(`${relativ}:${i + 1}: ${zeile.trim()}`);
        }
      }
    }
  }

  assert.deepEqual(
    verstoesse,
    [],
    'buildOrderNumber( darf nur als "<row>.order_number ?? buildOrderNumber(id)"-Rückfall stehen ' +
      '(Ausnahme: die Erzeugungsstelle in orders.ts) – sonst zeigt dieser Lesepfad ab Januar 2027 eine ' +
      'andere Nummer als die bereits verschickte'
  );
});

test('orders.ts persistiert order_number im Insert-Payload (create_order_atomic)', () => {
  const inhalt = readFileSync(path.join(process.cwd(), ORDERS_TS), 'utf8');
  assert.match(inhalt, /order_number: orderNumber,/, 'die einmalig berechnete Nummer muss in den Insert-Payload aufgenommen werden');
});

test('create_order_atomic übernimmt order_number aus dem Payload, statt ihn stillschweigend zu verwerfen', () => {
  const migration = readFileSync(
    path.join(process.cwd(), 'supabase', 'migrations', '0036_bestellnummer_spalte.sql'),
    'utf8'
  );
  assert.match(
    migration,
    /insert into public\.orders \(\s*\n\s*id, order_number,/,
    'die explizite Insert-Spaltenliste muss order_number VOR den übrigen Feldern führen – sonst würde eine ' +
      'neue Bestellung den Wert aus orders.ts nie tatsächlich speichern und stets über den NULL-Rückfall laufen'
  );
  assert.match(migration, /p_order->>'order_number',/);
});

test('der SQL-Backfill in Migration 0036 nutzt exakt denselben Algorithmus wie buildOrderNumber() (nur mit created_at statt now())', () => {
  const migration = readFileSync(
    path.join(process.cwd(), 'supabase', 'migrations', '0036_bestellnummer_spalte.sql'),
    'utf8'
  );
  // buildOrderNumber(): `ER-${new Date().getFullYear()}-${dbId.replace(/-/g,'').slice(0,6).toUpperCase()}`
  // SQL-Pendant, Zeile für Zeile nachgebaut – jede Abweichung hier hätte für
  // JEDE bestehende Bestellung sofort eine andere Nummer gezeigt als vorher.
  assert.match(
    migration,
    /'ER-' \|\| extract\(year from created_at\)::int \|\| '-' \|\|\s*\n\s*upper\(left\(replace\(id::text, '-', ''\), 6\)\)/,
    'Backfill muss Jahr aus created_at (nicht now()) nehmen und dieselben ersten 6 Hex-Zeichen der ID wie buildOrderNumber() verwenden'
  );
});
