/**
 * Erklärsätze unter den Preisbeispielen (Betreiberfreigabe 2026-11-25): Einrichtung bei 1–2 Stück und zweite bedruckte Position.
 * Geprüft wird der Wortlaut und, dass JEDE Beispielzeile der Anlass-, DTF- und Kategorieseiten mit 1–2 Stück (DTF) die Erklärung bekommt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ANLASS_SEITEN } from '@/config/seo/anlassSeiten';
import { DTF_SEITEN } from '@/config/seo/dtfSeiten';
import { KATEGORIE_SEITEN } from '@/config/seo/kategorieSeiten';
import { KLEINAUFTRAG_MAX_STUECK, KLEINAUFTRAG_PAUSCHALE_EUR } from '@/config/pricingRules';
import { alsKategorieBeispiele } from '@/lib/seo/anlassSeite';
import { dtfBeispiele, dtfFakten } from '@/lib/seo/dtfSeite';
import { berechneBeispiele, sichtbareBeispiele } from '@/lib/seo/kategorieSeite';
import { einrichtungsHinweis, grossformatHinweis, HINWEIS_ZWEI_POSITIONEN, zeilenHinweise } from '../preisHinweise';

const normal = (t: string | null) => (t ?? '').replace(/ /g, ' ');

test('Wortlaut für 1 Stück und 2 Stück (freigegeben 2026-11-25)', () => {
  assert.equal(
    normal(einrichtungsHinweis(1)),
    'Der Preis enthält die einmalige Einrichtung von 10 €. Die Einrichtung fällt nur bei bis zu 2 Stück an; ab 3 Stück entfällt sie.'
  );
  assert.equal(
    normal(einrichtungsHinweis(2)),
    'Der Preis enthält die einmalige Einrichtung von 10 €, auf die 2 Stück verteilt (5 € je Stück). Die Einrichtung fällt nur bei bis zu 2 Stück an; ab 3 Stück entfällt sie.'
  );
  // Betrag und Grenze stammen aus der Preisregel
  assert.equal(KLEINAUFTRAG_PAUSCHALE_EUR, 10);
  assert.equal(KLEINAUFTRAG_MAX_STUECK, 2);
});

test('Ab 3 Stück und bei Stickerei gibt es keinen Einrichtungs-Hinweis', () => {
  assert.equal(einrichtungsHinweis(3), null);
  assert.equal(einrichtungsHinweis(10), null);
  assert.deepEqual(zeilenHinweise({ menge: 1, positionen: 1, dtf: false }), []);
});

test('Zwei Positionen: Satz „zweite Position kommt je Stück hinzu“; ein eigener Satz der Seite ersetzt ihn', () => {
  assert.deepEqual(zeilenHinweise({ menge: 10, positionen: 2 }), [HINWEIS_ZWEI_POSITIONEN]);
  assert.deepEqual(zeilenHinweise({ menge: 10, positionen: 2, eigener: 'eigen' }), ['eigen']);
  assert.deepEqual(zeilenHinweise({ menge: 10, positionen: 1 }), []);
  assert.equal(zeilenHinweise({ menge: 1, positionen: 2 }).length, 2);
});

test('Jede Beispielzeile mit 1–2 Stück auf Anlass-, DTF- und Kategorieseiten bekommt die Einrichtungs-Erklärung', async () => {
  let gepruefte = 0;
  const pruefe = (slug: string, zeilen: { menge: number; positionen: number }[], methoden?: string[]) => {
    zeilen.forEach((z, i) => {
      if (z.menge > KLEINAUFTRAG_MAX_STUECK) return;
      if (methoden && methoden[i] === 'embroidery') return;
      const h = normal(zeilenHinweise({ menge: z.menge, positionen: z.positionen, dtf: true }).join(' '));
      assert.match(h, /einmalige Einrichtung von 10 €/, `${slug}: Zeile ${i + 1} (${z.menge} Stück) ohne Einrichtungs-Hinweis`);
      gepruefte++;
    });
  };
  for (const s of ANLASS_SEITEN) {
    const ber = await berechneBeispiele({ slug: s.slug, beispiele: alsKategorieBeispiele(s.beispiele) });
    pruefe(s.slug, ber.map((e, i) => ({ menge: e.menge, positionen: s.beispiele[i]!.flaechen.length })));
  }
  for (const s of DTF_SEITEN) {
    const w = dtfBeispiele(s, dtfFakten(s));
    const ber = await berechneBeispiele({ slug: s.slug, beispiele: w.beispiele });
    pruefe(s.slug, ber.map((e, i) => ({ menge: e.menge, positionen: w.beispiele[i]!.flaechen.length })));
  }
  for (const s of KATEGORIE_SEITEN) {
    const b = sichtbareBeispiele(s, false);
    const ber = await berechneBeispiele({ slug: s.slug, beispiele: b });
    pruefe(s.slug, ber.map((e, i) => ({ menge: e.menge, positionen: b[i]!.flaechen.length })), b.map((x) => x.methode));
  }
  assert.ok(gepruefte >= 25, `erwartet mindestens 25 Zeilen mit 1–2 Stück, geprüft: ${gepruefte}`);
});

test('Alle drei Seitenvorlagen zeigen die Erklärsätze (ZeilenHinweise) unter jeder Preiszeile', () => {
  for (const datei of ['src/components/seo/AnlassLandingpage.tsx', 'src/components/seo/DtfLandingpage.tsx', 'src/app/[kategorie]/page.tsx']) {
    const q = readFileSync(datei, 'utf8');
    assert.match(q, /<ZeilenHinweise/, `${datei} bindet ZeilenHinweise nicht ein`);
  }
});

test('Seiten mit Beispielen, deren Zeilen keine Reihe bilden, haben einen eigenen Satz statt „Mit steigender Menge sinkt …“', () => {
  const einzeln = [
    'vereinskleidung-bedrucken', 'firmenkleidung-bedrucken', 'abschluss-hoodies-bedrucken', 'textildruck-preise', 'geschaeftskunden',
    'gruppen-shirts-bedrucken', 'eigene-marke-merch-bedrucken', 'weihnachtsgeschenke-bedrucken', 'tshirt-mit-foto-bedrucken',
    'poloshirt-mit-logo-bedrucken', 'arbeitskleidung-bedrucken',
  ];
  for (const slug of einzeln) {
    const s = ANLASS_SEITEN.find((x) => x.slug === slug);
    assert.ok(s, `${slug} fehlt`);
    assert.ok((s.beispieleEinleitung ?? '').length > 40, `${slug}: eigener Satz über den Preisbeispielen fehlt`);
    assert.ok(!/^Mit steigender Menge sinkt der Stückpreis –/.test(s.beispieleEinleitung ?? ''), `${slug}: Standardsatz`);
    assert.match(s.beispieleEinleitung ?? '', /Staffelpreise gelten ab 5 Stück\.$|Staffelpreise gelten ab 5 Stück\./);
  }
  const t = KATEGORIE_SEITEN.find((x) => x.slug === 't-shirts-bedrucken-besticken');
  assert.ok((t?.beispieleEinleitungBeiPause ?? '').includes('zwei bedruckte Positionen'));
});

test('Zeilen mit Großformat-Zuschlag erklären ihn mit dem Betrag aus der Preis-Engine (25 T-Shirts mit Rückenmotiv 28 × 28 cm)', async () => {
  const s = KATEGORIE_SEITEN.find((x) => x.slug === 't-shirts-bedrucken-besticken')!;
  const b = sichtbareBeispiele(s, false);
  const ber = await berechneBeispiele({ slug: s.slug, beispiele: b });
  const i = ber.findIndex((e) => e.grossformatJeStueck > 0);
  assert.ok(i >= 0, 'diese Zeile enthält einen Großformat-Zuschlag');
  const h = normal(zeilenHinweise({ menge: ber[i]!.menge, positionen: b[i]!.flaechen.length, grossformat: ber[i]!.grossformatJeStueck }).join(' '));
  assert.match(h, /zwei bedruckte Positionen/);
  assert.match(h, /Großformat-Zuschlag von 4,00 € je Stück/);
  assert.match(h, /Standardformat \(bis ca\. 26 × 32 cm\)/);
  assert.equal(grossformatHinweis(0), null);
});

test('Auf keiner Seite steckt ein Großformat-Zuschlag in einer Beispielzeile, ohne dass er erklärt wird', async () => {
  let mitGross = 0;
  const pruefe = (slug: string, e: { grossformatJeStueck: number; menge: number }, positionen: number) => {
    if (e.grossformatJeStueck > 0) {
      mitGross++;
      const h = zeilenHinweise({ menge: e.menge, positionen, grossformat: e.grossformatJeStueck }).join(' ');
      assert.match(h, /Großformat-Zuschlag/, `${slug}: Zuschlag unerklärt`);
    }
  };
  for (const s of ANLASS_SEITEN) {
    const ber = await berechneBeispiele({ slug: s.slug, beispiele: alsKategorieBeispiele(s.beispiele) });
    ber.forEach((e, i) => pruefe(s.slug, e, s.beispiele[i]!.flaechen.length));
  }
  for (const s of DTF_SEITEN) {
    const w = dtfBeispiele(s, dtfFakten(s));
    const ber = await berechneBeispiele({ slug: s.slug, beispiele: w.beispiele });
    ber.forEach((e, i) => pruefe(s.slug, e, w.beispiele[i]!.flaechen.length));
  }
  for (const s of KATEGORIE_SEITEN) {
    const b = sichtbareBeispiele(s, false);
    const ber = await berechneBeispiele({ slug: s.slug, beispiele: b });
    ber.forEach((e, i) => pruefe(s.slug, e, b[i]!.flaechen.length));
  }
  assert.ok(mitGross >= 1);
});
