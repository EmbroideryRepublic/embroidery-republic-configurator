/**
 * Prüfungen der Auswahl-Übernahme beim Produktwechsel.
 *
 * Kern ist der Komfort: gleiche Farbe/Größe bleibt, fehlende weicht auf die
 * nächste sinnvolle Alternative aus – nie einfach auf „die erste".
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { ProductColorConfig, ProductConfig } from '@/config/products/types';
import { passendeFarbe, passendeGroessen, uebernehmeAuswahl } from '../uebernahme';
import { naechsteGroesse, GROESSEN_LEITERN } from '@/config/products/groessen';

/** Konfektions-Standardleiter für die geordnet-diskreten Größen-Tests. */
const KONF = GROESSEN_LEITERN['konfektion-eu']!;

function farbe(id: string, name: string, hex: string): ProductColorConfig {
  return { id, name, hex };
}

function produkt(teil: Partial<ProductConfig> & { colors: ProductColorConfig[]; sizes: string[] }): ProductConfig {
  return { id: 'x', name: 'X', productType: 'hoodie', ...teil } as ProductConfig;
}

// ── Farbe ──────────────────────────────────────────────────────────────

test('gleiche Farbe (nach Name) wird übernommen', () => {
  const neu = produkt({ colors: [farbe('a', 'Weiß', '#ffffff'), farbe('b', 'Navy', '#1a2340')], sizes: ['M'] });
  const alt = farbe('z', 'navy', '#000080');
  assert.equal(passendeFarbe(neu, alt), 'b', 'Groß-/Kleinschreibung darf egal sein');
});

test('fehlt die Farbe, gewinnt der farblich nächste Ton – nicht der erste', () => {
  const neu = produkt({
    colors: [farbe('weiss', 'Weiß', '#ffffff'), farbe('rot', 'Rot', '#d01111'), farbe('anthrazit', 'Anthrazit', '#333333')],
    sizes: ['M'],
  });
  const alt = farbe('z', 'Schwarz', '#000000');
  assert.equal(passendeFarbe(neu, alt), 'anthrazit', 'Schwarz liegt näher an Anthrazit als an Weiß/Rot');
});

test('ohne alte Farbe wird die erste genommen', () => {
  const neu = produkt({ colors: [farbe('a', 'Weiß', '#fff'), farbe('b', 'Navy', '#123')], sizes: ['M'] });
  assert.equal(passendeFarbe(neu, undefined), 'a');
});

test('Kurz-Hex (#abc) wird wie #aabbcc gelesen', () => {
  const neu = produkt({ colors: [farbe('w', 'Weiß', '#fff'), farbe('s', 'Schwarz', '#000')], sizes: ['M'] });
  assert.equal(passendeFarbe(neu, farbe('z', 'x', '#010101')), 's');
});

// ── Größe ──────────────────────────────────────────────────────────────

test('vorhandene Größe bleibt', () => {
  assert.equal(naechsteGroesse('L', ['S', 'M', 'L', 'XL'], KONF), 'L');
});

test('fehlende Größe fällt auf die nächstgelegene', () => {
  assert.equal(naechsteGroesse('XXL', ['S', 'M', 'L', 'XL'], KONF), 'XL', 'größte verfügbare liegt am nächsten');
  assert.equal(naechsteGroesse('XS', ['M', 'L', 'XL'], KONF), 'M');
});

test('bei Gleichstand wird die kleinere Größe gewählt', () => {
  // M fehlt, S und L sind gleich weit entfernt → S (nichts fällt zu eng aus).
  assert.equal(naechsteGroesse('M', ['S', 'L'], KONF), 'S');
});

test('unbekannte Größe hat keine sinnvolle Nähe (Konfektion)', () => {
  assert.equal(naechsteGroesse('Einheitsgröße', ['S', 'M', 'L'], KONF), undefined);
});

test('Mengen fehlender Größen wandern mit und addieren sich bei Kollision', () => {
  const neu = produkt({ colors: [farbe('a', 'Weiß', '#fff')], sizes: ['S', 'L'] });
  // M fehlt → S; XS fehlt → S. Beide landen auf S und summieren sich.
  const abgebildet = passendeGroessen(neu, { M: 2, XS: 1, L: 3 });
  assert.equal(abgebildet['S'], 3, '2 (von M) + 1 (von XS)');
  assert.equal(abgebildet['L'], 3);
});

test('Nullmengen werden übersprungen', () => {
  const neu = produkt({ colors: [farbe('a', 'Weiß', '#fff')], sizes: ['S', 'M', 'L'] });
  assert.deepEqual(passendeGroessen(neu, { M: 0, L: 4 }), { L: 4 });
});

// ── Zusammenspiel ──────────────────────────────────────────────────────

test('uebernehmeAuswahl liest die alte Farbe über ihre id im ALTEN Produkt', () => {
  const alt = produkt({ id: 'alt', colors: [farbe('a1', 'Navy', '#1a2340'), farbe('a2', 'Weiß', '#fff')], sizes: ['M', 'L'] });
  const neu = produkt({ id: 'neu', colors: [farbe('n1', 'Weiß', '#fff'), farbe('n2', 'Navy', '#182238')], sizes: ['S', 'M'] });

  const ergebnis = uebernehmeAuswahl(alt, neu, 'a1', { L: 2 });
  assert.equal(ergebnis.colorId, 'n2', 'Navy → Navy');
  assert.deepEqual(ergebnis.sizeQuantities, { M: 2 }, 'L fehlt im neuen Produkt → nächstgelegen M');
});

test('ohne altes Produkt bleibt nur die erste Farbe und leere Größen', () => {
  const neu = produkt({ colors: [farbe('n1', 'Weiß', '#fff')], sizes: ['M'] });
  const ergebnis = uebernehmeAuswahl(undefined, neu, 'egal', {});
  assert.equal(ergebnis.colorId, 'n1');
  assert.deepEqual(ergebnis.sizeQuantities, {});
});
