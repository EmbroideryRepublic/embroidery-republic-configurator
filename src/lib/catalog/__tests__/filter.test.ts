/**
 * Prüfungen der reinen Filterlogik.
 *
 * Der wichtigste Fall ist die Facettenzählung „ohne den eigenen Filter":
 * Ohne sie könnte man nie einen zweiten Wert derselben Dimension dazuwählen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { berechneFacetten, merkmaleVon, passt, sortiere, spannen, type Merkmale } from '../filter';
import { LEERE_KRITERIEN, leseKriterien, schreibeKriterien, slug, type FilterKriterien } from '../kriterien';
import { PRODUCTS } from '@/config/products';

const ALLE: Merkmale[] = PRODUCTS.map(merkmaleVon);
const mit = (teil: Partial<FilterKriterien>): FilterKriterien => ({ ...LEERE_KRITERIEN, ...teil });

test('ohne Filter passen alle lieferbaren Produkte', () => {
  const treffer = ALLE.filter((m) => passt(m, LEERE_KRITERIEN));
  assert.equal(treffer.length, ALLE.filter((m) => m.lieferbar).length);
});

test('mehrere Werte einer Dimension wirken als ODER', () => {
  const nurTshirt = ALLE.filter((m) => passt(m, mit({ kategorie: ['tshirt'] }))).length;
  const nurPolo = ALLE.filter((m) => passt(m, mit({ kategorie: ['polo'] }))).length;
  const beide = ALLE.filter((m) => passt(m, mit({ kategorie: ['tshirt', 'polo'] }))).length;
  assert.equal(beide, nurTshirt + nurPolo);
});

test('verschiedene Dimensionen wirken als UND', () => {
  const k = mit({ kategorie: ['tshirt'], marke: [slug('Gildan')] });
  for (const m of ALLE.filter((x) => passt(x, k))) {
    assert.equal(m.kategorie, 'tshirt');
    assert.equal(m.marke, slug('Gildan'));
  }
});

test('Preisgrenzen schließen die Ränder ein', () => {
  const preise = ALLE.map((m) => m.preis).sort((a, b) => a - b);
  const min = preise[0]!;
  const treffer = ALLE.filter((m) => passt(m, mit({ preisVon: min, preisBis: min })));
  assert.ok(treffer.length > 0, 'der günstigste Artikel muss in seinen eigenen Grenzen liegen');
  assert.ok(treffer.every((m) => m.preis === min));
});

test('nicht lieferbare Produkte sind standardmäßig unsichtbar, mit Schalter sichtbar', () => {
  const kuenstlich: Merkmale = { ...ALLE[0]!, lieferbar: false };
  assert.equal(passt(kuenstlich, LEERE_KRITERIEN), false);
  assert.equal(passt(kuenstlich, mit({ auchNichtLieferbare: true })), true);
});

test('Facettenzählung ignoriert den EIGENEN Filter, berücksichtigt aber die anderen', () => {
  const gewaehlt = slug('Gildan');
  const k = mit({ marke: [gewaehlt] });
  const facetten = berechneFacetten(ALLE, k);

  // Andere Marken müssen weiterhin wählbar sein (Anzahl > 0) …
  const andere = facetten.marke.filter((f) => f.wert !== gewaehlt && f.anzahl > 0);
  assert.ok(andere.length > 0, 'sonst ließe sich nie eine zweite Marke dazuwählen');

  // … während eine andere Dimension sehr wohl auf die Marke eingeschränkt ist.
  const summeKategorien = facetten.kategorie.reduce((n, f) => n + f.anzahl, 0);
  const trefferMitMarke = ALLE.filter((m) => passt(m, k)).length;
  assert.equal(summeKategorien, trefferMitMarke);
});

test('Größen stehen in Konfektionsreihenfolge, nicht nach Häufigkeit', () => {
  // Nach Häufigkeit sortiert stünde hier „L, M, S, XL, XXL" – für Kundschaft
  // sieht das schlicht kaputt aus. Geprüft wird deshalb, dass die gelieferte
  // Reihenfolge eine Teilfolge der Konfektionsreihenfolge ist; welche Größen
  // der Bestand gerade führt, bleibt dabei offen.
  const FOLGE = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];
  const groessen = berechneFacetten(ALLE, LEERE_KRITERIEN).groesse.map((f) => f.wert);

  assert.ok(groessen.length > 3, 'es müssen überhaupt Größen vorkommen');
  const raenge = groessen.map((g) => FOLGE.indexOf(g));
  assert.ok(raenge.every((r) => r >= 0), `unbekannte Größe in ${groessen.join(', ')}`);
  assert.deepEqual(
    raenge,
    [...raenge].sort((a, b) => a - b),
    `Größen nicht in Konfektionsreihenfolge: ${groessen.join(', ')}`
  );
});

test('Facetten enthalten auch Werte ohne Treffer (Leiste springt nicht)', () => {
  const k = mit({ kategorie: ['jacket'] });
  const facetten = berechneFacetten(ALLE, k);
  assert.ok(facetten.marke.some((f) => f.anzahl === 0), 'Werte mit 0 müssen erhalten bleiben');
});

test('Sortierung: Preis auf/absteigend und Name', () => {
  const auf = sortiere(PRODUCTS, 'preis-auf');
  for (let i = 1; i < auf.length; i++) assert.ok(auf[i - 1]!.basePrice <= auf[i]!.basePrice);

  const ab = sortiere(PRODUCTS, 'preis-ab');
  for (let i = 1; i < ab.length; i++) assert.ok(ab[i - 1]!.basePrice >= ab[i]!.basePrice);

  const az = sortiere(PRODUCTS, 'name-az');
  const za = sortiere(PRODUCTS, 'name-za');
  assert.equal(az[0]!.id, za[za.length - 1]!.id);
});

test('Beliebtheit stellt Verkaufsschlager nach vorn', () => {
  const letzter = PRODUCTS[PRODUCTS.length - 1]!;
  const sortiert = sortiere(PRODUCTS, 'beliebtheit', { [letzter.id]: 999 });
  assert.equal(sortiert[0]!.id, letzter.id);
});

test('Sortierung verändert die Eingabeliste nicht', () => {
  const vorher = PRODUCTS.map((p) => p.id);
  sortiere(PRODUCTS, 'preis-ab');
  assert.deepEqual(PRODUCTS.map((p) => p.id), vorher);
});

test('Spannen umfassen den gesamten Bestand', () => {
  const s = spannen(ALLE);
  assert.ok(s.preisMin <= Math.min(...ALLE.map((m) => m.preis)));
  assert.ok(s.preisMax >= Math.max(...ALLE.map((m) => m.preis)));
  assert.ok(s.gewichtMin <= s.gewichtMax);
});

// ── Adresszeile ────────────────────────────────────────────────────────

test('Kriterien überstehen den Weg durch die Adresszeile unverändert', () => {
  const k = mit({
    kategorie: ['tshirt', 'polo'], marke: ['gildan'], farbe: ['schwarz'],
    material: ['bio-baumwolle'], preisVon: 10, preisBis: 30,
    sortierung: 'preis-auf', seite: 3, auchNichtLieferbare: true,
  });
  const zurueck = leseKriterien(Object.fromEntries(new URLSearchParams(schreibeKriterien(k))));
  assert.deepEqual(zurueck, k);
});

test('unbekannte Werte werden ignoriert statt abgelehnt', () => {
  const k = leseKriterien({
    farbe: 'schwarz,giftgruen', material: 'unfug', sortierung: 'quatsch',
    kategorie: 'tshirt,unfug', qualitaet: 'basic,unfug',
  });
  assert.deepEqual(k.farbe, ['schwarz']);
  assert.deepEqual(k.material, []);
  assert.deepEqual(k.kategorie, ['tshirt'], 'unbekannte Kategorie wird ignoriert, bekannte bleibt');
  assert.deepEqual(k.qualitaet, ['basic'], 'unbekannte Qualitätsstufe wird ignoriert, bekannte bleibt');
  assert.equal(k.sortierung, 'beliebtheit', 'unbekannte Sortierung fällt auf den Standard zurück');
});

test('eine gänzlich unbekannte Kategorie liefert leere Kriterien statt 0 Treffer', () => {
  const k = leseKriterien({ kategorie: 'nicht-existent' });
  assert.deepEqual(k.kategorie, []);
  const treffer = ALLE.filter((m) => passt(m, k));
  assert.equal(treffer.length, ALLE.filter((m) => m.lieferbar).length, 'ignorierter Filter lässt wieder alle lieferbaren Produkte durch');
});

test('Standardwerte erscheinen nicht in der Adresse', () => {
  assert.equal(schreibeKriterien(LEERE_KRITERIEN), '');
});

test('Slugs sind adresstauglich', () => {
  assert.equal(slug('Fruit of the Loom'), 'fruit-of-the-loom');
  assert.equal(slug("SOL'S"), 'sol-s');
  assert.equal(slug('James+Nicholson'), 'james-nicholson');
});
