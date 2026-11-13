/**
 * Wächter für die Anlass- und Ratgeberseiten (config/seo/anlassSeiten.ts).
 *
 * Die Texte stehen in der Konfiguration, Zahlen kommen aus Katalog, Konfiguration und Preis-Engine. Diese Tests verhindern
 * die stillen Fehler solcher Seiten: eine Adresse, die eine echte Seite überdeckt; ein Titel, den Google abschneidet; ein
 * Platzhalter, der unaufgelöst auf der Seite steht; ein Preisbeispiel, das nicht mehr berechenbar ist; ein Versprechen
 * (Stickerei), das der Betrieb gerade nicht einlösen kann; eine Behauptung, die wir nicht belegen können.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { ANLASS_SEITEN } from '@/config/seo/anlassSeiten';
import { DTF_ABLAUF_SCHRITTE, DTF_SEITEN } from '@/config/seo/dtfSeiten';
import { KATEGORIE_SEITEN } from '@/config/seo/kategorieSeiten';
import { veredelungVerfuegbar } from '@/config/bestellweg';
import { MIN_DPI, OK_DPI } from '@/lib/canvas/logoQualitaet';
import sitemap from '@/app/sitemap';
import { kanonischeBasisUrl } from '../basisUrl';
import { berechneBeispiele } from '../kategorieSeite';
import {
  alsKategorieBeispiele,
  anlassFakten,
  AUFLOESUNG_BREITEN_CM,
  fuelleAnlass,
  mindestPixel,
  verteileGroessen,
  beispielProdukt,
} from '../anlassSeite';
import { llmsText } from '../llmsText';
import {
  GEWICHTS_BAENDER,
  gewichtsSpanne,
  gewichtsUebersicht,
  groessenTabelle,
  MODELLE_JE_TABELLE,
  TABELLEN_ARTEN,
  TABELLEN_GROESSEN,
} from '../katalogAuswertung';
import { berechneLogoDpi, stufeFuerDpi } from '@/lib/canvas/logoQualitaet';

type Seite = (typeof ANLASS_SEITEN)[number];

/** Alle Kundentexte einer Seite, befüllt. */
function texteVon(seite: Seite): string[] {
  const f = anlassFakten(seite);
  return [
    seite.titel,
    seite.h1,
    seite.eyebrow,
    seite.kurzname,
    seite.beschreibung,
    ...seite.einleitung,
    ...seite.abschnitte.flatMap((a) => [a.ueberschrift, ...(a.absaetze ?? []), ...(a.punkte ?? [])]),
    ...seite.beispiele.map((b) => b.beschriftung),
    ...seite.fragen.flatMap((q) => [q.q, q.a]),
    ...(seite.ohneAblauf ? [] : DTF_ABLAUF_SCHRITTE),
  ].map((t) => fuelleAnlass(t, seite, f));
}

test('es gibt Anlass- und Ratgeberseiten', () => {
  assert.ok(ANLASS_SEITEN.length >= 5);
});

test('Adressen sind eindeutig, URL-tauglich und überdecken weder eine echte Seite noch eine andere Landingpage', () => {
  const slugs = ANLASS_SEITEN.map((s) => s.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'doppelte Adresse');
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, `Adresse nicht URL-tauglich: ${s}`);
  const belegt = readdirSync('src/app', { withFileTypes: true })
    .map((e) => e.name.replace(/\.[a-z0-9]+$/i, ''))
    .filter((n) => !n.startsWith('['));
  for (const s of slugs) assert.ok(!belegt.includes(s), `Adresse /${s} kollidiert mit src/app/${s}`);
  const andere = [...KATEGORIE_SEITEN.map((k) => k.slug), ...DTF_SEITEN.map((d) => d.slug)];
  for (const s of slugs) assert.ok(!andere.includes(s), `Adresse /${s} gibt es schon als Kategorie- oder DTF-Seite`);
});

test('Titel: höchstens 60 Zeichen, eindeutig; Anlassseiten tragen „ab 1 Stück“', () => {
  const titel = ANLASS_SEITEN.map((s) => fuelleAnlass(s.titel, s, anlassFakten(s)));
  assert.equal(new Set(titel).size, titel.length, 'doppelter Titel');
  for (const [i, t] of titel.entries()) {
    assert.ok(t.length <= 60, `Titel zu lang (${t.length}): ${t}`);
    if (ANLASS_SEITEN[i]!.kacheln.length > 0) assert.match(t, /ab 1 Stück/, `Titel ohne „ab 1 Stück“: ${t}`);
  }
});

