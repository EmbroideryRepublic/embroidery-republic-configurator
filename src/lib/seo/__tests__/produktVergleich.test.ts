/**
 * Wächter für „Im Vergleich“ und „Druckfläche je Größe“ (lib/seo/produktVergleich.ts, config/seo/produktPilot.ts).
 *
 * Der Baustein entsteht aus Katalogdaten. Die Tests verhindern die stillen Fehler solcher Texte: ein Pilot-Modell, das es nicht mehr gibt,
 * eine Alternative, die gar keine ist (andere Art, dasselbe Modell, Damen gegen Herren), eine Zahl, die nicht zu den Daten passt, ein Wort
 * wie „undefined“ oder „NaN“ und ein Versprechen (Stickerei), das der Betrieb gerade nicht einlösen kann.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { VERGLEICH_PRODUKTE, hatVergleichsBaustein } from '@/config/seo/produktPilot';
import { ANZAHL_ALTERNATIVEN, druckflaechenJeGroesse, produktVergleich, unterschiede, waehleAlternativen } from '../produktVergleich';

const pilot = VERGLEICH_PRODUKTE.map((id) => PRODUCTS.find((p) => p.id === id));

test('Pilot: zwölf verschiedene Modelle, alle im Katalog', () => {
  assert.equal(VERGLEICH_PRODUKTE.length, 12);
  assert.equal(new Set(VERGLEICH_PRODUKTE).size, 12);
  pilot.forEach((p, i) => assert.ok(p, `${VERGLEICH_PRODUKTE[i]} fehlt im Katalog`));
  assert.ok(hatVergleichsBaustein('neutral-classic-polo'));
  assert.ok(!hatVergleichsBaustein('gibt-es-nicht'));
});

test('Alternativen: gleiche Art, nie das Modell selbst, keine Doppelten, höchstens die Sollzahl', () => {
  for (const p of PRODUCTS) {
    const alt = waehleAlternativen(p);
    assert.ok(alt.length <= ANZAHL_ALTERNATIVEN, `${p.id}: ${alt.length} Alternativen`);
    assert.equal(new Set(alt.map((a) => a.id)).size, alt.length, `${p.id}: doppelte Alternative`);
    for (const a of alt) {
      assert.notEqual(a.id, p.id, `${p.id} ist seine eigene Alternative`);
      // Andere Art nur als Lückenfüller, wenn die eigene Art zu wenige Modelle hat – und dann sagt der Satz es.
      if (a.productType !== p.productType) {
        const eigene = PRODUCTS.filter((x) => x.id !== p.id && x.productType === p.productType).length;
        assert.ok(eigene < ANZAHL_ALTERNATIVEN, `${p.id}: ${a.id} hat eine andere Art, obwohl es ${eigene} eigene gibt`);
        assert.ok(unterschiede(p, a)[0]!.startsWith('Art:'), `${p.id}: Art-Unterschied fehlt für ${a.id}`);
      }
    }
  }
});

test('Alternativen der Pilot-Seiten: genau drei, Damen-Modelle nur mit Damen-Modellen, mehrere Marken, nächste Gewichte', () => {
  for (const p of pilot) {
    const alt = waehleAlternativen(p!);
    assert.equal(alt.length, ANZAHL_ALTERNATIVEN, `${p!.id}: zu wenige Alternativen (${alt.length})`);
    const damen = (x: typeof p) => (x!.detailedDescription?.gender ?? '').toLowerCase().includes('damen');
    // Genug Modelle gleichen Schnitts → ausschließlich diese; sonst werden die übrigen aufgefüllt und der Satz nennt den Schnitt.
    const gleicherSchnitt = PRODUCTS.filter((x) => x.id !== p!.id && x.productType === p!.productType && damen(x) === damen(p));
    if (gleicherSchnitt.length >= ANZAHL_ALTERNATIVEN) {
      for (const a of alt) assert.equal(damen(a), damen(p), `${p!.id}: Schnitt von ${a.id} passt nicht`);
    } else {
      const andererSchnitt = alt.find((a) => a.productType === p!.productType && damen(a) !== damen(p));
      if (andererSchnitt) assert.ok(unterschiede(p!, andererSchnitt).some((t) => t.startsWith('Schnitt:')), `${p!.id}: Schnitt-Unterschied fehlt`);
    }
    assert.ok(new Set(alt.map((a) => a.brand)).size >= 2, `${p!.id}: alle Alternativen von einer Marke`);
  }
});

test('Pilot-Seiten: Vergleichstabelle, Aussagen und Texte ohne Rest-Platzhalter, undefined, NaN oder Stickerei', () => {
  for (const p of pilot) {
    const v = produktVergleich(p!);
    assert.equal(v.modelle[0]!.id, p!.id, 'erste Zeile ist das Modell der Seite');
    assert.equal(v.modelle.length, 1 + ANZAHL_ALTERNATIVEN);
    assert.equal(v.aussagen.length, ANZAHL_ALTERNATIVEN);
    const text = JSON.stringify(v);
    assert.doesNotMatch(text, /undefined|NaN|\{[a-zA-Z]+\}/, `${p!.id}: unsauberer Wert`);
    assert.doesNotMatch(text, /besticken|stickerei/i, `${p!.id}: Stickerei im Text`);
    for (const a of v.aussagen) assert.ok(a.satz.length > 10 && a.satz.endsWith('.'), `${p!.id}/${a.id}: Satz „${a.satz}“`);
  }
});

test('Unterschiede nennen nur, was in den Daten steht', () => {
  const heavy = PRODUCTS.find((p) => p.id === 'gildan-heavy-t')!;
  const ultra = PRODUCTS.find((p) => p.id === 'gildan-ultra-cotton-t-shirt')!;
  const teile = unterschiede(heavy, ultra);
  // 203 gegen 180 g/m²
  assert.ok(teile.some((t) => t === '23 g/m² schwerer'), teile.join(' | '));
  // 52 gegen 8 Farben
  assert.ok(teile.some((t) => t.startsWith('44 Farben mehr')), teile.join(' | '));
  // gleicher Grundpreis (11,99 €): kein Preissatz
  assert.ok(!teile.some((t) => t.includes('Textilpreis')), teile.join(' | '));
  // Umgekehrt: dasselbe Gewicht in die andere Richtung
  assert.ok(unterschiede(ultra, heavy).some((t) => t === '23 g/m² leichter'));
});

test('Zertifikate: nur positive Aussagen – ein fehlender Katalogeintrag wird nie als „ohne“ behauptet', () => {
  const neutral = PRODUCTS.find((p) => p.id === 'neutral-classic-polo')!;
  const bundc = PRODUCTS.find((p) => p.id === 'bundc-my-polo-180')!;
  assert.ok(unterschiede(bundc, neutral).some((t) => t.startsWith('mit GOTS')), unterschiede(bundc, neutral).join(' | '));
  for (const p of PRODUCTS) {
    for (const a of waehleAlternativen(p)) assert.ok(!unterschiede(p, a).some((t) => /^ohne /.test(t)), `${p.id}/${a.id}: „ohne“-Aussage`);
  }
  assert.deepEqual(produktVergleich(bundc).modelle[0]!.zertifikate, bundc.certifications);
});

test('Druckfläche je Größe: Größen aus dem Produkt, Flächen wachsen mit der Größe, Anteil passt zu den Maßen', () => {
  let mitDaten = 0;
  for (const p of pilot) {
    const zeilen = druckflaechenJeGroesse(p!);
    if (zeilen.length === 0) continue;
    mitDaten++;
    for (const z of zeilen) assert.ok(p!.sizes.includes(z.groesse), `${p!.id}: Größe ${z.groesse} gibt es nicht`);
    const vorne = zeilen.filter((z) => z.vorne);
    for (let i = 1; i < vorne.length; i++) {
      assert.ok(vorne[i]!.vorne!.breiteCm >= vorne[i - 1]!.vorne!.breiteCm, `${p!.id}: Frontbreite sinkt von ${vorne[i - 1]!.groesse} auf ${vorne[i]!.groesse}`);
    }
    for (const z of zeilen) {
      if (z.anteilBreiteProzent !== null) {
        assert.ok(z.kleidungBreiteCm && z.vorne);
        assert.equal(z.anteilBreiteProzent, Math.round((z.vorne!.breiteCm / z.kleidungBreiteCm!) * 100));
        assert.ok(z.anteilBreiteProzent > 0 && z.anteilBreiteProzent <= 100, `${p!.id}/${z.groesse}: Anteil ${z.anteilBreiteProzent} %`);
      }
    }
  }
  assert.ok(mitDaten >= 9, `nur ${mitDaten} von 12 Pilot-Seiten haben Flächen je Größe`);
});
