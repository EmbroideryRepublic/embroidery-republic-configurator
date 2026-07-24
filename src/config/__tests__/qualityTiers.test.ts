/**
 * Tests der Qualitätsstufen.
 *
 * Zwei Dinge sind hier wichtig genug für Tests: dass JEDE Stufe einen
 * Anzeigenamen hat (eine fehlende Zuordnung würde als leeres Etikett im
 * Shop landen) und dass die Rangfolge vollständig ist – Filterlisten
 * sortieren danach.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUALITY_TIER_LABELS,
  QUALITY_TIER_ORDER,
  QUALITY_TIER_HINTS,
  qualityTierLabel,
  sortiereQualityTiers,
} from '../qualityTiers';
import { PRODUCTS } from '@/config/products';

test('standard wird nach außen als "Classic" angezeigt', () => {
  assert.equal(qualityTierLabel('standard'), 'Classic');
  // Der interne Wert bleibt bewusst unveraendert.
  assert.ok('standard' in QUALITY_TIER_LABELS);
});

test('jede Stufe hat Anzeigename, Hinweis und Rangplatz', () => {
  for (const tier of QUALITY_TIER_ORDER) {
    assert.ok(QUALITY_TIER_LABELS[tier]?.length > 0, `${tier}: Anzeigename fehlt`);
    assert.ok(QUALITY_TIER_HINTS[tier]?.length > 0, `${tier}: Hinweis fehlt`);
  }
  // Gegenrichtung: keine Stufe ohne Rangplatz.
  for (const tier of Object.keys(QUALITY_TIER_LABELS)) {
    assert.ok(QUALITY_TIER_ORDER.includes(tier as never), `${tier}: fehlt in der Rangfolge`);
  }
});

test('Rangfolge geht von einfach nach hochwertig', () => {
  assert.deepEqual([...QUALITY_TIER_ORDER], ['basic', 'standard', 'premium', 'luxury']);
});

test('Sortierung folgt der Rangfolge, nicht der Eingabereihenfolge', () => {
  assert.deepEqual(sortiereQualityTiers(['premium', 'basic', 'luxury', 'standard']), [
    'basic',
    'standard',
    'premium',
    'luxury',
  ]);
});

test('JEDES Katalogprodukt hat eine bekannte Qualitätsstufe', () => {
  // Schützt davor, dass ein neues Produkt mit unbekannter Stufe im Shop
  // ohne Etikett erscheint.
  const unbekannt = PRODUCTS.filter((p) => !QUALITY_TIER_ORDER.includes(p.qualityTier));
  assert.deepEqual(
    unbekannt.map((p) => `${p.id} (${p.qualityTier})`),
    [],
    'Produkte mit unbekannter Qualitätsstufe'
  );
});