test('Meta-Description: befüllt 70–160 Zeichen, eindeutig, ohne Rest-Platzhalter', () => {
  const beschreibungen = ANLASS_SEITEN.map((s) => fuelleAnlass(s.beschreibung, s, anlassFakten(s)));
  assert.equal(new Set(beschreibungen).size, beschreibungen.length, 'doppelte Beschreibung');
  for (const b of beschreibungen) {
    assert.ok(b.length >= 70 && b.length <= 160, `Beschreibung ${b.length} Zeichen (soll 70–160): ${b}`);
    assert.doesNotMatch(b, /[{}]/);
  }
});

test('alle Texte lassen sich ohne Rest-Platzhalter befüllen, FAQ hat ≥ 4 eindeutige Fragen mit Substanz', () => {
  for (const s of ANLASS_SEITEN) {
    for (const t of texteVon(s)) assert.doesNotMatch(t, /[{}]/, `${s.slug}: Rest-Platzhalter in "${t.slice(0, 60)}"`);
    const fragen = s.fragen.map((q) => fuelleAnlass(q.q, s, anlassFakten(s)));
    assert.ok(fragen.length >= 4, `${s.slug}: nur ${fragen.length} Fragen`);
    assert.equal(new Set(fragen).size, fragen.length, `${s.slug}: doppelte Frage`);
    for (const q of s.fragen) assert.ok(q.a.length > 40, `${s.slug}: Antwort zu kurz: ${q.q}`);
    assert.ok(s.einleitung.length >= 1 && s.abschnitte.length >= 2, `${s.slug}: zu dünn`);
  }
});

test('ein unbekannter Platzhalter wirft, statt als Text auf der Seite zu landen', () => {
  const s = ANLASS_SEITEN[0]!;
  assert.throws(() => fuelleAnlass('Preis: {gibtEsNicht}', s, anlassFakten(s)), /Unbekannter Platzhalter/);
});

test('{anzahl}/{arten} auf einer Seite ohne Modelle werfen (kein stilles Leerfeld)', () => {
  const ratgeber = ANLASS_SEITEN.find((s) => s.kacheln.length === 0)!;
  assert.throws(() => fuelleAnlass('{anzahl}', ratgeber, anlassFakten(ratgeber)), /keine Modelle/);
  assert.throws(() => fuelleAnlass('{arten}', ratgeber, anlassFakten(ratgeber)), /keine Modelle/);
});

test('Seiten mit Modellauswahl zeigen genug verschiedene Modelle, die Anzahl stimmt mit dem Katalog', () => {
  for (const s of ANLASS_SEITEN.filter((x) => x.kacheln.length > 0)) {
    const f = anlassFakten(s);
    assert.ok(f.kacheln.length >= 4, `${s.slug}: nur ${f.kacheln.length} Modelle gezeigt`);
    assert.equal(new Set(f.kacheln.map((p) => p.id)).size, f.kacheln.length, `${s.slug}: doppelte Kachel`);
    assert.ok(f.anzahl >= f.kacheln.length, `${s.slug}: Anzahl kleiner als die gezeigten Modelle`);
    for (const p of f.kacheln) assert.notEqual(p.productType, 'kids', `${s.slug}: Kinderware in der Erwachsenenauswahl`);
  }
});

test('Verweise auf andere Seiten zeigen auf Seiten, die es gibt', () => {
  const alle = new Set([
    ...ANLASS_SEITEN.map((s) => s.slug),
    ...KATEGORIE_SEITEN.map((k) => k.slug),
    ...DTF_SEITEN.map((d) => d.slug),
  ]);
  for (const s of ANLASS_SEITEN) {
    assert.ok(s.verwandt.length >= 3, `${s.slug}: zu wenige Verweise`);
    assert.equal(new Set(s.verwandt).size, s.verwandt.length, `${s.slug}: doppelter Verweis`);
    for (const v of s.verwandt) {
      assert.ok(alle.has(v), `${s.slug}: Verweis auf /${v}, die Seite gibt es nicht`);
      assert.notEqual(v, s.slug, `${s.slug}: Verweis auf sich selbst`);
    }
  }
});

