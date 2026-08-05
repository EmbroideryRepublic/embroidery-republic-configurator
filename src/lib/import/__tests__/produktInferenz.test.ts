/**
 * WÄCHTER der zentralen Import-Inferenz (ADR 0004).
 *
 * Diese reinen Funktionen laufen für JEDEN Lieferanten identisch – ein Fehler
 * hier verzerrt still den gesamten Katalog (falsche Farbgruppe, falscher
 * Produkttyp → falsche Facette/Geometrie). Die Tests halten das dokumentierte
 * Verhalten fest (Name als primäres Signal, Hex als objektiver Fallback,
 * chromatisch vor achromatisch).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slug, idAusUrl, normSize, hexToRgb, farbgruppeAusHex, farbgruppeVon,
  materialGruppenVon, produktTyp, geschlechtVon, fitVon, passformVon,
  GEO_REP, TYP_LABEL,
} from '../produktInferenz';
import { ALLE_PRODUCT_TYPES } from '@/config/products/productTypes';

test('slug: Umlaute/ß transliteriert, Sonderzeichen zu Bindestrich', () => {
  assert.equal(slug('Größe Ätzend Öl Über'), 'grosse-atzend-ol-uber');
  assert.equal(slug('  Navy/Blue  '), 'navy-blue');
});

test('idAusUrl: Dateiname vor .html, sonst Slug der URL', () => {
  assert.equal(idAusUrl('https://shop.eu/pfad/foo-bar-123.html'), 'foo-bar-123');
  assert.equal(idAusUrl('kein-html'), 'kein-html');
});

test('normSize: Lieferanten-Schreibweisen auf die Konfektionsleiter', () => {
  assert.equal(normSize('2XL'), 'XXL');
  assert.equal(normSize('xxxl'), '3XL');
  assert.equal(normSize('M'), 'M');
});

test('hexToRgb: korrekte Kanäle', () => {
  assert.deepEqual(hexToRgb('#FF8000'), [255, 128, 0]);
  assert.deepEqual(hexToRgb('000000'), [0, 0, 0]);
});

test('farbgruppeAusHex: achromatisch nach Helligkeit/Sättigung', () => {
  assert.equal(farbgruppeAusHex('#FFFFFF'), 'weiss');
  assert.equal(farbgruppeAusHex('#000000'), 'schwarz');
  assert.equal(farbgruppeAusHex('#808080'), 'grau');
  assert.equal(farbgruppeAusHex('#00A000'), 'gruen');
});

test('farbgruppeVon: Name schlägt Hex; chromatisch vor achromatisch', () => {
  // Name-Schlüsselwort gewinnt, selbst wenn der Hex (hier Schwarz) etwas anderes sagt.
  assert.equal(farbgruppeVon('Navy', '#000000'), 'blau');
  // „Heather" (→ grau) darf die chromatische Grundfarbe nicht überschreiben.
  assert.equal(farbgruppeVon('Cherry Red (Heather)', '#7A2A2A'), 'rot');
  // Ohne Schlüsselwort trägt der objektive Hex.
  assert.equal(farbgruppeVon('Zystal', '#00FF00'), 'gruen');
});

test('materialGruppenVon: Zusammensetzung → Gruppen', () => {
  assert.deepEqual(materialGruppenVon('100% Baumwolle'), ['baumwolle-100']);
  assert.deepEqual(materialGruppenVon('65% Polyester / 35% Baumwolle'), ['mischgewebe']);
  assert.deepEqual(materialGruppenVon('100% Polyester'), ['polyester']);
  assert.ok(materialGruppenVon('100% Bio-Baumwolle (organic)').includes('bio-baumwolle'));
  assert.ok(materialGruppenVon('recyceltes Polyester').includes('recycelt'));
});

test('produktTyp: Name/Kategorie → Typ (Zip vor Hoodie)', () => {
  assert.equal(produktTyp('Zip Hoodie', ''), 'zip-hoodie');
  assert.equal(produktTyp('Kapuzenpullover Hooded', ''), 'hoodie');
  assert.equal(produktTyp('Long Sleeve Tee', ''), 'longsleeve');
  assert.equal(produktTyp('Piqué Polo', ''), 'polo');
  assert.equal(produktTyp('Microfleece Jacket', ''), 'jacket');
  assert.equal(produktTyp('Crew Sweat', ''), 'sweater');
  assert.equal(produktTyp('Basic Tee', ''), 'tshirt');
  assert.equal(produktTyp('Etwas', 'polo'), 'polo'); // Kategorie-Fallback
});

test('geschlechtVon: Damen vor Herren, sonst Unisex', () => {
  assert.equal(geschlechtVon('Ladies Fitted Tee'), 'Damen');
  assert.equal(geschlechtVon('Women T'), 'Damen');
  assert.equal(geschlechtVon("Men's Classic"), 'Herren');
  assert.equal(geschlechtVon('Unisex Basic'), 'Unisex');
});

test('fitVon/passformVon: konsistent aus dem Geschlecht', () => {
  assert.equal(fitVon('Damen'), 'Damen, taillierter Schnitt mit Seitennähten');
  assert.equal(fitVon('Unisex'), 'Unisex, normale Passform');
  assert.equal(passformVon('Damen'), 'tailliert');
  assert.equal(passformVon('Herren'), 'regular');
});

test('GEO_REP/TYP_LABEL decken jeden ProductType ab (Wächter gegen neue Typen)', () => {
  for (const t of ALLE_PRODUCT_TYPES) {
    assert.ok(GEO_REP[t], `GEO_REP fehlt für "${t}"`);
    assert.ok(TYP_LABEL[t], `TYP_LABEL fehlt für "${t}"`);
  }
});
