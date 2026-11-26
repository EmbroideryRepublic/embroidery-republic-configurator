/**
 * Google-Merchant-Feed: Pflichtangaben, eindeutige kurze IDs, gültiges XML, echte Bilder, keine Platzhalter.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { PRODUCTS } from '@/config/products';
import { PLATZHALTER_BILD } from '@/lib/assets';
import { feedEintraege, feedId, feedXml, MAX_BESCHREIBUNG, MAX_ID, MAX_TITEL, xmlText } from '../merchantFeed';

const BASIS = 'https://www.ergermany.de';

test('feedId: kurz, stabil, je Variante verschieden', () => {
  const a = feedId('gildan-hammer', 'navy', 'M');
  assert.equal(a, feedId('gildan-hammer', 'navy', 'M'));
  assert.notEqual(a, feedId('gildan-hammer', 'navy', 'L'));
  assert.notEqual(a, feedId('gildan-hammer', 'red', 'M'));
  assert.ok(a.length <= MAX_ID);
});

test('xmlText maskiert Sonderzeichen und entfernt unzulässige Steuerzeichen', () => {
  assert.equal(xmlText('B&C <Exact> "190"\u0001'), 'B&amp;C &lt;Exact&gt; &quot;190&quot;');
});

test('alle Einträge: Pflichtfelder, eindeutige IDs, Längen, Preis, Bilder vorhanden und kein Platzhalter', () => {
  const ids = new Set<string>();
  let gesamt = 0;
  for (const p of PRODUCTS) {
    for (const e of feedEintraege(p, BASIS)) {
      gesamt++;
      assert.ok(!ids.has(e.id), `${p.id}: doppelte ID ${e.id}`);
      ids.add(e.id);
      assert.ok(e.id.length <= MAX_ID);
      assert.ok(e.titel.length > 0 && e.titel.length <= MAX_TITEL, `${p.id}: Titel-Länge ${e.titel.length}`);
      assert.ok(e.beschreibung.length > 0 && e.beschreibung.length <= MAX_BESCHREIBUNG, `${p.id}: Beschreibung leer/zu lang`);
      assert.match(e.preis, /^\d+\.\d{2} EUR$/, `${p.id}: Preisformat ${e.preis}`);
      assert.ok(e.marke && e.farbe && e.groesse, `${p.id}: Marke/Farbe/Größe fehlt`);
      assert.ok(e.link === `${BASIS}/produkt/${p.id}`);
      for (const b of [e.bild, ...e.weitereBilder]) {
        assert.ok(b.startsWith(`${BASIS}/products/`) && !b.includes(PLATZHALTER_BILD), `${p.id}: unzulässiges Bild ${b}`);
        assert.ok(existsSync(path.join(process.cwd(), 'public', b.slice(BASIS.length))), `${p.id}: Bilddatei fehlt ${b}`);
      }
    }
  }
  assert.ok(gesamt >= 5000, `nur ${gesamt} Einträge`);
});

test('feedXml: wohlgeformt (alle &-Zeichen maskiert, Elemente paarig) und Anzahl stimmt', () => {
  const { xml, anzahl } = feedXml(PRODUCTS.slice(0, 20), BASIS);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">'));
  assert.equal((xml.match(/<item>/g) ?? []).length, anzahl);
  assert.equal((xml.match(/<\/item>/g) ?? []).length, anzahl);
  assert.equal((xml.match(/&(?!amp;|lt;|gt;|quot;)/g) ?? []).length, 0, 'unmaskiertes &');
  assert.ok(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(xml));
});
