/**
 * Tests der Aufbereitung für die MANUELLE Lieferantenbestellung.
 *
 * Der kritische Fall ist die nicht eindeutig zuordenbare Farbe: dort wirft
 * der Resolver bewusst. Passiert das ungefangen, ist die komplette
 * Bestell-Detailseite unbenutzbar – genau das darf nicht sein, denn ohne
 * diese Seite kann der Betreiber gar nicht bestellen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toManualPosition, buildManualSupplierGroups, buildPreisvergleich } from '../supplierOrderView';
import type { SupplierOrderPosition } from '@/lib/suppliers';
import type { EinkaufspreisNachweis } from '@/config/pricing/einkaufspreise';

/** Gildan Heavy Cotton in Navy – im Mapping verifiziert (Hex 263147). */
const navyPosition: SupplierOrderPosition = {
  supplierId: 'textil-grosshandel',
  productId: 'gildan-heavy-t',
  productName: 'Heavy Cotton T-Shirt',
  articleNumber: 'G5000',
  productUrl: 'https://www.textil-grosshandel.eu/gildan-heavy-cotton-adult-t-shirt.html',
  colorId: 'navy',
  colorName: 'Navy',
  sizes: [
    { size: 'M', quantity: 2 },
    { size: 'XL', quantity: 4 },
  ],
};

test('verifizierte Farbe: Shop-Name und Hex werden geliefert', () => {
  const pos = toManualPosition(navyPosition);

  assert.equal(pos.articleNumber, 'G5000');
  assert.equal(pos.shopColor.kind, 'eindeutig');
  if (pos.shopColor.kind !== 'eindeutig') return;
  assert.equal(pos.shopColor.hex, '263147', 'verifizierter Hex aus der Mapping-Tabelle');
  assert.ok(pos.shopColor.name.length > 0);
});

test('textil-grosshandel: Produkt-Link bekommt den Hex als ?color=-Parameter (Shop wählt die Farbe dann vor)', () => {
  const pos = toManualPosition(navyPosition);
  assert.equal(pos.productUrl, `${navyPosition.productUrl}?color=263147`);
});

test('unklare Farbe: Produkt-Link bleibt UNVERÄNDERT (kein Hex zum Anhängen)', () => {
  const unklar: SupplierOrderPosition = { ...navyPosition, colorId: 'nichtvorhanden', colorName: 'Fantasiefarbe' };
  assert.equal(toManualPosition(unklar).productUrl, navyPosition.productUrl);
});

const needenBasis: SupplierOrderPosition = {
  supplierId: 'needen',
  productId: 'gildan-ladies-heavy-t',
  productName: 'Heavy Cotton Damen T-Shirt',
  articleNumber: 'GN182',
  productUrl: 'https://www.needen.de/gildan-gn182-t-shirt-mit-rundhalsausschnitt-180-fur-damen-411244',
  colorId: 'black',
  colorName: 'Schwarz',
  sizes: [{ size: 'M', quantity: 1 }],
};

test('needen: Produkt-Link bekommt die produktspezifische Farb-ID als /c<id>-Pfadsegment (Shop wählt die Farbe dann vor)', () => {
  const pos = toManualPosition(needenBasis);
  assert.equal(pos.shopColor.kind, 'eindeutig');
  assert.equal(pos.productUrl, `${needenBasis.productUrl}/c20-farbe`, 'Schwarz = data-color-id 20 bei GN182 (productOverride)');
});

test('needen: OHNE verifizierte Farb-ID (nur Basis-Näherung) bleibt der Produkt-Link UNVERÄNDERT', () => {
  // 'charcoal' hat für GN182 KEINEN productOverride (siehe needen.ts – GN182
  // bietet zwei ähnlich dunkle Kandidaten, keine eindeutige Zuordnung).
  const pos = toManualPosition({ ...needenBasis, colorId: 'charcoal', colorName: 'Anthrazit' });
  assert.equal(pos.shopColor.kind, 'eindeutig', 'Voraussetzung: die Farbe löst trotzdem auf (Label-Näherung)');
  assert.equal(pos.productUrl, needenBasis.productUrl);
});

test('nur EIN bekannter Preis: kein Preisvergleich (sols-imperial-t hat noch keinen needen-Fund)', () => {
  const solsPosition: SupplierOrderPosition = { ...navyPosition, productId: 'sols-imperial-t' };
  assert.equal(toManualPosition(solsPosition).preisvergleich, undefined);
});

test('echte, live recherchierte Daten: gildan-heavy-t zeigt textil-grosshandel als günstigsten (2026-09-05 gegen needen geprüft)', () => {
  const pos = toManualPosition(navyPosition);
  assert.equal(pos.preisvergleich?.length, 2);
  assert.equal(pos.preisvergleich?.[0]?.lieferant, 'textil-grosshandel');
  assert.equal(pos.preisvergleich?.[0]?.istGuenstigster, true);
  assert.equal(pos.preisvergleich?.[1]?.lieferant, 'needen');
});