test('Preisbeispiele sind berechenbar, mit der gemeldeten Menge, und Mengen senken den Stückpreis', async () => {
  for (const s of ANLASS_SEITEN.filter((x) => x.beispiele.length > 0)) {
    const ergebnis = await berechneBeispiele({ slug: s.slug, beispiele: alsKategorieBeispiele(s.beispiele) });
    assert.equal(ergebnis.length, s.beispiele.length);
    ergebnis.forEach((e, i) => {
      assert.equal(e.menge, s.beispiele[i]!.menge, `${s.slug}: Menge von "${e.beschriftung}"`);
      assert.ok(e.stueckpreis > 0 && e.gesamt > 0, `${s.slug}: Preis von "${e.beschriftung}"`);
    });
  }
  // Die Preisseite zeigt dieselbe Konfiguration in 1 / 10 / 50 Stück: je Stück nie teurer.
  const preise = ANLASS_SEITEN.find((s) => s.slug === 'textildruck-preise')!;
  const e = await berechneBeispiele({ slug: preise.slug, beispiele: alsKategorieBeispiele(preise.beispiele) });
  const tshirt = e.filter((x) => /T-Shirt/.test(x.beschriftung));
  for (let i = 1; i < tshirt.length; i++) {
    assert.ok(tshirt[i]!.stueckpreis <= tshirt[i - 1]!.stueckpreis, `Stückpreis steigt mit der Menge: ${tshirt[i]!.beschriftung}`);
  }
});

test('Größenverteilung ergibt genau die Menge und nutzt nur Größen des Produkts', () => {
  for (const art of ['tshirt', 'hoodie', 'polo'] as const) {
    const p = beispielProdukt(art);
    for (const menge of [1, 2, 5, 10, 25, 50]) {
      const v = verteileGroessen(menge, p);
      assert.equal(Object.values(v).reduce((a, n) => a + n, 0), menge, `${art} ${menge}`);
      for (const g of Object.keys(v)) assert.ok(p.sizes.includes(g), `${art}: Größe ${g} gibt es nicht`);
    }
  }
});

test('Auflösungstabelle: rechnet aufgerundet und wächst mit Breite und Auflösung', () => {
  assert.equal(mindestPixel(2.54, 150), 150);
  assert.equal(mindestPixel(2.54, 220), 220);
  let letzte = 0;
  for (const cm of AUFLOESUNG_BREITEN_CM) {
    const min = mindestPixel(cm, MIN_DPI);
    const ok = mindestPixel(cm, OK_DPI);
    assert.ok(min > letzte && ok > min, `${cm} cm`);
    letzte = min;
  }
});

test('Stickerei pausiert: kein Text verspricht Stickerei oder Besticken', () => {
  if (veredelungVerfuegbar('embroidery')) return; // Stickerei wieder an – dann entscheidet der Betreiber über den Wortlaut.
  for (const s of ANLASS_SEITEN) {
    for (const t of texteVon(s)) assert.doesNotMatch(t, /besticke|bestickt|stickerei|stickdatei|digitalisier/i, `${s.slug}: "${t.slice(0, 80)}"`);
  }
});

test('keine unbelegten Superlative oder Garantien in den Texten', () => {
  for (const s of ANLASS_SEITEN) {
    for (const t of texteVon(s)) {
      assert.doesNotMatch(
        t,
        /garantier|testsieger|(?<!am )beste[rn]? |günstigste|billigste|originalgetreu|waschfest|jahrelang|lebenslang|schnellste/i,
        `${s.slug}: unbelegte Behauptung in "${t.slice(0, 80)}"`
      );
    }
  }
});

test('die Sitemap führt jede Anlassseite genau einmal', () => {
  const basis = kanonischeBasisUrl();
  const urls = sitemap().map((e) => e.url);
  for (const s of ANLASS_SEITEN) {
    assert.equal(urls.filter((u) => u === `${basis}/${s.slug}`).length, 1, `/${s.slug} in der Sitemap`);
  }
});

