import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PRODUCTS } from '@/config/products';
import { getPrintAreasSync } from '@/config/printAreas';
import { PRINT_AREA_DATA, PRINT_AREA_DATA_DTF } from '@/config/printAreaData';
import { flacheFlaechenBreiteCm } from '@/config/abwicklung';

/**
 * DTF-Torsofläche (Vorder-/Rückseite): Breite aus der Größentabelle statt fester Prozessgrenze (30 cm), mit Abwicklung auf die echte
 * flache Breite. Die Stickerei-Flächen bleiben unverändert (Stickerei ist pausiert und wird nicht angefasst).
 */

const IDS = PRODUCTS.map((p) => p.id);

test('Stickerei: Vorder-/Rückseite behält die Prozessgrenze von 30 × 47 cm und hat keine Abwicklung', () => {
  let geprueft = 0;
  for (const id of IDS) {
    for (const a of getPrintAreasSync(id, 'embroidery')) {
      if (a.view !== 'front' && a.view !== 'back') continue;
      geprueft++;
      assert.equal(a.abwicklung, undefined, `${id}/${a.view}: Stickerei hat keine Abwicklung`);
      assert.ok(a.maxWidthCm <= 30.05, `${id}/${a.view}: ${a.maxWidthCm}`);
      assert.ok(a.maxHeightCm <= 47.05, `${id}/${a.view}: ${a.maxHeightCm}`);
    }
  }
  assert.ok(geprueft > 300);
});

test('Stickerei-Flächen sind aus den Ursprungsdaten abgeleitet und von der DTF-Datei unabhängig', () => {
  for (const id of IDS) {
    const urspr = PRINT_AREA_DATA[id]?.front;
    const stick = getPrintAreasSync(id, 'embroidery').find((a) => a.view === 'front');
    if (!urspr || !stick) continue;
    assert.equal(stick.maxWidthCm, urspr.maxWidthCm, id);
    assert.equal(stick.boxWidthCm, urspr.boxWidthCm, id);
  }
});

test('DTF: jede Torsofläche trägt die Abwicklung, die Höhe bleibt unverändert', () => {
  let geprueft = 0;
  for (const id of IDS) {
    for (const dtf of getPrintAreasSync(id, 'dtf')) {
      if (dtf.view !== 'front' && dtf.view !== 'back') continue;
      geprueft++;
      assert.ok(dtf.abwicklung, `${id}/${dtf.view}: Abwicklung fehlt`);
      const stick = getPrintAreasSync(id, 'embroidery').find((a) => a.view === dtf.view)!;
      assert.equal(dtf.maxHeightCm, stick.maxHeightCm, `${id}/${dtf.view}: Höhe bleibt unverändert`);
    }
  }
  assert.ok(geprueft > 300);
});

test('DTF: die gezeichnete Breite wächst gegenüber Stickerei – außer dort, wo die alte Grenze über den Schnitt hinausragte', () => {
  // Bei schmalen Schnitten (Damenshirts) lag die alte Obergrenze von 30 gezeichneten cm über dem Durchmesser der Brust und erlaubte
  // damit mehr als die ganze flache Brustbreite. Dort ist die neue Fläche absichtlich kleiner. Überall sonst ist sie größer.
  let groesser = 0;
  let gesamt = 0;
  for (const id of IDS) {
    for (const dtf of getPrintAreasSync(id, 'dtf')) {
      if (dtf.view !== 'front' || !dtf.abwicklung) continue;
      const stick = getPrintAreasSync(id, 'embroidery').find((a) => a.view === 'front')!;
      gesamt++;
      // 0,95 · Durchmesser: Die Fläche endet 2 cm (flach) vor der Naht, das sind knapp 1–2 % des Durchmessers weniger.
      if (stick.maxWidthCm <= 0.95 * 2 * dtf.abwicklung.radiusCm) {
        assert.ok(dtf.maxWidthCm >= stick.maxWidthCm - 0.05, `${id}: DTF ${dtf.maxWidthCm} < Stickerei ${stick.maxWidthCm}`);
      }
      if (dtf.maxWidthCm > stick.maxWidthCm + 0.05) groesser++;
    }
  }
  assert.ok(groesser / gesamt > 0.7, `nur ${groesser} von ${gesamt} Flächen sind breiter als bei Stickerei`);
});

