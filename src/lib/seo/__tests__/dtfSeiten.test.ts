/**
 * Wächter für die DTF-Landingpages (Marken und weitere Produktarten).
 *
 * Die Texte stehen in config/seo/dtfSeiten.ts, Zahlen kommen aus Katalog und Preis-Engine.
 * Diese Tests verhindern die stillen Fehler solcher Seiten: eine Adresse, die eine echte
 * Seite überdeckt; ein Titel, den Google abschneidet; ein Platzhalter, der unaufgelöst auf
 * der Seite steht; ein Preisbeispiel, das nicht mehr berechenbar ist; ein Versprechen
 * (Stickerei), das der Betrieb gerade nicht einlösen kann.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { PRODUCTS } from '@/config/products';
import { DTF_ABLAUF_SCHRITTE, DTF_SEITEN } from '@/config/seo/dtfSeiten';
import { KATEGORIE_SEITEN } from '@/config/seo/kategorieSeiten';
import { veredelungVerfuegbar } from '@/config/bestellweg';
import sitemap from '@/app/sitemap';
import { kanonischeBasisUrl } from '../basisUrl';
import { kategorieLink } from '../kategorieAdresse';
import { alleDtfSlugs, dtfArtSeiteVon, markenSeiteVon } from '../dtfAdresse';
import { berechneBeispiele } from '../kategorieSeite';
import { dtfBeispiele, dtfFakten, fuelleDtf } from '../dtfSeite';

/** Alle Kundentexte einer Seite, befüllt. */
function texteVon(seite: (typeof DTF_SEITEN)[number]): string[] {
  const f = dtfFakten(seite);
  return [
    seite.titel,
    seite.h1,
    seite.beschreibung,
    ...seite.einleitung,
    ...seite.fragen.flatMap((q) => [q.q, q.a]),
    ...DTF_ABLAUF_SCHRITTE,
  ].map((t) => fuelleDtf(t, seite, f));
}

test('Jede Seite hat genau eine Gruppierung (Marke ODER Produktart)', () => {
  for (const s of DTF_SEITEN) assert.ok(Boolean(s.marke) !== Boolean(s.art), `${s.slug}: Marke und Art gleichzeitig oder keines`);
});

test('Adressen sind eindeutig, URL-tauglich und überdecken weder eine echte Seite noch eine Kategorieseite', () => {
  const slugs = alleDtfSlugs();
  assert.equal(new Set(slugs).size, slugs.length, 'doppelte Adresse');
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, `Adresse nicht URL-tauglich: ${s}`);
  const belegt = readdirSync('src/app', { withFileTypes: true })
    .map((e) => e.name.replace(/\.[a-z0-9]+$/i, ''))
    .filter((n) => !n.startsWith('['));
  for (const s of slugs) assert.ok(!belegt.includes(s), `Adresse /${s} kollidiert mit src/app/${s}`);
  const kategorien = KATEGORIE_SEITEN.map((k) => k.slug);
  for (const s of slugs) assert.ok(!kategorien.includes(s), `Adresse /${s} gibt es schon als Kategorieseite`);
});

test('Marken existieren im Katalog (Schreibweise exakt), Produktarten haben noch keine Kategorieseite', () => {
  const marken = new Set(PRODUCTS.map((p) => p.brand));
  for (const s of DTF_SEITEN) {
    if (s.marke) assert.ok(marken.has(s.marke), `${s.slug}: Marke "${s.marke}" nicht im Katalog (${[...marken].join(', ')})`);
    if (s.art) assert.ok(!KATEGORIE_SEITEN.some((k) => k.art === s.art), `${s.slug}: für ${s.art} gibt es schon eine Kategorieseite`);
  }
});

test('jede Seite hat genug Produkte – sonst ist sie zu dünn für eine eigene Adresse', () => {
  for (const s of DTF_SEITEN) {
    const f = dtfFakten(s);
    assert.ok(f.anzahl >= 5, `${s.slug}: nur ${f.anzahl} Produkte`);
  }
});

test('Titel: höchstens 60 Zeichen, eindeutig, mit Suchbegriff und „ab 1 Stück“', () => {
  const titel = DTF_SEITEN.map((s) => fuelleDtf(s.titel, s, dtfFakten(s)));
  assert.equal(new Set(titel).size, titel.length, 'doppelter Titel');
  for (const t of titel) {
    assert.ok(t.length <= 60, `Titel zu lang (${t.length}): ${t}`);
    assert.match(t, /bedrucken/, `Titel ohne Suchbegriff: ${t}`);
    assert.match(t, /ab 1 Stück/, `Titel ohne „ab 1 Stück“: ${t}`);
  }
});

test('Meta-Description: befüllt 70–160 Zeichen, eindeutig, ohne Rest-Platzhalter', () => {
  const beschreibungen = DTF_SEITEN.map((s) => fuelleDtf(s.beschreibung, s, dtfFakten(s)));
  assert.equal(new Set(beschreibungen).size, beschreibungen.length, 'doppelte Beschreibung');
  for (const b of beschreibungen) {
    assert.ok(b.length >= 70 && b.length <= 160, `Beschreibung ${b.length} Zeichen (soll 70–160): ${b}`);
    assert.doesNotMatch(b, /[{}]/);
  }
});

