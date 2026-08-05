/**
 * WÄCHTER für die geöffnete SupplierId (ADR 0004).
 *
 * SupplierId ist eine offene ID – die frühere geschlossene Union erzwang, dass
 * Adapter- und Mapping-Registry vollständig sind. Diese Tests übernehmen die
 * Rolle: sie sichern, dass ein neuer Lieferant NICHT halb registriert werden
 * kann (Adapter ohne Mapping oder umgekehrt) und dass jede real genutzte
 * SupplierId registriert ist – sonst schlüge der Fehler erst zur Laufzeit im
 * fail-loud-Resolver auf.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SUPPLIERS } from '../registry';
import { SUPPLIER_VARIANT_MAPS } from '../mapping/registry';
import { supplierRefVon } from '../supplierRefs';
import { PRODUCTS } from '@/config/products';

test('Adapter-Registry und Mapping-Registry decken exakt dieselben Lieferanten ab', () => {
  const adapters = Object.keys(SUPPLIERS).sort();
  const maps = Object.keys(SUPPLIER_VARIANT_MAPS).sort();
  assert.deepEqual(adapters, maps, 'jeder Adapter braucht eine Mapping-Tabelle und umgekehrt');
});

test('jeder Descriptor-Schlüssel stimmt mit seiner id überein', () => {
  for (const [key, d] of Object.entries(SUPPLIERS)) {
    assert.equal(d.id, key, `Descriptor "${key}" hat abweichende id "${d.id}"`);
  }
});

test('jede von einem Produkt genutzte SupplierId ist registriert', () => {
  const bekannt = new Set(Object.keys(SUPPLIERS));
  const fehlend: string[] = [];
  for (const p of PRODUCTS) {
    const id = supplierRefVon(p.id)?.supplierId;
    if (id && !bekannt.has(id)) fehlend.push(`${p.id} → "${id}"`);
  }
  assert.deepEqual(fehlend, [], 'Produkte verweisen auf nicht registrierte Lieferanten');
});
