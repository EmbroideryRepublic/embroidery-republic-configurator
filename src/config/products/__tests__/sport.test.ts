/**
 * Wächter für die Sportbekleidung (Produktart "sport", scripts/importiereSport.mts).
 *
 * Sportware ist Erwachsenenware: gleiche Achse (Herren/Damen/Unisex) und gleiche Konfektionsgrößen wie T-Shirts & Co., aber ein
 * eigener Reiter „Sportbekleidung“. Sie darf sich weder mit Kinderware noch mit den klassischen Kategorien vermischen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../index';
import { PRODUCTS as SPORT } from '../sport.generated';
import { computeBasePrice } from '@/config/pricing/marginTiers';
import { KONFEKTIONSGROESSEN, groessenLeiterVon } from '../groessen';
import { ALLE_PRODUCT_TYPES, PRODUCT_TYPES } from '../productTypes';
import { naviGruppenVon } from '../naviAchsen';
import { geschlechterVon } from '../facetten';
import { produktFakten } from '@/lib/seo/produktFakten';

const KLEIDUNGSARTEN = new Set([
  'Sport-T-Shirt', 'Sport-Langarmshirt', 'Sport-Langarmshirt mit Viertelreißverschluss', 'Tanktop',
]);

test('es gibt Sportprodukte, und alle gehören zur Produktart "sport"', () => {
  assert.ok(SPORT.length >= 8, `nur ${SPORT.length} Sportprodukte`);
  for (const p of SPORT) assert.equal(p.productType, 'sport', p.id);
  assert.deepEqual(PRODUCTS.filter((p) => p.productType === 'sport').map((p) => p.id), SPORT.map((p) => p.id));
});

test('Sport-IDs sind eindeutig und tragen das Präfix sport-', () => {
  const ids = SPORT.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^sport-[a-z0-9]+$/, id);
  assert.equal(new Set(PRODUCTS.map((p) => p.id)).size, PRODUCTS.length, 'ID-Kollision mit dem übrigen Katalog');
});

test('Größen: Konfektionsleiter, sortiert, ohne Dubletten; die Maßtabelle deckt genau diese Größen ab, mit plausiblen Erwachsenenmaßen', () => {
  for (const p of SPORT) {
    assert.equal(p.sizeScale, undefined, `${p.id}: Sportware nutzt die Standard-Leiter`);
    assert.equal(groessenLeiterVon(p).id, 'konfektion-eu', p.id);
    assert.equal(new Set(p.sizes).size, p.sizes.length, `${p.id}: doppelte Größe`);
    const raenge = p.sizes.map((g) => KONFEKTIONSGROESSEN.indexOf(g));
    for (const r of raenge) assert.ok(r >= 0, `${p.id}: Größe nicht in der Konfektionsleiter`);
    assert.deepEqual([...raenge].sort((a, b) => a - b), raenge, `${p.id}: Größen nicht sortiert`);
    const tabelle = p.sizeGuide?.measurements ?? [];
    assert.deepEqual(tabelle.map((m) => m.size), p.sizes, `${p.id}: Maßtabelle ≠ Größen`);
    for (const m of tabelle) {
      assert.ok(m.breiteCm >= 38 && m.breiteCm <= 80, `${p.id} ${m.size}: Breite ${m.breiteCm} cm unplausibel`);
      assert.ok(m.hoeheCm >= 55 && m.hoeheCm <= 95, `${p.id} ${m.size}: Länge ${m.hoeheCm} cm unplausibel`);
    }
    for (let i = 1; i < tabelle.length; i++) {
      assert.ok(tabelle[i]!.breiteCm >= tabelle[i - 1]!.breiteCm, `${p.id}: Breite fällt bei ${tabelle[i]!.size}`);
      assert.ok(tabelle[i]!.hoeheCm >= tabelle[i - 1]!.hoeheCm, `${p.id}: Länge fällt bei ${tabelle[i]!.size}`);
    }
  }
});

test('Ansichten: immer Vorder- und Rückseite; Ärmel nur als Paar; Tanktops ohne Ärmel', () => {
  for (const p of SPORT) {
    const views = p.views ?? [];
    assert.ok(views.includes('front') && views.includes('back'), `${p.id}: front/back fehlt`);
    const links = views.includes('sleeve_left');
    const rechts = views.includes('sleeve_right');
    assert.equal(links, rechts, `${p.id}: Ärmel nur einseitig`);
    if (p.detailedDescription?.productType === 'Tanktop') assert.ok(!links, `${p.id}: Tanktop mit Ärmelansicht`);
    assert.equal(views.length, links ? 4 : 2, `${p.id}: unerwartete Ansichten ${views.join(',')}`);
  }
});

test('Preis: Einkaufspreis > 0, Grundpreis nach derselben Formel wie beim übrigen Katalog', () => {
  for (const p of SPORT) {
    assert.ok(p.purchasePrice > 0, p.id);
    assert.equal(p.basePrice, computeBasePrice(p.purchasePrice, p.qualityTier), p.id);
  }
});

test('Farben: eindeutige IDs, gültiger Hex, mindestens eine Farbe', () => {
  for (const p of SPORT) {
    assert.ok(p.colors.length > 0, p.id);
    assert.equal(new Set(p.colors.map((c) => c.id)).size, p.colors.length, `${p.id}: doppelte Farb-ID`);
    for (const c of p.colors) assert.match(c.hex, /^#[0-9A-F]{6}$/, `${p.id} ${c.name}`);
  }
});

test('Navigation: Sportware landet nur in Herren/Damen/Unisex (nie unter Kinder) und in mindestens einer Gruppe', () => {
  for (const p of SPORT) {
    const gruppen = naviGruppenVon(p);
    assert.ok(gruppen.length > 0, `${p.id}: in keiner Gruppe`);
    for (const g of gruppen) assert.ok(['herren', 'damen', 'unisex'].includes(g), `${p.id}: Gruppe ${g}`);
    assert.ok(!geschlechterVon(p).includes('kinder'), `${p.id}: als Kinderware eingeordnet`);
  }
});

test('Produktart "sport": Achse „geschlecht“, Konfektionsgrößen, Sammelbegriff, gültige Komplement-Verweise', () => {
  const def = PRODUCT_TYPES.sport!;
  assert.equal(def.naviAchse, 'geschlecht');
  assert.equal(def.groessenLeiter, 'konfektion-eu');
  assert.equal(def.sammelbegriff, true);
  for (const k of def.komplement) assert.ok(ALLE_PRODUCT_TYPES.includes(k), `Komplement ${k} unbekannt`);
  // „kids“ bleibt ein eigener Zweig und folgt direkt nach Sport.
  assert.ok(PRODUCT_TYPES.kids!.order > def.order);
});

test('die Kleidungsart steht in detailedDescription.productType (die Produktart ist für alle Sportware "sport")', () => {
  for (const p of SPORT) {
    assert.ok(KLEIDUNGSARTEN.has(p.detailedDescription?.productType ?? ''), `${p.id}: ${p.detailedDescription?.productType}`);
  }
});

test('Kundentexte: keine Lieferantenhinweise, keine Leistungsversprechen, die der Lieferant nicht belegt', () => {
  for (const p of SPORT) {
    const text = [p.name, p.tagline, p.description, p.detailedDescription?.materialDetail ?? ''].join(' ');
    assert.doesNotMatch(text, /textil-grosshandel|Lieferant|Großhandel/i, `${p.id}: Lieferantenhinweis`);
    assert.doesNotMatch(text, /atmungsaktiv|feuchtigkeits|schnelltrocknend|antibakteriell|UV-?Schutz/i, `${p.id}: unbelegtes Funktionsversprechen`);
  }
});

test('Produktseitentext: Sammelbegriff grammatisch („zu den … Modellen der Sportbekleidung“), nie „den schwereren Sportbekleidung“', () => {
  for (const p of SPORT) {
    const fakten = produktFakten(p, p.detailedDescription?.productType ?? 'Sportbekleidung', [], false);
    const text = fakten.absaetze.join(' ');
    assert.doesNotMatch(text, /(schwereren|leichteren) Sportbekleidung/, `${p.id}: ${text}`);
    assert.doesNotMatch(text, /Gewichtsbereich der Sportbekleidung/, `${p.id}: ${text}`);
  }
  // Mindestens ein Sportprodukt hat genug Vergleichsmodelle für die Einordnung (sonst prüft der Test nichts).
  const mitEinordnung = SPORT.map((p) => produktFakten(p, 'Sport-T-Shirt', [], false).absaetze.join(' ')).filter((t) => /Modell(e|en) der Sportbekleidung/.test(t));
  assert.ok(mitEinordnung.length > 0, 'keine Gewichtseinordnung erzeugt');
});