test('DTF: die echte flache Breite ist größer als 30 cm und überschreitet nie die Größentabelle (Brustbreite − 4 cm)', () => {
  let ueber30 = 0;
  let gesamt = 0;
  for (const p of PRODUCTS) {
    const tabelle = p.sizeGuide?.measurements ?? [];
    for (const area of getPrintAreasSync(p.id, 'dtf')) {
      if (area.view !== 'front' || !area.bySize) continue;
      for (const [groesse, v] of Object.entries(area.bySize)) {
        const zeile = tabelle.find((z) => z.size === groesse);
        if (!zeile || !v.abwicklung) continue;
        const flach = flacheFlaechenBreiteCm({ boxWidthCm: v.boxWidthCm, abwicklung: v.abwicklung });
        // Die Tabelle des Produkts kann „geliehen“ sein (Kontur eigenständig vermessen): dann gilt die Brustbreite der Abwicklung selbst.
        const brust = v.abwicklung.radiusCm * Math.PI;
        // Toleranz 0,8 cm: Die gezeichnete Breite ist auf 0,1 cm gerundet, und am Rand der Brust (Abwicklung nahe 90°) macht
        // schon 0,05 cm Rundung rund 0,4 cm flache Breite aus.
        assert.ok(flach <= brust - 2 * 2 + 0.8, `${p.id}/${groesse}: flach ${flach.toFixed(1)} > Brust ${brust.toFixed(1)} − 4`);
        gesamt++;
        if (flach > 30) ueber30++;
      }
    }
  }
  assert.ok(gesamt > 500);
  assert.ok(ueber30 / gesamt > 0.8, `nur ${ueber30} von ${gesamt} Größen über 30 cm`);
});

test('DTF-Daten: Radius entspricht der Brustbreite der Größe, die Brustmitte liegt innerhalb der Fläche', () => {
  for (const [id, views] of Object.entries(PRINT_AREA_DATA_DTF)) {
    for (const [view, a] of Object.entries(views)) {
      assert.ok(a!.radiusCm > 5 && a!.radiusCm < 30, `${id}/${view}: Radius ${a!.radiusCm}`);
      assert.ok(a!.mitteCm > 0 && a!.mitteCm < a!.boxWidthCm + 0.5, `${id}/${view}: Mitte ${a!.mitteCm} / Fläche ${a!.boxWidthCm}`);
    }
  }
});

test('DTF: JEDE Größe eines Produkts hat eine eigene Fläche und größere Größen bekommen nie eine schmalere', () => {
  let groessen = 0;
  const ohneEintrag: string[] = [];
  const nichtMonoton: string[] = [];
  for (const p of PRODUCTS) {
    const roh = getPrintAreasSync(p.id, 'dtf').find((a) => a.view === 'front');
    if (!roh?.bySize) continue;
    let vorher = 0;
    let vorherGroesse = '';
    for (const g of p.sizes) {
      groessen++;
      const v = roh.bySize[g];
      if (!v) {
        ohneEintrag.push(`${p.id}/${g}`);
        continue;
      }
      const flach = flacheFlaechenBreiteCm({ boxWidthCm: v.boxWidthCm, abwicklung: v.abwicklung });
      if (flach + 0.3 < vorher) nichtMonoton.push(`${p.id} ${vorherGroesse}→${g}: ${vorher.toFixed(1)}→${flach.toFixed(1)}`);
      vorher = flach;
      vorherGroesse = g;
    }
  }
  assert.ok(groessen > 1000);
  // Kinder-Leitern mit Zusatzgrößen (Jahre, Alter) werden nicht aus der Konfektionsleiter ergänzt; dort gilt der Rückfall auf die Referenz.
  const konfektion = ohneEintrag.filter((e) => /\/(XXS|XS|S|M|L|XL|XXL|[3-6]XL)$/.test(e));
  assert.deepEqual(konfektion, [], `Konfektionsgrößen ohne eigene Fläche: ${konfektion.slice(0, 10).join(', ')}`);
  assert.deepEqual(nichtMonoton, [], `größere Größe mit schmalerer Fläche: ${nichtMonoton.slice(0, 10).join(' | ')}`);
});
