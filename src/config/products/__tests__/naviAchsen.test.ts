/**
 * WÄCHTER für die Navigationsachsen-Registry (naviAchsen.ts, M3.4).
 *
 * Die oberste Baumebene des Produktbrowsers ist seit M3.4 nicht mehr fest auf
 * Herren/Damen/Unisex verdrahtet, sondern kommt aus dieser Registry. Damit die
 * Öffnung nicht in stillen Datenverlust kippt, sichern diese Tests die zwei
 * kritischen Invarianten ab:
 *   1. Jede von einer Produktart genannte `naviAchse` ist registriert (sonst
 *      fielen ihre Produkte aus AKTIVE_ACHSEN – still).
 *   2. JEDES Produkt fällt in mindestens eine Navigationsgruppe (der frühere
 *      Bruch H1: ein Produkt ohne Zuordnung verschwände aus dem Browser).
 * Dazu die achsenspezifische Semantik der ersten Achse (Geschlecht).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { PRODUCT_TYPES, ALLE_PRODUCT_TYPES } from '@/config/products/productTypes';
import {
  NAVI_ACHSEN,
  AKTIVE_ACHSEN,
  naviGruppenVon,
  produktAchsenId,
} from '@/config/products/naviAchsen';
import { geschlechterVon } from '@/config/products/facetten';

// ── Registry-Integrität ────────────────────────────────────────────────

test('id stimmt mit dem Schlüssel überein und jede Achse hat Gruppen', () => {
  for (const [key, achse] of Object.entries(NAVI_ACHSEN)) {
    assert.equal(achse.id, key, `Achse "${key}" hat abweichende id "${achse.id}"`);
    assert.ok(achse.label.trim(), `${key}: label fehlt`);
    assert.ok(achse.gruppen.length > 0, `${key}: keine Gruppen`);
    const ids = achse.gruppen.map((g) => g.id);
    assert.equal(new Set(ids).size, ids.length, `${key}: doppelte Gruppen-IDs`);
    for (const g of achse.gruppen) assert.ok(g.label.trim(), `${key}/${g.id}: kein Label`);
  }
});

// ── Kritischer Ersatz der geschlossenen Annahme ─────────────────────────

test('jede von einer Produktart genannte naviAchse ist registriert', () => {
  const fehler: string[] = [];
  for (const t of ALLE_PRODUCT_TYPES) {
    const achseId = PRODUCT_TYPES[t]?.naviAchse;
    if (achseId && !NAVI_ACHSEN[achseId]) fehler.push(`${t} → "${achseId}"`);
  }
  assert.deepEqual(fehler, [], 'Produktarten mit nicht registrierter naviAchse (fielen still aus AKTIVE_ACHSEN)');
});

test('JEDES Produkt fällt in mindestens eine Navigationsgruppe (H1)', () => {
  const heimatlos = PRODUCTS.filter((p) => naviGruppenVon(p).length === 0).map(
    (p) => `${p.id} (${p.productType}, Achse ${produktAchsenId(p) ?? '—'})`
  );
  assert.deepEqual(heimatlos, [], 'Produkte ohne Navigationsgruppe verschwänden still aus dem Browser');
});

test('AKTIVE_ACHSEN deckt jede im Katalog genutzte Achse ab', () => {
  const genutzt = new Set(PRODUCTS.map((p) => produktAchsenId(p)).filter(Boolean));
  const aktiv = new Set(AKTIVE_ACHSEN.map((a) => a.id));
  for (const id of genutzt) assert.ok(aktiv.has(id as string), `Achse "${id}" wird genutzt, ist aber nicht aktiv`);
});

// ── Geschlechts-Achse: Überschneidungssemantik ──────────────────────────

const GESCHLECHT = NAVI_ACHSEN.geschlecht!;
const gruppenVon = (p: (typeof PRODUCTS)[number]) => GESCHLECHT.gruppenVon(p);

test('Unisexware steht bei Herren und Unisex, aber NICHT bei Damen', () => {
  // Damen ist bewusst asymmetrisch zu Herren: Unisex-Artikel sind in der
  // Praxis Herren-Passform und dürfen die Damen-Kategorie nicht mit
  // Herrenware verwässern (siehe naviAchsen.ts, gruppenVon).
  const unisex = PRODUCTS.filter((p) => geschlechterVon(p).includes('unisex'));
  assert.ok(unisex.length > 0, 'ohne Unisexware sagt dieser Test nichts');
  for (const p of unisex) {
    for (const g of ['herren', 'unisex']) {
      assert.ok(gruppenVon(p).includes(g), `${p.name} fehlt in Gruppe ${g}`);
    }
    assert.ok(!gruppenVon(p).includes('damen'), `${p.name} darf nicht bei Damen erscheinen (ist Unisex, keine Damenware)`);
  }
});

test('reine Herrenware erscheint nicht bei Damen – und umgekehrt', () => {
  for (const p of PRODUCTS) {
    const eigen = geschlechterVon(p);
    if (eigen.includes('unisex')) continue;
    if (eigen.includes('herren')) assert.ok(!gruppenVon(p).includes('damen'), `${p.name}`);
    if (eigen.includes('damen')) assert.ok(!gruppenVon(p).includes('herren'), `${p.name}`);
  }
});

test('nur echte Damenware erscheint bei Damen', () => {
  const drin = PRODUCTS.filter((p) => gruppenVon(p).includes('damen'));
  for (const p of drin) assert.ok(geschlechterVon(p).includes('damen'), `${p.name} steht bei Damen, ist aber keine Damenware`);
});

test('die Gruppe Unisex führt ausschließlich Unisexware', () => {
  const drin = PRODUCTS.filter((p) => gruppenVon(p).includes('unisex'));
  for (const p of drin) assert.ok(geschlechterVon(p).includes('unisex'), `${p.name}`);
});