test('alle Texte lassen sich ohne Rest-Platzhalter befüllen, FAQ hat ≥ 4 eindeutige Fragen', () => {
  for (const s of DTF_SEITEN) {
    for (const t of texteVon(s)) assert.doesNotMatch(t, /[{}]/, `${s.slug}: Rest-Platzhalter in "${t.slice(0, 60)}"`);
    const fragen = s.fragen.map((q) => fuelleDtf(q.q, s, dtfFakten(s)));
    assert.ok(fragen.length >= 4, `${s.slug}: nur ${fragen.length} Fragen`);
    assert.equal(new Set(fragen).size, fragen.length, `${s.slug}: doppelte Frage`);
    for (const q of s.fragen) assert.ok(q.a.length > 40, `${s.slug}: Antwort zu kurz: ${q.q}`);
  }
});

test('ein unbekannter Platzhalter wirft, statt als Text auf der Seite zu landen', () => {
  const s = DTF_SEITEN[0]!;
  assert.throws(() => fuelleDtf('Preis: {gibtEsNicht}', s, dtfFakten(s)), /Unbekannter Platzhalter/);
});

test('{marke} auf einer Art-Seite und {artPlural} auf einer Marken-Seite werfen (kein stilles Leerfeld)', () => {
  const marke = DTF_SEITEN.find((s) => s.marke)!;
  const art = DTF_SEITEN.find((s) => s.art)!;
  assert.throws(() => fuelleDtf('{artPlural}', marke, dtfFakten(marke)), /keine Produktart/);
  assert.throws(() => fuelleDtf('{marke}', art, dtfFakten(art)), /keine Marke/);
});

test('Katalogfakten stimmen mit dem Katalog überein', () => {
  for (const s of DTF_SEITEN) {
    const erwartet = PRODUCTS.filter((p) => (s.marke ? p.brand === s.marke : p.productType === s.art));
    const f = dtfFakten(s);
    assert.equal(f.anzahl, erwartet.length, `${s.slug}: Anzahl`);
    assert.equal(f.abPreis, Math.min(...erwartet.map((p) => p.basePrice)), `${s.slug}: ab-Preis`);
    assert.deepEqual([...f.marken].sort(), [...new Set(erwartet.map((p) => p.brand))].sort(), `${s.slug}: Marken`);
  }
});

test('Stickerei pausiert: kein Text verspricht Stickerei oder Besticken', () => {
  if (veredelungVerfuegbar('embroidery')) return; // Stickerei wieder an – dann entscheidet der Betreiber über den Wortlaut.
  for (const s of DTF_SEITEN) {
    for (const t of texteVon(s)) assert.doesNotMatch(t, /stick|bestick/i, `${s.slug}: Stickerei im Text „${t.slice(0, 80)}“`);
  }
});

test('Preisbeispiele: berechenbar, über dem Textilpreis, Menge passt, Stückpreis fällt mit der Menge', async () => {
  for (const s of DTF_SEITEN) {
    const f = dtfFakten(s);
    const wahl = dtfBeispiele(s, f);
    const berechnet = await berechneBeispiele({ slug: s.slug, beispiele: wahl.beispiele });
    assert.equal(berechnet.length, 2);
    const [eins, zehn] = berechnet as [(typeof berechnet)[number], (typeof berechnet)[number]];
    assert.equal(eins.menge, 1, `${s.slug}: Einzelstück`);
    assert.equal(zehn.menge, 10, `${s.slug}: zehn Stück`);
    for (const b of berechnet) assert.ok(b.stueckpreis > b.textilAb, `${s.slug}: "${b.beschriftung}" nicht teurer als das Textil`);
    assert.ok(zehn.stueckpreis <= eins.stueckpreis, `${s.slug}: Stückpreis steigt mit der Menge`);
    assert.ok(Math.abs(zehn.stueckpreis * 10 - zehn.gesamt) < 1, `${s.slug}: Stück-/Gesamtpreis passen nicht zusammen`);
    // Das Beispielprodukt gehört zur Seite.
    assert.ok(f.produkte.some((p) => p.id === wahl.produkt.id), `${s.slug}: Beispielprodukt gehört nicht zur Seite`);
  }
});

test('Ablauf: Zeiten kommen aus der Konfiguration; Schritt 3 verspricht keine Stickerei', () => {
  const s = DTF_SEITEN[0]!;
  const f = dtfFakten(s);
  const schritte = DTF_ABLAUF_SCHRITTE.map((t) => fuelleDtf(t, s, f));
  assert.match(schritte.at(-1)!, /^Produktion in 3 bis 4 Werktagen, anschließend Versand innerhalb von 1 bis 2 Werktagen\.$/);
  assert.equal(schritte[2], 'DTF-Druck bestellen Sie direkt im Konfigurator.');
});

test('Sitemap enthält jede DTF-Seite genau einmal, auf der kanonischen Adresse', () => {
  const basis = kanonischeBasisUrl();
  const urls = sitemap().map((e) => e.url);
  for (const slug of alleDtfSlugs()) {
    assert.equal(urls.filter((u) => u === `${basis}/${slug}`).length, 1, `${slug}: nicht genau einmal in der Sitemap`);
  }
});

test('Verlinkung: Marken- und Art-Seiten werden intern gefunden', () => {
  for (const s of DTF_SEITEN) {
    if (s.marke) assert.equal(markenSeiteVon(s.marke)?.slug, s.slug);
    if (s.art) {
      assert.equal(dtfArtSeiteVon(s.art)?.slug, s.slug);
      assert.equal(kategorieLink(s.art), `/${s.slug}`, 'Startseite/Produktseite müssen auf die indexierbare Seite verlinken');
    }
  }
  // Arten mit eigener Kategorieseite bleiben unverändert.
  for (const k of KATEGORIE_SEITEN) assert.equal(kategorieLink(k.art), `/${k.slug}`);
});
