/**
 * Preisbeispiele der beiden Ratgeber „Poloshirt mit Logo“ und „Arbeitskleidung“ (Prüfung 2026-11-25).
 *
 * Auftrag des Betreibers: Es dürfen keine missverständlichen Preisangaben erscheinen. Zwei Fälle waren ohne Erklärung
 * missverständlich: Das Einzelstück enthält die einmalige Einrichtung (Regel dtf-kleinauftrag), und ein Beispiel mit
 * Brust- UND Rückenmotiv kostet je Stück mehr als ein Beispiel mit kleinerer Menge und nur einer Position.
 * Die Tests halten fest, dass die Zeilen in dieser Reihenfolge vergleichbar bleiben und der Erklärsatz zur Rechnung passt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ANLASS_SEITEN } from '@/config/seo/anlassSeiten';
import { KLEINAUFTRAG_MAX_STUECK, KLEINAUFTRAG_PAUSCHALE_EUR } from '@/config/pricingRules';
import { berechneBeispiele } from '../kategorieSeite';
import { alsKategorieBeispiele } from '../anlassSeite';

const RATGEBER = ['poloshirt-mit-logo-bedrucken', 'arbeitskleidung-bedrucken'];

function seite(slug: string) {
  const s = ANLASS_SEITEN.find((x) => x.slug === slug);
  assert.ok(s, `Seite ${slug} fehlt`);
  return s;
}
async function rechne(slug: string) {
  const s = seite(slug);
  return berechneBeispiele({ slug, beispiele: alsKategorieBeispiele(s.beispiele) });
}

test('Ratgeber: Beispiele mit Einrichtung (bis zur Kleinauftrags-Grenze) erklären sie mit Betrag und Grenze aus der Regel', async () => {
  for (const slug of RATGEBER) {
    const s = seite(slug);
    const ergebnis = await rechne(slug);
    ergebnis.forEach((e, i) => {
      if (e.menge > KLEINAUFTRAG_MAX_STUECK) return;
      const hinweis = (s.beispiele[i]?.hinweis ?? '').replace(/ /g, ' '); // geschützte Leerzeichen wie normale behandeln
      assert.ok(hinweis.includes(`${KLEINAUFTRAG_PAUSCHALE_EUR} €`), `${slug}: Zeile „${e.beschriftung}“ nennt die Einrichtung nicht`);
      assert.ok(hinweis.includes(`${KLEINAUFTRAG_MAX_STUECK} Stück`), `${slug}: Zeile „${e.beschriftung}“ nennt die Grenze nicht`);
    });
  }
});

test('Ratgeber: Jede Zeile mit zwei bedruckten Positionen erklärt, dass die zweite Position hinzukommt', () => {
  for (const slug of RATGEBER) {
    const s = seite(slug);
    for (const b of s.beispiele.filter((x) => x.flaechen.length > 1)) {
      assert.match(b.hinweis ?? '', /zwei bedruckte Positionen/, `${slug}: „${b.beschriftung}“ erklärt die zweite Position nicht`);
    }
  }
});

test('Polo-Ratgeber: bei gleicher Konfiguration sinkt der Stückpreis mit der Menge, die zweite Position erhöht ihn – wie erklärt', async () => {
  const s = seite('poloshirt-mit-logo-bedrucken');
  const e = await rechne('poloshirt-mit-logo-bedrucken');
  const zeile = (menge: number, positionen: number) => {
    const i = s.beispiele.findIndex((b) => b.menge === menge && b.flaechen.length === positionen);
    assert.ok(i >= 0, `Zeile mit ${menge} Stück und ${positionen} Position(en) fehlt`);
    return e[i]!;
  };
  const eins = zeile(1, 1);
  const zehn = zeile(10, 1);
  const fuenfundzwanzig = zeile(25, 1);
  const fuenfundzwanzigMitRuecken = zeile(25, 2);
  assert.ok(zehn.stueckpreis < eins.stueckpreis, 'Menge 10 ist günstiger als Einzelstück (bei gleicher Position)');
  assert.ok(fuenfundzwanzig.stueckpreis < zehn.stueckpreis, 'Menge 25 ist bei gleicher Position günstiger als Menge 10');
  assert.ok(fuenfundzwanzigMitRuecken.stueckpreis > fuenfundzwanzig.stueckpreis, 'der Rücken verteuert die Zeile darüber');
  // Genau das, was der Hinweis unter der 25er-Zeile erklärt: teurer als die 10er-Zeile, obwohl die Menge größer ist.
  assert.ok(fuenfundzwanzigMitRuecken.stueckpreis > zehn.stueckpreis);
  const hinweis = s.beispiele.find((b) => b.menge === 25 && b.flaechen.length === 2)?.hinweis ?? '';
  assert.match(hinweis, /Zeile darüber/);
  assert.match(hinweis, /10-Stück-Zeile/);
  // Die Zeile „darüber“ ist wirklich die 25er-Zeile mit nur einer Position.
  const iMitRuecken = s.beispiele.findIndex((b) => b.menge === 25 && b.flaechen.length === 2);
  assert.equal(s.beispiele[iMitRuecken - 1]?.menge, 25);
  assert.equal(s.beispiele[iMitRuecken - 1]?.flaechen.length, 1);
});

test('Ratgeber: Gesamtpreis = Stückpreis × Stückzahl (kein versteckter Posten, keine Rundungsabweichung über 1 Cent je Stück)', async () => {
  for (const slug of RATGEBER) {
    for (const e of await rechne(slug)) {
      assert.ok(Math.abs(e.stueckpreis * e.menge - e.gesamt) < 0.01 * e.menge, `${slug}: „${e.beschriftung}“ Gesamtpreis passt nicht zum Stückpreis`);
    }
  }
});

test('Ratgeber: Der Satz über den Preisbeispielen verspricht keine durchgehend sinkenden Preise, wenn die Zeilen nicht vergleichbar sind', () => {
  for (const slug of RATGEBER) {
    const text = seite(slug).beispieleEinleitung ?? '';
    assert.ok(text.length > 0, `${slug}: Einleitung der Preisbeispiele fehlt`);
    assert.ok(!/^Mit steigender Menge sinkt der Stückpreis –/.test(text), `${slug}: Standardsatz passt nicht zu den Zeilen`);
  }
});

test('Die beiden Ratgeber sprechen durchgehend Du (auch die Erklärsätze zu den Preisbeispielen, „Sie“ auch nicht als Fürwort)', () => {
  // Gilt bewusst nur für diese beiden Seiten: /druckgroesse-t-shirt-hoodie (live) enthält zwei Sätze mit „Sie“ als Fürwort
  // („Sie reicht über die Brustbreite …“), die der Betreiber bisher nicht beanstandet hat.
  const SIE = /\b(Sie|Ihnen|Ihre|Ihren|Ihrem|Ihrer|Ihres|Ihr)\b/;
  for (const slug of RATGEBER) {
    const treffer = JSON.stringify(seite(slug)).match(SIE);
    assert.equal(treffer, null, `${slug}: formelle Anrede/„Sie“ gefunden: ${treffer?.[0]}`);
  }
});
