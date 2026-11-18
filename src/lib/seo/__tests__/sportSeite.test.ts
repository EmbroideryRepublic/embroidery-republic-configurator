/**
 * Landingpage „Sportbekleidung bedrucken“ (config/seo/dtfSeiten.ts → sportSeite) und Markenseite Just Cool.
 *
 * „Sportbekleidung“ ist ein Sammelbegriff ohne Mehrzahl: Die allgemeine Art-Vorlage („Es gibt {anzahl} {artPlural}“) hätte „10 Sportbekleidung“
 * ergeben. Die Sportseite hat deshalb eigene Sätze und Preisbeispiele, die das Kleidungsstück nennen („1 Sport-T-Shirt“). Genannt werden nur
 * Kleidungsstücke, die es im Katalog gibt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { DTF_SEITEN } from '@/config/seo/dtfSeiten';
import { PRODUCTS } from '@/config/products';
import { dtfBeispiele, dtfFakten, fuelleDtf } from '../dtfSeite';
import { berechneBeispiele } from '../kategorieSeite';
import { kategorieLink } from '../kategorieAdresse';
import sitemap from '@/app/sitemap';
import { kanonischeBasisUrl } from '../basisUrl';

const seite = DTF_SEITEN.find((s) => s.art === 'sport')!;
const fakten = dtfFakten(seite);

test('die Sportseite existiert und ist erreichbar verlinkt (Kategorielink, Sitemap)', () => {
  assert.ok(seite, 'keine Sportseite');
  assert.equal(seite.slug, 'sportbekleidung-bedrucken');
  assert.equal(kategorieLink('sport'), `/${seite.slug}`);
  const urls = sitemap().map((e) => e.url);
  assert.equal(urls.filter((u) => u === `${kanonischeBasisUrl()}/${seite.slug}`).length, 1);
});

test('Texte sind grammatisch: nie „10 Sportbekleidung“, kein Rest-Platzhalter, nennen die Anzahl der Modelle, versprechen keine Stickerei', () => {
  const alle = [
    fuelleDtf(seite.titel, seite, fakten),
    fuelleDtf(seite.h1, seite, fakten),
    fuelleDtf(seite.beschreibung, seite, fakten),
    ...seite.einleitung.map((t) => fuelleDtf(t, seite, fakten)),
    ...seite.fragen.flatMap((f) => [fuelleDtf(f.q, seite, fakten), fuelleDtf(f.a, seite, fakten)]),
  ];
  for (const t of alle) {
    assert.doesNotMatch(t, /\d+\s+Sportbekleidung\b/, `ungrammatisch: ${t}`);
    assert.doesNotMatch(t, /[{}]/, `Rest-Platzhalter: ${t}`);
    assert.doesNotMatch(t, /Stickerei|besticken|Bestickung/i, `verspricht Stickerei: ${t}`);
    assert.doesNotMatch(t, /atmungsaktiv|schnelltrocknend|feuchtigkeitsableitend|antibakteriell/i, `unbelegtes Funktionsversprechen: ${t}`);
  }
  assert.match(fuelleDtf(seite.beschreibung, seite, fakten), new RegExp(`^${fakten.anzahl} Modelle Sportbekleidung`));
});

test('die Einleitung nennt nur Kleidungsstücke, die es im Sortiment gibt (Sport-T-Shirt, Langarmshirt, Tanktop)', () => {
  const arten = new Set(PRODUCTS.filter((p) => p.productType === 'sport').map((p) => p.detailedDescription?.productType ?? ''));
  const einleitung = fuelleDtf(seite.einleitung[0]!, seite, fakten);
  if (/Sport-T-Shirts/.test(einleitung)) assert.ok(arten.has('Sport-T-Shirt'), 'Sport-T-Shirts genannt, aber nicht im Katalog');
  if (/Langarmshirts/.test(einleitung)) assert.ok([...arten].some((a) => /Langarmshirt/.test(a)), 'Langarmshirts genannt, aber nicht im Katalog');
  if (/Tanktops/.test(einleitung)) assert.ok(arten.has('Tanktop'), 'Tanktops genannt, aber nicht im Katalog');
});

test('Titel und Beschreibung passen ins Google-Budget (60 bzw. 70–160 Zeichen)', () => {
  const titel = fuelleDtf(seite.titel, seite, fakten);
  const beschr = fuelleDtf(seite.beschreibung, seite, fakten);
  assert.ok(titel.length <= 60, `${titel.length}: ${titel}`);
  assert.match(titel, /ab 1 Stück/);
  assert.ok(beschr.length >= 70 && beschr.length <= 160, `${beschr.length}: ${beschr}`);
});

test('Preisbeispiele nennen das Kleidungsstück, gehören zur Produktart sport und sind berechenbar', async () => {
  const wahl = dtfBeispiele(seite, fakten);
  assert.equal(wahl.produkt.productType, 'sport');
  assert.equal(wahl.produkt.detailedDescription?.productType, 'Sport-T-Shirt', 'das Sport-T-Shirt ist das Vergleichsteil');
  for (const b of wahl.beispiele) {
    assert.match(b.beschriftung, /^(1 Sport-T-Shirt|10 Sport-T-Shirts) · DTF-Transferdruck/, b.beschriftung);
    assert.doesNotMatch(b.beschriftung, /Sportbekleidung/);
    assert.ok(Object.keys(b.groessen).every((g) => wahl.produkt.sizes.includes(g)), `${b.beschriftung}: Größen nicht im Produkt`);
  }
  const berechnet = await berechneBeispiele({ slug: seite.slug, beispiele: wahl.beispiele });
  assert.equal(berechnet.length, 2);
  assert.ok(berechnet[1]!.stueckpreis <= berechnet[0]!.stueckpreis, 'bei 10 Stück nie teurer je Stück als bei 1');
});

test('Einzelstück-Antwort bleibt wortgleich zur freigegebenen Antwort', () => {
  const frage = seite.fragen.find((f) => /einzelnes Sportteil/.test(f.q))!;
  assert.ok(frage);
  assert.match(frage.a, /^Ja. Es gibt keine Mindestbestellmenge/);
  assert.match(frage.a, /2× M, 2× L und 1× XL/);
  assert.match(frage.a, /Staffelpreise gelten ab 5 Stück.$/);
});

test('Just-Cool-Markenseite: existiert, hat mindestens 7 Modelle und trägt die Sportware mit', () => {
  const marke = DTF_SEITEN.find((s) => s.marke === 'Just Cool');
  assert.ok(marke, 'keine Just-Cool-Seite');
  assert.equal(marke.slug, 'just-cool-bedrucken');
  const f = dtfFakten(marke);
  assert.ok(f.anzahl >= 7, `nur ${f.anzahl} Modelle`);
  assert.ok(f.produkte.some((p) => p.productType === 'sport'), 'Sportware fehlt auf der Markenseite');
});
