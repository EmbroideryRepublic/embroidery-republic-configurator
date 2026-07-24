/**
 * Absicherung der Produktseiten-Datenschicht.
 *
 * Die Seiten werden vollständig aus dem Katalog erzeugt. Diese Tests stellen
 * sicher, dass jedes Produkt eine vollständige Seite bekommt – ein neu
 * aufgenommenes Produkt mit fehlenden Pflichtangaben fällt hier auf, bevor
 * es eine halbleere Seite ausliefert.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alleProduktSlugs, ladeProduktseite } from '../productPage';
import { PRODUCTS } from '@/config/products';

test('jedes Katalogprodukt hat einen Slug', () => {
  assert.equal(alleProduktSlugs().length, PRODUCTS.length);
});

test('Slugs sind eindeutig', () => {
  const slugs = alleProduktSlugs();
  assert.equal(new Set(slugs).size, slugs.length);
});

test('Slugs sind URL-tauglich', () => {
  for (const s of alleProduktSlugs()) {
    assert.match(s, /^[a-z0-9-]+$/, `Slug "${s}" enthält unzulässige Zeichen`);
  }
});

test('jede Produktseite lädt und trägt die Pflichtangaben', () => {
  for (const slug of alleProduktSlugs()) {
    const d = ladeProduktseite(slug);
    assert.ok(d, `${slug}: Seite lädt nicht`);

    const p = d.produkt;
    assert.ok(p.name.trim(), `${slug}: kein Name`);
    assert.ok(p.brand.trim(), `${slug}: keine Marke`);
    assert.ok(p.description.trim(), `${slug}: keine Beschreibung`);
    assert.ok(p.material.trim(), `${slug}: kein Material`);
    assert.ok(p.careInstructions.trim(), `${slug}: keine Pflegehinweise`);
    assert.ok(p.fit.trim(), `${slug}: keine Passform`);
    assert.ok(p.weightGsm > 0, `${slug}: kein Flächengewicht`);
    assert.ok(p.basePrice > 0, `${slug}: kein Preis`);
    assert.ok(p.sizes.length > 0, `${slug}: keine Größen`);
    assert.ok(p.colors.length > 0, `${slug}: keine Farben`);
    assert.ok(d.artLabel.trim(), `${slug}: kein Art-Label`);
    assert.ok(d.stufeLabel.trim(), `${slug}: kein Stufen-Label`);
  }
});

test('jedes Produkt hat Bilder für alle geführten Ansichten', () => {
  for (const slug of alleProduktSlugs()) {
    const p = ladeProduktseite(slug)!.produkt;
    const noetig = p.hasSleeves === false
      ? (['front', 'back'] as const)
      : (['front', 'back', 'sleeve_left', 'sleeve_right'] as const);

    for (const c of p.colors) {
      for (const v of noetig) {
        assert.ok(c.images[v], `${slug}/${c.id}: Bild für ${v} fehlt`);
      }
    }
  }
});

test('jede Produktseite kennt ihre Veredelungsflächen', () => {
  for (const slug of alleProduktSlugs()) {
    const d = ladeProduktseite(slug)!;
    assert.ok(d.veredelungsflaechen.length >= 2, `${slug}: weniger als 2 Flächen`);
    for (const f of d.veredelungsflaechen) {
      assert.ok(f.breiteCm > 0 && f.hoeheCm > 0, `${slug}/${f.ansicht}: Fläche <= 0`);
    }
  }
});

test('ähnliche Produkte sind derselben Art und schließen das Produkt selbst aus', () => {
  for (const slug of alleProduktSlugs()) {
    const d = ladeProduktseite(slug)!;
    for (const a of d.aehnliche) {
      assert.notEqual(a.id, d.produkt.id, `${slug}: verweist auf sich selbst`);
      assert.equal(a.productType, d.produkt.productType, `${slug}: ${a.id} hat andere Art`);
    }
  }
});

test('unbekannter Slug liefert null statt zu werfen', () => {
  assert.equal(ladeProduktseite('gibt-es-nicht'), null);
});