test('llms.txt nennt jede Anlassseite und hat keine Rest-Platzhalter', () => {
  const basis = kanonischeBasisUrl();
  const text = llmsText(basis);
  for (const s of ANLASS_SEITEN) assert.ok(text.includes(`${basis}/${s.slug}`), `/${s.slug} fehlt in llms.txt`);
  assert.match(text, /^# Embroidery Republic Germany/);
  assert.doesNotMatch(text, /\{[a-zA-Z_]+\}/, 'Rest-Platzhalter in llms.txt');
});

test('Größentabellen: je Art drei Modelle, vollständige Maße, Maße wachsen mit der Größe', () => {
  for (const art of TABELLEN_ARTEN) {
    const t = groessenTabelle(art);
    assert.equal(t.modelle.length, MODELLE_JE_TABELLE, art);
    assert.equal(new Set(t.modelle.map((m) => m.id)).size, t.modelle.length, `${art}: doppeltes Modell`);
    for (const m of t.modelle) {
      let davor = { breiteCm: 0, laengeCm: 0 };
      for (const g of TABELLEN_GROESSEN) {
        const x = m.masse[g];
        assert.ok(x && x.breiteCm > 0 && x.laengeCm > 0, `${m.id}: Maß für ${g} fehlt`);
        assert.ok(x.breiteCm >= davor.breiteCm && x.laengeCm >= davor.laengeCm, `${m.id}: Maße fallen bei ${g}`);
        davor = x;
      }
    }
  }
});

test('Gewichtsklassen: Bänder lückenlos, jedes Modell in genau einer Klasse, Spanne passt zur Auswertung', () => {
  for (const art of TABELLEN_ARTEN) {
    const baender = GEWICHTS_BAENDER[art];
    assert.equal(baender[0]!.von, 0, `${art}: erstes Band beginnt nicht bei 0`);
    assert.equal(baender[baender.length - 1]!.bis, Number.POSITIVE_INFINITY, `${art}: letztes Band ist nicht offen`);
    for (let i = 1; i < baender.length; i++) assert.equal(baender[i]!.von, baender[i - 1]!.bis, `${art}: Lücke vor Band ${i}`);
    const u = gewichtsUebersicht(art);
    assert.equal(u.klassen.reduce((n, k) => n + k.anzahl, 0), u.gesamt, `${art}: Summe der Klassen`);
    assert.ok(u.min <= u.max && u.gesamt >= 10, `${art}: zu wenige Modelle (${u.gesamt})`);
    const spanne = gewichtsSpanne(art);
    assert.deepEqual([spanne.min, spanne.max], [u.min, u.max]);
    for (const k of u.klassen) {
      assert.ok(k.beispiele.length <= 3 && k.beispiele.length <= k.anzahl, `${art}: Beispiele`);
      for (const b of k.beispiele) assert.ok(b.gewicht >= k.band.von && b.gewicht < k.band.bis, `${art}: ${b.id} nicht in ${k.band.label}`);
    }
  }
});

test('Gewichts-Platzhalter in den Texten werden eingesetzt, für andere Arten werfen sie', () => {
  const seite = ANLASS_SEITEN.find((x) => x.slug === 'stoffgewicht-t-shirt-hoodie')!;
  const f = anlassFakten(seite);
  const u = gewichtsUebersicht('tshirt');
  assert.equal(fuelleAnlass('{gewichtMin_tshirt}–{gewichtMax_tshirt}', seite, f), `${u.min}–${u.max}`);
  assert.throws(() => fuelleAnlass('{gewichtMin_jacket}', seite, f), /keine Gewichtsauswertung/);
});

test('Auflösungsrechner: 2.000 Pixel bei 20 cm sind rund 254 dpi und grün, 600 Pixel bei 20 cm rot', () => {
  assert.equal(Math.round(berechneLogoDpi(2000, 20)), 254);
  assert.equal(stufeFuerDpi(berechneLogoDpi(2000, 20)), 'green');
  assert.equal(stufeFuerDpi(berechneLogoDpi(1500, 20)), 'yellow');
  assert.equal(stufeFuerDpi(berechneLogoDpi(600, 20)), 'red');
  // Der Beispielsatz auf der Seite („2.000 Pixel … 20 cm … rund 254 dpi“) muss stimmen.
  const seite = ANLASS_SEITEN.find((x) => x.slug === 'druckaufloesung-rechner')!;
  const text = seite.abschnitte.flatMap((a) => a.absaetze ?? []).join(' ');
  assert.match(text, /2\.000 Pixeln Breite hat bei 20 cm Druckbreite rund 254 dpi/);
});

test('jede Seite mit berechneter Tabelle nennt nur Arten, für die es eine Auswertung gibt', () => {
  for (const s of ANLASS_SEITEN) {
    for (const a of s.abschnitte) {
      const t = a.tabelle;
      if (t?.startsWith('groessen:') || t?.startsWith('gewicht:')) {
        const art = t.split(':')[1]!;
        assert.ok((TABELLEN_ARTEN as readonly string[]).includes(art), `${s.slug}: unbekannte Art ${art}`);
      }
    }
  }
});
