/**
 * Prüfungen des Produktbaums (baueBaum) – generische Baum-Eigenschaften,
 * unabhängig von der konkreten Navigationsachse. Die achsenspezifische
 * Semantik (Geschlechts-Überschneidung, „jedes Produkt landet in einer
 * Gruppe") liegt in config/products/__tests__/naviAchsen.test.ts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { farbgruppenVon } from '@/lib/catalog/filter';
import { geschlechterVon } from '@/config/products/facetten';
import type { Farbgruppe } from '@/config/products/types';
import {
  ARTFOLGE, LEERER_FILTER, anzahlAktiverFilter, baueBaum,
  materialKurz, modellBadges, modelleVon, passtZumFilter, passtZurSuche, type Browserfilter,
} from '../produktbaum';

const mit = (teil: Partial<Browserfilter>): Browserfilter => ({ ...LEERER_FILTER, ...teil });
const BAUM = baueBaum(PRODUCTS, LEERER_FILTER);

test('jeder Artikel ist über mindestens einen Ast erreichbar', () => {
  const erreichbar = new Set<string>();
  for (const g of BAUM) for (const a of g.arten) for (const m of a.modelle) erreichbar.add(m.id);
  assert.equal(erreichbar.size, PRODUCTS.length, 'kein Artikel darf sich hinter der Datenstruktur verstecken');
});

test('Herren führt dank der Unisex-Überschneidung alle Produktarten des Sortiments', () => {
  // Herren bekommt weiterhin JEDE Unisexware zusätzlich (naviAchsen.ts,
  // gruppenVon) – für den aktuellen Katalog deckt das alle Arten ab. Die
  // achsenspezifische Begründung steht im naviAchsen-Test; hier nur die
  // Baum-Eigenschaft für die eine Gruppe, für die sie gilt.
  const alleArten = new Set(PRODUCTS.map((p) => p.productType));
  const herren = BAUM.find((g) => g.gruppe === 'herren');
  assert.ok(herren, 'Gruppe "herren" muss im Baum existieren');
  const vorhanden = new Set(herren!.arten.map((a) => a.art));
  for (const art of alleArten) {
    assert.ok(vorhanden.has(art), `Herren führt keine ${art}`);
  }
});

test('Damen führt nur Arten, für die es echte Damenware gibt (keine Unisex-Überschneidung)', () => {
  // Bewusst NICHT dieselbe Rundum-Prüfung wie bei Herren: Damen darf eine
  // Produktart fehlen, wenn das Sortiment dafür keine echte Damenware
  // führt – korrekt leer ist hier richtiger als Herrenware einzublenden
  // (siehe naviAchsen.ts, gruppenVon der Geschlechtsachse).
  const damen = BAUM.find((g) => g.gruppe === 'damen');
  assert.ok(damen, 'Gruppe "damen" muss im Baum existieren');
  for (const a of damen!.arten) {
    const hatEchteDamenware = PRODUCTS.some((p) => p.productType === a.art && geschlechterVon(p).includes('damen'));
    assert.ok(hatEchteDamenware, `Damen führt ${a.art}, aber kein Produkt dieser Art ist tatsächlich als Damenware getaggt`);
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
  assert.equal(baum.length, BAUM.length, 'die Hauptgruppen der aktiven Achsen bleiben (springen nicht beim Tippen)');
  assert.ok(baum.length > 0, 'es gibt mindestens eine Hauptgruppe');
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

test('Größenfilter wirkt als ODER innerhalb der Auswahl', () => {
  const groessen = ['S', 'M'];
  const baum = baueBaum(PRODUCTS, mit({ groesse: groessen }));
  for (const g of baum) {
    for (const a of g.arten) {
      for (const m of a.modelle) {
        assert.ok(groessen.some((s) => m.sizes.includes(s)), `${m.id} hat keine der gewählten Größen`);
      }
    }
  }
});

test('Farbfilter wirkt als ODER innerhalb der Auswahl', () => {
  const farben = [...new Set(PRODUCTS.flatMap((p) => farbgruppenVon(p)))].slice(0, 2);
  const baum = baueBaum(PRODUCTS, mit({ farbe: farben }));
  for (const g of baum) {
    for (const a of g.arten) {
      for (const m of a.modelle) {
        assert.ok(farben.some((f) => farbgruppenVon(m).includes(f)), `${m.id} hat keine der gewählten Farben`);
      }
    }
  }
});

test('Größen- und Farbfilter wirken zusammen als UND', () => {
  const p = PRODUCTS.find((x) => x.sizes.length > 0 && farbgruppenVon(x).length > 0)!;
  const groesse = p.sizes[0]!;
  const farbe = farbgruppenVon(p)[0]!;
  const baum = baueBaum(PRODUCTS, mit({ groesse: [groesse], farbe: [farbe] }));
  const gefunden = new Set<string>();
  for (const g of baum) for (const a of g.arten) for (const m of a.modelle) gefunden.add(m.id);
  assert.ok(gefunden.has(p.id), 'ein Produkt, das beide Kriterien erfüllt, muss im Ergebnis stehen');
  for (const g of baum) {
    for (const a of g.arten) {
      for (const m of a.modelle) {
        assert.ok(m.sizes.includes(groesse) && farbgruppenVon(m).includes(farbe));
      }
    }
  }
});

test('passtZumFilter mit ausser blendet genau eine Mehrfachauswahl-Dimension aus (für die Facettenzählung)', () => {
  const p = PRODUCTS.find((x) => x.sizes.length > 0)!;
  const andereGroesse = ['gibtesnicht-xyz'];
  // Ohne Ausschluss: die falsche Größe schließt das Produkt aus.
  assert.equal(passtZumFilter(p, mit({ groesse: andereGroesse })), false);
  // Mit ausser: 'groesse' wird die Größen-Bedingung ignoriert – so zählt das
  // Filterpanel, wie viele Treffer eine ANDERE Größe hätte, unabhängig von
  // der aktuell (fälschlich) gewählten.
  assert.equal(passtZumFilter(p, mit({ groesse: andereGroesse }), 'groesse'), true);

  const ALLE_FARBGRUPPEN: Farbgruppe[] = [
    'schwarz', 'weiss', 'grau', 'blau', 'tuerkis', 'gruen',
    'gelb', 'orange', 'rot', 'rosa', 'lila', 'braun', 'beige',
  ];
  const andereFarbe = ALLE_FARBGRUPPEN.filter((f) => !farbgruppenVon(p).includes(f));
  assert.equal(passtZumFilter(p, mit({ farbe: andereFarbe })), false);
  assert.equal(passtZumFilter(p, mit({ farbe: andereFarbe }), 'farbe'), true);
});

test('Größen- und Farbfilter zählen als aktive Filter', () => {
  assert.equal(anzahlAktiverFilter(mit({ groesse: ['M'] })), 1);
  assert.equal(anzahlAktiverFilter(mit({ farbe: ['schwarz'] })), 1);
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

test('jedes Modell trägt Zusammensetzung (und Gewicht, falls bekannt), Güteklasse nur wenn hochwertig', () => {
  for (const p of PRODUCTS) {
    const badges = modellBadges(p);
    assert.ok(badges.length >= 1 && badges.length <= 3, `${p.name}: ${badges.length} Badges`);
    // Material-Badge ist immer die erste.
    // Gewicht-Badge genau dann, wenn eine Grammatur hinterlegt ist (optional,
    // siehe weightGsm-Kommentar in products/types.ts).
    const gewichtBadge = badges.find((b) => /\bg\/m²$/.test(b.text));
    if (p.weightGsm) {
      assert.equal(gewichtBadge?.text, `${p.weightGsm} g/m²`, `${p.name}: Gewicht-Badge fehlt/falsch`);
    } else {
      assert.equal(gewichtBadge, undefined, `${p.name}: unerwartetes Gewicht-Badge ohne Grammatur`);
    }

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
