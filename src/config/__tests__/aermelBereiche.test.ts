/**
 * Ärmelflächen nach der Sichtprüfung vom 2026-11-14 („lieber größere Flächen
 * als zu kleine"): Die Kanten stehen je Produkt in scripts/aermelBereiche.json
 * (am Foto mit Prozent-Gitter abgelesen), der Generator übernimmt sie und
 * spiegelt sie für den rechten Ärmel. Diese Tests halten fest, dass
 *   • die abgelesenen Werte vollständig und plausibel sind,
 *   • die erzeugten Daten sie wirklich enthalten (kein Generatorlauf vergessen),
 *   • der rechte Ärmel exakt das Spiegelbild ist,
 *   • keine Ärmelfläche wieder zu klein wird und der Startpunkt in der Fläche liegt,
 *   • die frühere Motivhöhen-Grenze von 10 cm nicht zurückkehrt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRINT_AREA_DATA } from '../printAreaData';
import { PRINT_AREA_DATA as GEMESSEN } from '../printAreaData.generated';
import { PRODUCTS } from '../products';
import { DECORATION_POSITIONS } from '../decorationPositions';

const bereiche = JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'scripts', 'aermelBereiche.json'), 'utf8')) as Record<
  string,
  [number, number, number, number]
>;
const IDS = Object.keys(bereiche);
const TOLERANZ = 0.2; // Prozentpunkte (Rundung auf 0,1 im Generator)

test('aermelBereiche.json: nicht leer, jede ID ist ein Produkt, Kanten sind plausibel', () => {
  assert.ok(IDS.length >= 90, `nur ${IDS.length} Einträge – es fehlen abgelesene Ärmel`);
  const produktIds = new Set(PRODUCTS.map((p) => p.id));
  for (const id of IDS) {
    assert.ok(produktIds.has(id), `${id}: kein Produkt dieses Namens`);
    const [x0, y0, x1, y1] = bereiche[id]!;
    assert.ok(x0 >= 0 && x1 <= 100 && y0 >= 0 && y1 <= 100, `${id}: Kante außerhalb des Bildes`);
    assert.ok(x1 - x0 >= 12, `${id}: Fläche nur ${(x1 - x0).toFixed(1)} % breit`);
    assert.ok(y1 - y0 >= 15, `${id}: Fläche nur ${(y1 - y0).toFixed(1)} % hoch`);
  }
});

test('erzeugte Daten enthalten die abgelesenen Kanten (links) und ihr Spiegelbild (rechts)', () => {
  for (const id of IDS) {
    const [x0, y0, x1, y1] = bereiche[id]!;
    const l = GEMESSEN[id]?.sleeve_left;
    const r = GEMESSEN[id]?.sleeve_right;
    assert.ok(l && r, `${id}: Ärmelfläche links/rechts fehlt in den erzeugten Daten – Generator laufen lassen`);
    for (const [name, ist, soll] of [
      ['links x0', l!.x0, x0],
      ['links y0', l!.y0, y0],
      ['links x1', l!.x1, x1],
      ['links y1', l!.y1, y1],
      ['rechts x0', r!.x0, 100 - x1],
      ['rechts y0', r!.y0, y0],
      ['rechts x1', r!.x1, 100 - x0],
      ['rechts y1', r!.y1, y1],
    ] as const) {
      assert.ok(Math.abs(ist - soll) <= TOLERANZ, `${id}: ${name} ${ist} statt ${soll} – erzeugte Daten veraltet`);
    }
  }
});

test('keine Ärmelfläche ist zu klein, der Startpunkt liegt in der Fläche, Motivmaß = Fläche', () => {
  // Geprüft werden die Produkte MIT Ärmelfoto (= die abgelesenen). Acht weitere
  // Produkte (u. a. bundc-inspire-t-women, stedman-classic-t-v-neck) haben nur
  // Vorder-/Rückfotos; ihre Ärmelzeilen im Datenbestand sind Klassenwerte, der
  // Reiter „Ärmel" erscheint dort nicht (sichtbareAnsichten verlangt Ärmelfotos).
  let geprueft = 0;
  for (const id of IDS) {
    const views = PRINT_AREA_DATA[id]!;
    for (const view of ['sleeve_left', 'sleeve_right'] as const) {
      const a = views[view];
      if (!a) continue;
      geprueft++;
      assert.ok(a.boxWidthCm >= 9, `${id}/${view}: Fläche nur ${a.boxWidthCm} cm breit`);
      assert.ok(a.boxHeightCm >= 12, `${id}/${view}: Fläche nur ${a.boxHeightCm} cm hoch`);
      assert.ok(Math.abs(a.maxHeightCm - a.boxHeightCm) < 0.05, `${id}/${view}: Motivhöhe ${a.maxHeightCm} ≠ Fläche ${a.boxHeightCm}`);
      if (a.startXCm !== undefined && a.startYCm !== undefined) {
        assert.ok(a.startXCm >= 0 && a.startXCm <= a.boxWidthCm, `${id}/${view}: Startpunkt x ${a.startXCm} außerhalb 0..${a.boxWidthCm}`);
        assert.ok(a.startYCm >= 0 && a.startYCm <= a.boxHeightCm, `${id}/${view}: Startpunkt y ${a.startYCm} außerhalb 0..${a.boxHeightCm}`);
      }
    }
  }
  assert.ok(geprueft >= 180, `nur ${geprueft} Ärmelflächen geprüft`);
});

test('Ärmel: die frühere Motivhöhen-Grenze von 10 cm ist weg (Langarm/Kapuze > 30 cm, Kurzarm > 15 cm)', () => {
  assert.ok(DECORATION_POSITIONS.sleeve_left!.prozessgrenze!.maxHeightCm >= 40, 'Registry deckelt die Ärmelhöhe wieder');
  assert.ok(DECORATION_POSITIONS.sleeve_right!.prozessgrenze!.maxHeightCm >= 40, 'Registry deckelt die Ärmelhöhe wieder');
  const langarm = PRINT_AREA_DATA['justhoods-quarterzip-sweat']?.sleeve_left;
  assert.ok(langarm && langarm.maxHeightCm > 30, `Quarter-Zip-Sweat: Motivhöhe ${langarm?.maxHeightCm} cm`);
  const kurzarm = PRINT_AREA_DATA['gildan-heavy-t']?.sleeve_left;
  assert.ok(kurzarm && kurzarm.maxHeightCm > 15, `Gildan Heavy T: Motivhöhe ${kurzarm?.maxHeightCm} cm`);
});