test('buildPreisvergleich: unter zwei Preispunkten kein Vergleich (auch bei genau einem)', () => {
  const einPreis: EinkaufspreisNachweis = {
    stufe: 'bekannt',
    preis: 3.5,
    preisImKatalog: 3.5,
    lieferant: 'textil-grosshandel',
  };
  assert.equal(buildPreisvergleich(einPreis), undefined);
  assert.equal(buildPreisvergleich(undefined), undefined);
});

test('buildPreisvergleich: zwei Preispunkte, günstigster wird markiert und steht zuerst', () => {
  const nachweis: EinkaufspreisNachweis = {
    stufe: 'bekannt',
    preis: 3.56,
    preisImKatalog: 3.56,
    lieferant: 'textil-grosshandel',
    alternativen: [
      { lieferant: 'needen', preis: 2.9, productUrl: 'https://www.needen.de/beispiel' },
    ],
  };
  const vergleich = buildPreisvergleich(nachweis);
  assert.equal(vergleich?.length, 2);
  assert.equal(vergleich?.[0]?.lieferant, 'needen', 'günstigster (2,90€) steht zuerst');
  assert.equal(vergleich?.[0]?.istGuenstigster, true);
  assert.equal(vergleich?.[0]?.productUrl, 'https://www.needen.de/beispiel');
  assert.equal(vergleich?.[0]?.supplierLabel, 'Needen (needen.de)');
  assert.equal(vergleich?.[1]?.lieferant, 'textil-grosshandel');
  assert.equal(vergleich?.[1]?.istGuenstigster, false);
});

test('buildPreisvergleich: mehrere Alternativen – nur EINE bekommt istGuenstigster', () => {
  const nachweis: EinkaufspreisNachweis = {
    stufe: 'bekannt',
    preis: 5,
    preisImKatalog: 5,
    lieferant: 'textil-grosshandel',
    alternativen: [
      { lieferant: 'needen', preis: 4.5 },
      { lieferant: 'wordans', preis: 3.9 },
    ],
  };
  const vergleich = buildPreisvergleich(nachweis);
  assert.equal(vergleich?.length, 3);
  assert.deepEqual(
    vergleich?.map((v) => v.lieferant),
    ['wordans', 'needen', 'textil-grosshandel'],
    'aufsteigend sortiert'
  );
  assert.equal(vergleich?.filter((v) => v.istGuenstigster).length, 1);
});

test('Gesamtmenge ist die Summe der Größen', () => {
  assert.equal(toManualPosition(navyPosition).totalQuantity, 6);
});

test('Größen bleiben vollständig und in Reihenfolge erhalten', () => {
  const pos = toManualPosition(navyPosition);
  assert.deepEqual(pos.sizes, [
    { size: 'M', quantity: 2 },
    { size: 'XL', quantity: 4 },
  ]);
});

test('nicht zuordenbare Farbe wirft NICHT, sondern meldet sich als unklar', () => {
  // 'nichtvorhanden' ist in keiner Mapping-Tabelle gepflegt.
  const unklar: SupplierOrderPosition = { ...navyPosition, colorId: 'nichtvorhanden', colorName: 'Fantasiefarbe' };

  const pos = toManualPosition(unklar);

  assert.equal(pos.shopColor.kind, 'unklar', 'die Seite muss trotzdem rendern');
  if (pos.shopColor.kind !== 'unklar') return;
  assert.ok(pos.shopColor.grund.length > 0, 'der Grund wird dem Betreiber angezeigt');
  // Orientierung: die für DIESES Produkt bekannten Shop-Farben.
  assert.ok(pos.shopColor.bekannteFarben.length > 0, 'bekannte Farben des Produkts als Hilfestellung');
  assert.ok(
    pos.shopColor.bekannteFarben.every((f) => typeof f.name === 'string' && f.name.length > 0),
    'jede Angabe hat einen Namen'
  );
  // Trotz unklarer Farbe bleiben Artikelnummer, Link und Mengen nutzbar.
  assert.equal(pos.articleNumber, 'G5000');
  assert.equal(pos.totalQuantity, 6);
});

test('Gruppierung summiert über alle Positionen eines Lieferanten', () => {
  const gruppen = buildManualSupplierGroups({
    'textil-grosshandel': [navyPosition, { ...navyPosition, sizes: [{ size: 'S', quantity: 5 }] }],
  });

  assert.equal(gruppen.length, 1);
  assert.equal(gruppen[0]!.supplierId, 'textil-grosshandel');
  assert.equal(gruppen[0]!.positions.length, 2);
  assert.equal(gruppen[0]!.totalQuantity, 11, '6 + 5');
  assert.ok(gruppen[0]!.supplierLabel.length > 0, 'Anzeigename des Lieferanten');
});

test('Lieferanten ohne Positionen erscheinen nicht', () => {
  assert.deepEqual(buildManualSupplierGroups({ 'textil-grosshandel': [] }), []);
});
