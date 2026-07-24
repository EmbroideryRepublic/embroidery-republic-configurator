/**
 * Absicherung des hybriden Flächenmodells.
 *
 * Die Flächen werden erzeugt (scripts/generatePrintAreaData.mts), nicht von
 * Hand gepflegt. Diese Tests prüfen deshalb nicht einzelne Zahlen, sondern
 * die Eigenschaften, die für JEDES Produkt gelten müssen – damit ein
 * fehlerhafter Generatorlauf auffällt, bevor er in den Konfigurator kommt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPrintAreas } from '../printAreas';
import { PRINT_AREA_DATA } from '../printAreaData.generated';
import { PRODUCTS } from '../products';

/** Prozessgrenzen aus dem Generator – hier gespiegelt als Obergrenze. */
const GRENZE = {
  front: { w: 30, h: 47 },
  back: { w: 30, h: 47 },
  sleeve_left: { w: 11, h: 13 },
  sleeve_right: { w: 11, h: 13 },
} as const;

test('jedes Katalogprodukt hat Druckflächen', () => {
  for (const p of PRODUCTS) {
    assert.ok(PRINT_AREA_DATA[p.id], `${p.id} hat keine Flächen`);
  }
});

test('jedes Produkt führt Vorder- und Rückseite', () => {
  for (const [id, views] of Object.entries(PRINT_AREA_DATA)) {
    assert.ok(views.front, `${id}: front fehlt`);
    assert.ok(views.back, `${id}: back fehlt`);
  }
});

test('Ärmelansichten genau dann, wenn das Produkt sie führt', () => {
  for (const p of PRODUCTS) {
    const views = PRINT_AREA_DATA[p.id]!;
    const erwartet = p.hasSleeves !== false;
    assert.equal(Boolean(views.sleeve_left), erwartet, `${p.id}: sleeve_left`);
    assert.equal(Boolean(views.sleeve_right), erwartet, `${p.id}: sleeve_right`);
  }
});

test('alle Flächen liegen innerhalb des Bildes', () => {
  for (const [id, views] of Object.entries(PRINT_AREA_DATA)) {
    for (const [view, a] of Object.entries(views)) {
      assert.ok(a!.x0 >= 0 && a!.x1 <= 100, `${id}/${view}: x außerhalb (${a!.x0}..${a!.x1})`);
      assert.ok(a!.y0 >= 0 && a!.y1 <= 100, `${id}/${view}: y außerhalb (${a!.y0}..${a!.y1})`);
      assert.ok(a!.x1 > a!.x0, `${id}/${view}: Breite <= 0`);
      assert.ok(a!.y1 > a!.y0, `${id}/${view}: Höhe <= 0`);
    }
  }
});

test('keine Fläche überschreitet die Prozessgrenzen der Veredelung', () => {
  for (const [id, views] of Object.entries(PRINT_AREA_DATA)) {
    for (const [view, a] of Object.entries(views)) {
      const g = GRENZE[view as keyof typeof GRENZE];
      assert.ok(a!.maxWidthCm <= g.w, `${id}/${view}: ${a!.maxWidthCm} cm > ${g.w} cm`);
      assert.ok(a!.maxHeightCm <= g.h, `${id}/${view}: ${a!.maxHeightCm} cm > ${g.h} cm`);
      assert.ok(a!.maxWidthCm > 0 && a!.maxHeightCm > 0, `${id}/${view}: Maß <= 0`);
    }
  }
});

test('die Fläche bleibt schmaler als das Kleidungsstück', () => {
  // Kernversprechen des Modells: Es wird nie über die Seitennaht hinaus
  // bedruckt. Die nutzbare Breite muss unter der Brustbreite liegen.
  for (const p of PRODUCTS) {
    const a = PRINT_AREA_DATA[p.id]?.front;
    if (!a) continue;
    const mass = p.sizeGuide?.measurements.find((m) => m.size === 'M') ?? p.sizeGuide?.measurements[0];
    if (!mass) continue;
    assert.ok(
      a.maxWidthCm < mass.breiteCm,
      `${p.id}: Druckbreite ${a.maxWidthCm} cm >= Brustbreite ${mass.breiteCm} cm`
    );
  }
});

test('schmalere Schnitte bekommen schmalere Flächen als weite', () => {
  // Belegt, dass das Modell den Schnitt tatsächlich berücksichtigt und nicht
  // wieder auf eine Pauschale hinausläuft.
  //
  // Geprüft wird `garmentWidthCm` (aus dem Kleidungsstück abgeleitet), NICHT
  // `maxWidthCm`: Bei Vorder- und Rückseite greift durchweg die
  // 30-cm-Prozessgrenze des DTF-Transfers, sodass die effektive Maximalgröße
  // für alle Erwachsenengrößen gleich ist. Der Schnitt wirkt sich dort auf
  // die PLATZIERUNGSFLÄCHE aus, nicht auf die Motivgröße.
  const damen = PRINT_AREA_DATA['fotl-ladies-valueweight-t']?.front;
  const herren = PRINT_AREA_DATA['fotl-valueweight-t']?.front;
  assert.ok(damen && herren);
  assert.ok(
    damen.garmentWidthCm < herren.garmentWidthCm,
    `Damenschnitt ${damen.garmentWidthCm} cm sollte schmaler sein als ${herren.garmentWidthCm} cm`
  );
});

test('die effektive Fläche ist nie größer als die Kleidungsstückfläche', () => {
  for (const [id, views] of Object.entries(PRINT_AREA_DATA)) {
    for (const [view, a] of Object.entries(views)) {
      assert.ok(
        a!.maxWidthCm <= a!.garmentWidthCm,
        `${id}/${view}: effektiv ${a!.maxWidthCm} cm > Kleidungsstück ${a!.garmentWidthCm} cm`
      );
      assert.ok(
        a!.maxHeightCm <= a!.garmentHeightCm,
        `${id}/${view}: effektiv ${a!.maxHeightCm} cm > Kleidungsstück ${a!.garmentHeightCm} cm`
      );
    }
  }
});

test('getPrintAreas liefert vollständige Bereiche für beide Methoden', async () => {
  for (const method of ['dtf', 'embroidery'] as const) {
    const areas = await getPrintAreas('gildan-heavy-t', method);
    assert.equal(areas.length, 4, `${method}: 4 Ansichten erwartet`);
    for (const a of areas) {
      assert.ok(a.movementWidthCm > 0, `${a.view}: movementWidthCm <= 0`);
      assert.ok(a.referenceGarmentHeightCm > 0);
      assert.equal(a.productId, 'gildan-heavy-t');
    }
  }
});

test('unbekannte Produkte liefern eine leere Liste statt zu werfen', async () => {
  assert.deepEqual(await getPrintAreas('gibt-es-nicht', 'dtf'), []);
});
