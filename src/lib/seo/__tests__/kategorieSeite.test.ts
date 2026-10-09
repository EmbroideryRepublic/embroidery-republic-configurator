/**
 * Wächter für die Kategorie-Landingpages.
 *
 * Die Texte stehen in config/seo/kategorieSeiten.ts, Zahlen kommen aus Katalog
 * und Preis-Engine. Diese Tests verhindern die stillen Fehler, die bei solchen
 * Seiten typisch sind: eine Adresse, die eine echte Seite überdeckt; ein Titel,
 * den Google abschneidet; ein Platzhalter, der unaufgelöst auf der Seite steht;
 * ein Preisbeispiel, das nicht (mehr) berechenbar oder unplausibel ist.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { getProduct, PRODUCTS } from '@/config/products';
import { ABLAUF_SCHRITTE, KATEGORIE_SEITEN } from '@/config/seo/kategorieSeiten';
import sitemap from '@/app/sitemap';
import { kanonischeBasisUrl } from '../basisUrl';
import { alleKategorieSlugs, kategorieLink, kategorieSeiteVon } from '../kategorieAdresse';
import { ablaufSchritte, berechneBeispiele, fuelleVorlage, kategorieFakten, topProdukte } from '../kategorieSeite';

test('es gibt mindestens eine Kategorieseite', () => {
  assert.ok(KATEGORIE_SEITEN.length > 0);
});

test('Adressen sind eindeutig, URL-tauglich und überdecken keine echte Seite', () => {
  const slugs = alleKategorieSlugs();
  assert.equal(new Set(slugs).size, slugs.length, 'doppelte Adresse');
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, `Adresse nicht URL-tauglich: ${s}`);

  // Die Seite liegt unter der Wurzel (`app/[kategorie]`). Jede feste Route und
  // jede Metadaten-Datei dort gewinnt gegen sie – ein gleichnamiger Slug wäre
  // also nur still wirkungslos. Deshalb hier laut.
  const belegt = readdirSync('src/app', { withFileTypes: true })
    .map((e) => e.name.replace(/\.[a-z0-9]+$/i, ''))
    .filter((n) => !n.startsWith('['));
  for (const s of slugs) assert.ok(!belegt.includes(s), `Adresse /${s} kollidiert mit src/app/${s}`);
});

test('Titel: höchstens 60 Zeichen, eindeutig, mit Suchbegriff', () => {
  const titel = KATEGORIE_SEITEN.map((s) => s.titel);
  assert.equal(new Set(titel).size, titel.length, 'doppelter Titel');
  for (const t of titel) {
    assert.ok(t.length <= 60, `Titel zu lang (${t.length}): ${t}`);
    assert.match(t, /bedrucken|besticken/, `Titel ohne Suchbegriff: ${t}`);
  }
});

test('Meta-Description: befüllt 70–160 Zeichen, eindeutig, ohne Rest-Platzhalter', () => {
  const beschreibungen = KATEGORIE_SEITEN.map((s) => fuelleVorlage(s.beschreibung, kategorieFakten(s.art)));
  assert.equal(new Set(beschreibungen).size, beschreibungen.length, 'doppelte Beschreibung');
  for (const b of beschreibungen) {
    assert.ok(b.length >= 70 && b.length <= 160, `Beschreibung ${b.length} Zeichen (soll 70–160): ${b}`);
    assert.doesNotMatch(b, /[{}]/);
  }
});

test('jede Seite hat genug Produkte, und ALLE Texte lassen sich ohne unbekannten Platzhalter befüllen', () => {
  for (const s of KATEGORIE_SEITEN) {
    const f = kategorieFakten(s.art);
    assert.ok(f.anzahl >= 3, `${s.slug}: nur ${f.anzahl} Produkte – zu dünn für eine eigene Seite`);
    const texte = [
      s.h1,
      ...s.einleitung,
      s.verfahren.dtf,
      s.verfahren.stickerei,
      s.verfahren.hinweis,
      ...s.fragen.flatMap((q) => [q.q, q.a]),
      ...s.beispiele.map((b) => b.beschriftung),
    ];
    for (const t of texte) assert.doesNotMatch(fuelleVorlage(t, f), /[{}]/, `${s.slug}: Rest-Platzhalter in "${t.slice(0, 50)}"`);
  }
  for (const t of ABLAUF_SCHRITTE) {
    assert.doesNotMatch(fuelleVorlage(t, kategorieFakten(KATEGORIE_SEITEN[0]!.art)), /[{}]/);
  }
});

test('ein unbekannter Platzhalter wirft, statt als Text auf der Seite zu landen', () => {
  const f = kategorieFakten(KATEGORIE_SEITEN[0]!.art);
  assert.throws(() => fuelleVorlage('Preis: {gibtEsNicht}', f), /Unbekannter Platzhalter/);
});

test('FAQ: mindestens vier eindeutige Fragen mit Antwort', () => {
  for (const s of KATEGORIE_SEITEN) {
    assert.ok(s.fragen.length >= 4, `${s.slug}: nur ${s.fragen.length} Fragen`);
    const fragen = s.fragen.map((q) => q.q);
    assert.equal(new Set(fragen).size, fragen.length, `${s.slug}: doppelte Frage`);
    for (const q of s.fragen) assert.ok(q.q.endsWith('?') && q.a.length > 40, `${s.slug}: Frage/Antwort unvollständig: ${q.q}`);
  }
});

test('Ablauf: die Zeiten kommen aus der Konfiguration, nicht aus dem Text', () => {
  const schritte = ablaufSchritte(kategorieFakten(KATEGORIE_SEITEN[0]!.art));
  assert.match(schritte.at(-1)!, /^Produktion in 3 bis 4 Werktagen, anschließend Versand innerhalb von 1 bis 2 Werktagen\.$/);
});

test('Katalogfakten stimmen mit dem Katalog überein', () => {
  for (const s of KATEGORIE_SEITEN) {
    const produkte = PRODUCTS.filter((p) => p.productType === s.art);
    const f = kategorieFakten(s.art);
    assert.equal(f.anzahl, produkte.length);
    assert.equal(f.abPreis, Math.min(...produkte.map((p) => p.basePrice)));
    assert.deepEqual([...f.marken].sort(), [...new Set(produkte.map((p) => p.brand))].sort());
  }
});

test('Preisbeispiele: berechenbar, über dem Textilpreis, Menge passt, Stückpreis fällt mit der Menge', async () => {
  for (const s of KATEGORIE_SEITEN) {
    const berechnet = await berechneBeispiele(s);
    assert.equal(berechnet.length, s.beispiele.length);

    berechnet.forEach((b, i) => {
      const def = s.beispiele[i]!;
      const erwarteteMenge = Object.values(def.groessen).reduce((a, n) => a + n, 0);
      assert.equal(b.menge, erwarteteMenge, `${s.slug}: Menge von "${def.beschriftung}"`);
      assert.ok(b.stueckpreis > b.textilAb, `${s.slug}: "${def.beschriftung}" nicht teurer als das unveredelte Textil`);
      assert.ok(Math.abs(b.stueckpreis * b.menge - b.gesamt) < 0.5 + b.menge * 0.005, `${s.slug}: Stück-/Gesamtpreis passen nicht zusammen`);
    });

    // Gleiche Konfiguration, mehr Stück → Stückpreis darf nie steigen.
    const gruppen = new Map<string, { menge: number; stueck: number }[]>();
    berechnet.forEach((b, i) => {
      const d = s.beispiele[i]!;
      const schluessel = `${d.produktId}|${d.methode}|${JSON.stringify(d.flaechen)}`;
      gruppen.set(schluessel, [...(gruppen.get(schluessel) ?? []), { menge: b.menge, stueck: b.stueckpreis }]);
    });
    for (const [schluessel, liste] of gruppen) {
      const sortiert = [...liste].sort((a, b) => a.menge - b.menge);
      for (let i = 1; i < sortiert.length; i++) {
        assert.ok(sortiert[i]!.stueck <= sortiert[i - 1]!.stueck, `${s.slug}: Stückpreis steigt mit der Menge (${schluessel})`);
      }
    }
  }
});

test('Beispielprodukte existieren im Katalog und gehören zur Produktart der Seite', () => {
  for (const s of KATEGORIE_SEITEN) {
    for (const b of s.beispiele) {
      const p = getProduct(b.produktId);
      assert.ok(p, `${s.slug}: Beispielprodukt ${b.produktId} fehlt`);
      assert.equal(p!.productType, s.art, `${s.slug}: ${b.produktId} ist kein ${s.art}`);
    }
  }
});

test('topProdukte liefert Produkte genau dieser Art und die Gesamtzahl', () => {
  for (const s of KATEGORIE_SEITEN) {
    const { produkte, gesamt } = topProdukte(s.art, 8);
    assert.ok(produkte.length > 0 && produkte.length <= 8);
    assert.ok(produkte.every((p) => p.productType === s.art));
    assert.equal(gesamt, PRODUCTS.filter((p) => p.productType === s.art).length);
  }
});

test('kategorieLink: Landingpage, wo es sie gibt – sonst die Filteransicht', () => {
  for (const s of KATEGORIE_SEITEN) assert.equal(kategorieLink(s.art), `/${s.slug}`);
  const ohneSeite = PRODUCTS.map((p) => p.productType).find((t) => !KATEGORIE_SEITEN.some((s) => s.art === t));
  if (ohneSeite) assert.equal(kategorieLink(ohneSeite), `/produkt?kategorie=${ohneSeite}`);
  assert.equal(kategorieSeiteVon('gibt-es-nicht'), undefined);
});

test('Sitemap führt jede Kategorieseite – auf dem kanonischen Host', () => {
  const urls = new Set(sitemap().map((e) => e.url));
  const basis = kanonischeBasisUrl();
  for (const s of KATEGORIE_SEITEN) assert.ok(urls.has(`${basis}/${s.slug}`), `${s.slug} fehlt in der Sitemap`);
});
