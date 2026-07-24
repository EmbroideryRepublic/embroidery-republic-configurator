/**
 * Prüfungen des Produktbaums.
 *
 * Der wichtigste Fall ist die Navigationsregel: Unisexware muss in allen
 * drei Hauptgruppen auftauchen, sonst versteckt die interne Klassifizierung
 * ganze Produktarten (im echten Katalog wären das sämtliche Hoodies).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { geschlechterVon } from '@/config/products/facetten';
import {
  ARTFOLGE, HAUPTGRUPPEN, LEERER_FILTER, anzahlAktiverFilter, baueBaum, gehoertZu,
  materialKurz, modellBadges, modelleVon, passtZurSuche, type Browserfilter,
} from '../produktbaum';

const mit = (teil: Partial<Browserfilter>): Browserfilter => ({ ...LEERER_FILTER, ...teil });
const BAUM = baueBaum(PRODUCTS, LEERER_FILTER);

test('jeder Artikel ist über mindestens einen Ast erreichbar', () => {
  const erreichbar = new Set<string>();
  for (const g of BAUM) for (const a of g.arten) for (const m of a.modelle) erreichbar.add(m.id);
  assert.equal(erreichbar.size, PRODUCTS.length, 'kein Artikel darf sich hinter der Datenstruktur verstecken');
});

test('Unisexware steht in allen drei Hauptgruppen', () => {
  const unisex = PRODUCTS.filter((p) => geschlechterVon(p).includes('unisex'));
  assert.ok(unisex.length > 0, 'ohne Unisexware sagt dieser Test nichts');

  for (const p of unisex) {
    for (const g of HAUPTGRUPPEN) {
      assert.ok(gehoertZu(p, g), `${p.name} fehlt in Gruppe ${g}`);
    }
  }
});

test('reine Herrenware erscheint nicht bei Damen – und umgekehrt', () => {
  for (const p of PRODUCTS) {
    const eigen = geschlechterVon(p);
    if (eigen.includes('unisex')) continue;
    if (eigen.includes('herren')) assert.equal(gehoertZu(p, 'damen'), false, `${p.name}`);
    if (eigen.includes('damen')) assert.equal(gehoertZu(p, 'herren'), false, `${p.name}`);
  }
});

test('die Gruppe Unisex führt ausschließlich Unisexware', () => {
  const drin = PRODUCTS.filter((p) => gehoertZu(p, 'unisex'));
  for (const p of drin) assert.ok(geschlechterVon(p).includes('unisex'), `${p.name}`);
});

test('jede Hauptgruppe führt alle Produktarten des Sortiments', () => {
  // Genau das war der Grund für die Regel: ohne sie hätte „Herren" keine
  // Hoodies, weil alle Hoodies als Unisex geführt werden.
  const alleArten = new Set(PRODUCTS.map((p) => p.productType));
  for (const g of BAUM) {
    const vorhanden = new Set(g.arten.map((a) => a.art));
    for (const art of alleArten) {
      assert.ok(vorhanden.has(art), `Gruppe ${g.gruppe} führt keine ${art}`);
    }
  }
});

test('Gruppenzähler stimmt mit der Summe seiner Arten überein', () => {
  for (const g of BAUM) {
    const summe = g.arten.reduce((n, a) => n + a.anzahl, 0);
    assert.equal(summe, g.anzahl, `Gruppe ${g.gruppe}`);
  }
});

test('Produktarten stehen in fachlicher Reihenfolge, nicht nach Häufigkeit', () => {
  for (const g of BAUM) {
    const raenge = g.arten.map((a) => ARTFOLGE.indexOf(a.art));
    assert.deepEqual(raenge, [...raenge].sort((a, b) => a - b), `Gruppe ${g.gruppe}`);
  }
});

test('Modelle stehen günstigste zuerst', () => {
  for (const g of BAUM) {
    for (const a of g.arten) {
      for (let i = 1; i < a.modelle.length; i++) {
        assert.ok(a.modelle[i - 1]!.basePrice <= a.modelle[i]!.basePrice, `${g.gruppe}/${a.art}`);
      }
    }
  }
});

test('leere Produktarten verschwinden, leere Hauptgruppen bleiben stehen', () => {
  // Eine Suche ohne jeden Treffer darf die Navigation nicht wegräumen.
  const baum = baueBaum(PRODUCTS, mit({ suche: 'gibtesnicht-xyz' }));
  assert.equal(baum.length, 3, 'die drei Hauptgruppen bleiben');
  for (const g of baum) {
    assert.equal(g.anzahl, 0);
    assert.equal(g.arten.length, 0, 'Arten ohne Treffer werden nicht angeboten');
  }
});

test('die Suche greift auf den gesamten Katalog, nicht auf einen Ast', () => {
  const marke = PRODUCTS[0]!.brand;
  const baum = baueBaum(PRODUCTS, mit({ suche: marke }));
  const gefunden = new Set<string>();
  for (const g of baum) for (const a of g.arten) for (const m of a.modelle) gefunden.add(m.id);

  const erwartet = PRODUCTS.filter((p) => p.brand === marke).map((p) => p.id);
  for (const id of erwartet) assert.ok(gefunden.has(id), `${id} fehlt im Suchergebnis`);
});

test('Suche findet über Name, Marke und Material', () => {
  const p = PRODUCTS[0]!;
  assert.ok(passtZurSuche(p, p.name.slice(0, 5)));
  assert.ok(passtZurSuche(p, p.brand.toUpperCase()), 'Groß-/Kleinschreibung darf egal sein');
  assert.ok(passtZurSuche(p, p.material.slice(0, 5)));
  assert.ok(passtZurSuche(p, '   '), 'leere Suche schließt nichts aus');
});

test('Favoriten schränken auf die gemerkten Artikel ein', () => {
  const merk = PRODUCTS.slice(0, 3).map((p) => p.id);
  const baum = baueBaum(PRODUCTS, mit({ nurFavoriten: true, favoriten: merk }));
  const gefunden = new Set<string>();
  for (const g of baum) for (const a of g.arten) for (const m of a.modelle) gefunden.add(m.id);
  for (const id of gefunden) assert.ok(merk.includes(id));
});

test('Preisgrenze schließt den Rand ein', () => {
  const min = Math.min(...PRODUCTS.map((p) => p.basePrice));
  const baum = baueBaum(PRODUCTS, mit({ preisMax: min }));
  const gefunden: number[] = [];
  for (const g of baum) for (const a of g.arten) for (const m of a.modelle) gefunden.push(m.basePrice);
  assert.ok(gefunden.length > 0, 'der günstigste Artikel muss seine eigene Grenze überstehen');
  assert.ok(gefunden.every((preis) => preis === min));
});

test('Filter wirken als UND', () => {
  const p = PRODUCTS[0]!;
  const baum = baueBaum(PRODUCTS, mit({ marke: p.brand, qualitaet: p.qualityTier }));
  for (const g of baum) {
    for (const a of g.arten) {
      for (const m of a.modelle) {
        assert.equal(m.brand, p.brand);
        assert.equal(m.qualityTier, p.qualityTier);
      }
    }
  }
});

test('der Filterzähler zählt nur echte Einschränkungen, nicht die Suche', () => {
  assert.equal(anzahlAktiverFilter(LEERER_FILTER), 0);
  assert.equal(anzahlAktiverFilter(mit({ suche: 'hoodie' })), 0, 'Suche ist kein Filter');
  assert.equal(anzahlAktiverFilter(mit({ marke: 'Gildan', preisMax: 30 })), 2);
});

test('modelleVon liefert genau den geöffneten Ast', () => {
  const gruppe = BAUM.find((g) => g.arten.length > 0)!;
  const ast = gruppe.arten[0]!;
  const modelle = modelleVon(BAUM, gruppe.gruppe, ast.art);
  assert.deepEqual(modelle.map((m) => m.id), ast.modelle.map((m) => m.id));
  assert.deepEqual(modelleVon(BAUM, gruppe.gruppe, 'vest'), [], 'unbekannter Ast liefert leer, wirft nicht');
});

test('materialKurz beschönigt nichts', () => {
  assert.equal(materialKurz('100% Baumwolle'), '100 % Baumwolle');
  assert.equal(materialKurz('100% biologisch erzeugte Baumwolle'), 'Bio-Baumwolle');
  assert.equal(materialKurz('80% biologisch erzeugte Baumwolle, 20% recyceltes Polyester'), 'Bio-Mix');
  assert.equal(materialKurz('80% Baumwolle, 20% Polyester'), 'Baumwoll-Mix', 'ein Mix wird nicht zu 100 %');
  assert.equal(materialKurz('100% Micro-Polyester'), 'Polyester');
  assert.equal(materialKurz('100% Polyester (Fleece)'), 'Polyester');
});

test('jedes Modell trägt Zusammensetzung und Gewicht, Güteklasse nur wenn hochwertig', () => {
  for (const p of PRODUCTS) {
    const badges = modellBadges(p);
    assert.ok(badges.length >= 2 && badges.length <= 3, `${p.name}: ${badges.length} Badges`);
    assert.equal(badges[1]!.text, `${p.weightGsm} g/m²`);

    const gold = badges.find((b) => b.ton === 'gold');
    if (p.qualityTier === 'premium' || p.qualityTier === 'luxury') {
      assert.ok(gold, `${p.name} sollte eine Güteklasse zeigen`);
    } else {
      assert.equal(gold, undefined, `${p.name} (${p.qualityTier}) sollte KEIN Güte-Badge zeigen`);
    }
  }
});

test('der Baum verändert die Eingabeliste nicht', () => {
  const vorher = PRODUCTS.map((p) => p.id);
  baueBaum(PRODUCTS, LEERER_FILTER);
  assert.deepEqual(PRODUCTS.map((p) => p.id), vorher);
});
