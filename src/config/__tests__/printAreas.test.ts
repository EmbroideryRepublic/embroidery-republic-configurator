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
import { PRINT_AREA_DATA } from '../printAreaData';
import { PRINT_AREA_DATA as GEMESSEN } from '../printAreaData.generated';
import { GEOMETRY_ALIAS } from '../printAreaAlias.generated';
import { PRODUCTS } from '../products';
import { ansichtenVon } from '@/lib/products/ansichten';

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

test('die Druckflächen-Ansichten entsprechen den deklarierten Produkt-Ansichten', () => {
  // Generisch statt front/back/sleeve-fixiert: Die im (alias-aufgelösten)
  // PRINT_AREA_DATA vorhandenen Ansichten müssen exakt den vom Produkt
  // geführten Ansichten (ansichtenVon) entsprechen – gilt auch für Nicht-
  // Kleidung (Tasche/Schürze).
  for (const p of PRODUCTS) {
    const flaechen = Object.keys(PRINT_AREA_DATA[p.id] ?? {}).sort();
    const deklariert = [...ansichtenVon(p)].sort();
    assert.deepEqual(flaechen, deklariert, `${p.id}: Druckflächen-Ansichten weichen von den deklarierten ab`);
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
      assert.ok(a.boxWidthCm > 0, `${a.view}: boxWidthCm <= 0`);
      assert.ok(a.boxHeightCm > 0);
      assert.equal(a.productId, 'gildan-heavy-t');
    }
  }
});

test('unbekannte Produkte liefern eine leere Liste statt zu werfen', async () => {
  assert.deepEqual(await getPrintAreas('gibt-es-nicht', 'dtf'), []);
});

// ── Klassen-Alias-Merge (printAreaData.ts vereint GEMESSEN + GEOMETRY_ALIAS) ──
// Der Merge macht `merged = {...GEMESSEN}` und setzt dann je Alias-Eintrag
// `merged[neu] = GEMESSEN[rep]` – OHNE Kollisionsschutz. Diese zwei Invarianten
// sichern die Import-Groundwork gegen einen fehlerhaften Generatorlauf; heute
// grün (0 Schnittmenge, alle rep-Ziele vorhanden), rein datengetrieben.

test('Klassen-Alias überschreibt keine gemessene Druckfläche', () => {
  // Wäre ein Alias-Schlüssel zugleich eine gemessene Produkt-ID, ersetzte der
  // Merge deren echte Flächen still durch die des Klassen-Vertreters.
  const gemessen = new Set(Object.keys(GEMESSEN));
  const kollisionen = Object.keys(GEOMETRY_ALIAS).filter((k) => gemessen.has(k));
  assert.deepEqual(kollisionen, [], `Alias-Schlüssel kollidieren mit gemessenen IDs: ${kollisionen.join(', ')}`);
});

test('jedes Alias-Ziel verweist auf eine gemessene Druckfläche', () => {
  // Zeigt ein Alias auf eine nicht gemessene ID, bleibt merged[neu] ungesetzt –
  // das aliasierte Produkt hätte still gar keine Druckflächen.
  const gemessen = new Set(Object.keys(GEMESSEN));
  for (const rep of Object.values(GEOMETRY_ALIAS)) {
    assert.ok(gemessen.has(rep), `Alias-Ziel "${rep}" ist keine gemessene Druckfläche`);
  }
});
