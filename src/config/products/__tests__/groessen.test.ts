/**
 * WÄCHTER für die Größenleiter-Registry (groessen.ts, M3.5 / ADR 0002 §2).
 *
 * Größen sind nicht mehr fest Konfektion. Diese Tests sichern die Registry und
 * die typabhängige „nächste Größe"-Strategie – insbesondere den H2-Fix: bei
 * Einheitsgrößen darf beim Produktwechsel keine Menge verloren gehen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { PRODUCT_TYPES } from '@/config/products/productTypes';
import {
  GROESSEN_LEITERN,
  DEFAULT_GROESSEN_LEITER,
  KONFEKTIONSGROESSEN,
  groessenLeiterVon,
  groessenRang,
  naechsteGroesse,
  type GroessenLeiter,
} from '@/config/products/groessen';

// ── Registry-Integrität ────────────────────────────────────────────────

test('id stimmt mit dem Schlüssel überein; Vokabular und Ordnung sind plausibel', () => {
  for (const [key, leiter] of Object.entries(GROESSEN_LEITERN)) {
    assert.equal(leiter.id, key, `Leiter "${key}" hat abweichende id "${leiter.id}"`);
    assert.ok(leiter.vokabular.singular.trim() && leiter.vokabular.plural.trim(), `${key}: Vokabular fehlt`);
    // Geordnet-diskrete Skalen brauchen eine Ordnung; 'mass' darf leer sein.
    if (leiter.typ !== 'mass') assert.ok(leiter.ordnung.length > 0, `${key}: leere Ordnung`);
    if (leiter.referenz) {
      assert.ok(leiter.ordnung.includes(leiter.referenz), `${key}: referenz "${leiter.referenz}" nicht in der Ordnung`);
    }
  }
});

test('die Standard-Leiter existiert und ist Konfektion', () => {
  const std = GROESSEN_LEITERN[DEFAULT_GROESSEN_LEITER];
  assert.ok(std, 'Default-Leiter fehlt');
  assert.equal(std!.typ, 'konfektion');
  assert.deepEqual([...std!.ordnung], [...KONFEKTIONSGROESSEN]);
});

// ── Kritischer Ersatz: jede deklarierte Leiter ist registriert ──────────

test('jedes Produkt löst auf eine registrierte Größenleiter auf', () => {
  const fehler: string[] = [];
  for (const p of PRODUCTS) {
    const id = p.sizeScale ?? PRODUCT_TYPES[p.productType]?.groessenLeiter ?? DEFAULT_GROESSEN_LEITER;
    if (!GROESSEN_LEITERN[id]) fehler.push(`${p.id} → "${id}"`);
  }
  assert.deepEqual(fehler, [], 'Produkte mit nicht registrierter Größenleiter (Tippfehler würde still auf Konfektion fallen)');
});

test('groessenLeiterVon liefert für jedes Produkt eine gültige Leiter', () => {
  for (const p of PRODUCTS) {
    const leiter = groessenLeiterVon(p);
    assert.ok(leiter && GROESSEN_LEITERN[leiter.id], `${p.id}: ungültige Leiter`);
  }
});

// ── Strategie je Leiter-Typ ─────────────────────────────────────────────

test('Konfektion: nächste Größe per Index, Gleichstand → kleinere', () => {
  const k = GROESSEN_LEITERN['konfektion-eu']!;
  assert.equal(naechsteGroesse('L', ['S', 'M', 'L', 'XL'], k), 'L');
  assert.equal(naechsteGroesse('XXL', ['S', 'M', 'L', 'XL'], k), 'XL');
  assert.equal(naechsteGroesse('M', ['S', 'L'], k), 'S', 'Gleichstand → kleinere');
  assert.equal(naechsteGroesse('58', ['S', 'M'], k), undefined, 'leiterfremder Wunsch → keine Nähe');
});

test('Einheitsgröße: jede Wunschgröße landet auf der einzigen Größe (H2 – keine Menge geht verloren)', () => {
  const einheit: GroessenLeiter = {
    id: 'einheit-test', typ: 'einheit', ordnung: ['One Size'],
    vokabular: { singular: 'Größe', plural: 'Größen' },
  };
  assert.equal(naechsteGroesse('M', ['One Size'], einheit), 'One Size');
  assert.equal(naechsteGroesse('XXL', ['One Size'], einheit), 'One Size');
  assert.equal(naechsteGroesse('One Size', ['One Size'], einheit), 'One Size');
});

test('Maß-Skala: nächster Wert per Metrik', () => {
  const mass: GroessenLeiter = {
    id: 'mass-test', typ: 'mass', ordnung: [],
    vokabular: { singular: 'Größe', plural: 'Größen' },
    metrik: (l) => parseInt(l, 10),
  };
  assert.equal(naechsteGroesse('60', ['50', '58', '62'], mass), '58');
  assert.equal(naechsteGroesse('100', ['50', '58', '62'], mass), '62');
});

test('leere Verfügbarkeit liefert undefined statt zu werfen', () => {
  assert.equal(naechsteGroesse('M', [], GROESSEN_LEITERN['konfektion-eu']!), undefined);
});

// ── Sortier-Rang (Default Konfektion, byte-identisch) ───────────────────

test('groessenRang ordnet Konfektion korrekt, Unbekanntes ans Ende', () => {
  assert.equal(groessenRang('M'), KONFEKTIONSGROESSEN.indexOf('M'));
  assert.equal(groessenRang('s'), KONFEKTIONSGROESSEN.indexOf('S'), 'Groß-/Kleinschreibung egal');
  assert.equal(groessenRang('gibt-es-nicht'), KONFEKTIONSGROESSEN.length, 'Unbekanntes fällt ans Ende');
});
