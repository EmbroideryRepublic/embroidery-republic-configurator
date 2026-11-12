/**
 * Landingpage „Kinderbekleidung bedrucken“ (config/seo/dtfSeiten.ts → kinderSeite).
 *
 * „Kinderbekleidung“ ist kein zählbares Wort: Die allgemeine Art-Vorlage („Es gibt {anzahl} {artPlural}“) hätte „10 Kinderbekleidung“
 * ergeben. Die Kinderseite hat deshalb eigene Sätze und Preisbeispiele, die das Kleidungsstück nennen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { DTF_SEITEN } from '@/config/seo/dtfSeiten';
import { dtfBeispiele, dtfFakten, fuelleDtf } from '../dtfSeite';
import { berechneBeispiele } from '../kategorieSeite';
import { kategorieLink } from '../kategorieAdresse';
import sitemap from '@/app/sitemap';
import { kanonischeBasisUrl } from '../basisUrl';

const seite = DTF_SEITEN.find((s) => s.art === 'kids')!;
const fakten = dtfFakten(seite);

test('die Kinderseite existiert und ist erreichbar verlinkt (Kategorielink, Sitemap)', () => {
  assert.ok(seite, 'keine Kinderseite');
  assert.equal(seite.slug, 'kinderbekleidung-bedrucken');
  assert.equal(kategorieLink('kids'), `/${seite.slug}`);
  const urls = sitemap().map((e) => e.url);
  assert.equal(urls.filter((u) => u === `${kanonischeBasisUrl()}/${seite.slug}`).length, 1);
});

test('Texte sind grammatisch: nie „10 Kinderbekleidung“, kein Rest-Platzhalter, nennen die Anzahl der Modelle', () => {
  const alle = [
    fuelleDtf(seite.titel, seite, fakten),
    fuelleDtf(seite.h1, seite, fakten),
    fuelleDtf(seite.beschreibung, seite, fakten),
    ...seite.einleitung.map((t) => fuelleDtf(t, seite, fakten)),
    ...seite.fragen.flatMap((f) => [fuelleDtf(f.q, seite, fakten), fuelleDtf(f.a, seite, fakten)]),
  ];
  for (const t of alle) {
    assert.doesNotMatch(t, /\d+\s+Kinderbekleidung\b/, `ungrammatisch: ${t}`);
    assert.doesNotMatch(t, /[{}]/, `Rest-Platzhalter: ${t}`);
    assert.doesNotMatch(t, /Stickerei|besticken|Bestickung/i, `verspricht Stickerei: ${t}`);
  }
  assert.match(fuelleDtf(seite.beschreibung, seite, fakten), new RegExp(`^${fakten.anzahl} Modelle Kinderbekleidung`));
});

test('Titel und Beschreibung passen ins Google-Budget (60 bzw. 70–160 Zeichen)', () => {
  const titel = fuelleDtf(seite.titel, seite, fakten);
  const beschr = fuelleDtf(seite.beschreibung, seite, fakten);
  assert.ok(titel.length <= 60, `${titel.length}: ${titel}`);
  assert.match(titel, /ab 1 Stück/);
  assert.ok(beschr.length >= 70 && beschr.length <= 160, `${beschr.length}: ${beschr}`);
});

test('Preisbeispiele nennen das Kleidungsstück, passen zur Produktart und sind berechenbar', async () => {
  const wahl = dtfBeispiele(seite, fakten);
  assert.equal(wahl.produkt.productType, 'kids');
  for (const b of wahl.beispiele) {
    assert.match(b.beschriftung, /^(1 Kinder-[A-Za-z-]+|10 Kinder-[A-Za-z-]+s) · DTF-Transferdruck/, b.beschriftung);
    assert.doesNotMatch(b.beschriftung, /Kinderbekleidung/);
    assert.ok(Object.keys(b.groessen).every((g) => wahl.produkt.sizes.includes(g)), `${b.beschriftung}: Größen nicht im Produkt`);
  }
  const berechnet = await berechneBeispiele({ slug: seite.slug, beispiele: wahl.beispiele });
  assert.equal(berechnet.length, 2);
  assert.ok(berechnet[1]!.stueckpreis <= berechnet[0]!.stueckpreis, 'bei 10 Stück nie teurer je Stück als bei 1');
});

test('FAQ zu den Größen stimmt mit dem Katalog überein: Kindergrößen stehen wortgleich auf der Produktseite', () => {
  const frage = seite.fragen.find((f) => /Größen/.test(f.q));
  assert.ok(frage, 'keine Größen-Frage');
  assert.match(frage.a, /Körpergröße in cm/);
  assert.match(frage.a, /Alter/);
  assert.match(frage.a, /Größentabelle/);
});

test('Einzelstück-Antwort nennt ein Kindergrößen-Beispiel statt M/L/XL und bleibt sonst wortgleich zur freigegebenen Antwort', () => {
  const frage = seite.fragen.find((f) => /einzelnes Kinderteil/.test(f.q))!;
  assert.match(frage.a, /2× 104, 2× 116 und 1× 128/);
  assert.doesNotMatch(frage.a, /2× M, 2× L und 1× XL/);
  assert.match(frage.a, /^Ja. Es gibt keine Mindestbestellmenge/);
  assert.match(frage.a, /Staffelpreise gelten ab 5 Stück.$/);
});
