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
import { getPrintAreas, flaecheFuerGroesse } from '../printAreas';
import { PRINT_AREA_DATA } from '../printAreaData';
import { PRINT_AREA_DATA as GEMESSEN } from '../printAreaData.generated';
import { GEOMETRY_ALIAS } from '../printAreaAlias.generated';
import { PRODUCTS } from '../products';
import { ansichtenVon, sichtbareAnsichten } from '@/lib/products/ansichten';
import { groessenRang } from '../products/groessen';
import { DECORATION_POSITIONS } from '../decorationPositions';

/** Prozessgrenzen NICHT mehr hier gespiegelt (eine frühere Kopie lief mit
 *  sleeve h:13 bereits am realen Wert 10 vorbei) – stattdessen direkt aus der
 *  echten Quelle gelesen, damit ein künftiger Wertwechsel dort nie wieder
 *  unbemerkt an dieser Kopie vorbeilaufen kann. */
function prozessgrenzeVon(view: string) {
  const g = DECORATION_POSITIONS[view]?.prozessgrenze;
  assert.ok(g, `${view}: keine Prozessgrenze in decorationPositions.ts hinterlegt`);
  return g;
}

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

test('Druckflächen gibt es für jede ZEIGBARE Ansicht und nie für eine undeklarierte', () => {
  // Früher musste die Flächenliste exakt den deklarierten Ansichten entsprechen.
  // Das ging nur, solange das Manifest fehlende Ansichten auf das Vorderbild
  // aliaste – der Generator „vermaß" dann Ärmel auf dem Frontfoto. Ohne dieses
  // Alias gilt: Eine Fläche kann nur entstehen, wo es ein Bild gibt. Verbindlich
  // ist daher: (a) keine Fläche für eine nicht deklarierte Ansicht, (b) jede dem
  // Kunden gezeigte Ansicht hat eine Fläche.
  for (const p of PRODUCTS) {
    const flaechen = Object.keys(PRINT_AREA_DATA[p.id] ?? {});
    const deklariert = new Set<string>(ansichtenVon(p));
    for (const v of flaechen) {
      assert.ok(deklariert.has(v), `${p.id}: Fläche für undeklarierte Ansicht "${v}"`);
    }
    for (const c of p.colors) {
      for (const v of sichtbareAnsichten(p, c.id)) {
        assert.ok(flaechen.includes(v), `${p.id}/${c.id}: zeigbare Ansicht "${v}" ohne Druckfläche`);
      }
    }
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

test('front/back überschreiten nie die Prozessgrenze der Veredelung', () => {
  // Für Ärmel gilt seit der Betreiber-Auskunft vom 2026-09-04 eine andere
  // Regel (DTF-Presse hat dort KEINE Formatobergrenze) – eigener Test unten.
  for (const [id, views] of Object.entries(PRINT_AREA_DATA)) {
    for (const view of ['front', 'back'] as const) {
      const a = views[view];
      if (!a) continue;
      const g = prozessgrenzeVon(view);
      assert.ok(a.maxWidthCm <= g.maxWidthCm, `${id}/${view}: ${a.maxWidthCm} cm > ${g.maxWidthCm} cm`);
      assert.ok(a.maxHeightCm <= g.maxHeightCm, `${id}/${view}: ${a.maxHeightCm} cm > ${g.maxHeightCm} cm`);
      assert.ok(a.maxWidthCm > 0 && a.maxHeightCm > 0, `${id}/${view}: Maß <= 0`);
    }
  }
});

test('Ärmel (DTF-Rohdaten): maxWidthCm ist exakt der gemessene Bewegungsbereich, nie mehr', () => {
  // Betreiber-Auskunft 2026-09-04: DTF-Transfers haben keine eigene Format-
  // obergrenze für Ärmel ("die Grenze ist nur so groß wie der Ärmel an
  // sich") – PRINT_AREA_DATA (Generator-Rohdaten, methodenneutral = DTF)
  // darf die Breite deshalb NIE über den für dieses Produkt gemessenen
  // Bewegungsbereich (boxWidthCm) hinaus melden. Die Höhe bleibt bewusst an
  // der Prozessgrenze gedeckelt (siehe Kommentar in generatePrintAreaData.mts
  // zur zurückgestellten, gesondert zu prüfenden Höhen-Korrektur).
  const hoeheGrenze = prozessgrenzeVon('sleeve_left').maxHeightCm;
  let geprueft = 0;
  for (const [id, views] of Object.entries(PRINT_AREA_DATA)) {
    for (const view of ['sleeve_left', 'sleeve_right'] as const) {
      const a = views[view];
      if (!a) continue;
      geprueft++;
      assert.ok(
        Math.abs(a.maxWidthCm - a.boxWidthCm) < 0.05,
        `${id}/${view}: maxWidthCm (${a.maxWidthCm}) weicht vom gemessenen Bewegungsbereich (${a.boxWidthCm}) ab`
      );
      assert.ok(a.maxHeightCm <= hoeheGrenze, `${id}/${view}: ${a.maxHeightCm} cm > ${hoeheGrenze} cm`);
      assert.ok(a.maxWidthCm > 0 && a.maxHeightCm > 0, `${id}/${view}: Maß <= 0`);
    }
  }
  assert.ok(geprueft > 0, 'keine Ärmelansicht gefunden – Test liefe sonst grün, ohne etwas zu prüfen');
});

test('Ärmel (Laufzeit): Stickerei respektiert den echten Stickrahmen (30×19cm), DTF bleibt beim vollen Bewegungsbereich', async () => {
  // Stickrahmen laut Betreiber-Auskunft 2026-09-04: 30 cm Länge, 19 cm Höhe
  // – eine echte Maschinengrenze, die NUR Stickerei betrifft (siehe
  // STICKRAHMEN_AERMEL_CM in printAreas.ts). DTF bleibt ungedeckelt (bis auf
  // den je Produkt gemessenen Bewegungsbereich, siehe Test oben) – aktuell
  // liegt kein einziger gemessener Bewegungsbereich über 30 cm, die
  // Rahmengrenze greift heute also nirgends sichtbar, MUSS aber als
  // Obergrenze bestehen bleiben, sobald ein breiteres Produkt hinzukommt.
  const STICKRAHMEN = { breite: 30, hoehe: 19 };
  let geprueft = 0;
  for (const id of Object.keys(PRINT_AREA_DATA)) {
    const [dtf, stick] = await Promise.all([getPrintAreas(id, 'dtf'), getPrintAreas(id, 'embroidery')]);
    for (const view of ['sleeve_left', 'sleeve_right'] as const) {
      const dtfArea = dtf.find((a) => a.view === view);
      const stickArea = stick.find((a) => a.view === view);
      if (!dtfArea || !stickArea) continue;
      geprueft++;
      assert.ok(
        stickArea.maxWidthCm <= STICKRAHMEN.breite + 0.05,
        `${id}/${view}: Stickerei-Breite ${stickArea.maxWidthCm}cm > Stickrahmen ${STICKRAHMEN.breite}cm`
      );
      assert.ok(
        stickArea.maxHeightCm <= STICKRAHMEN.hoehe + 0.05,
        `${id}/${view}: Stickerei-Höhe ${stickArea.maxHeightCm}cm > Stickrahmen ${STICKRAHMEN.hoehe}cm`
      );
      // DTF darf gleich groß oder größer als Stickerei sein, nie kleiner –
      // der Stickrahmen ist eine zusätzliche Deckelung, keine Verengung der
      // gemeinsamen Basisfläche.
      assert.ok(
        dtfArea.maxWidthCm >= stickArea.maxWidthCm,
        `${id}/${view}: DTF-Breite (${dtfArea.maxWidthCm}) kleiner als Stickerei (${stickArea.maxWidthCm})`
      );
      assert.ok(
        dtfArea.maxHeightCm >= stickArea.maxHeightCm,
        `${id}/${view}: DTF-Höhe (${dtfArea.maxHeightCm}) kleiner als Stickerei (${stickArea.maxHeightCm})`
      );
    }
  }
  assert.ok(geprueft > 0, 'keine Ärmelansicht gefunden – Test liefe sonst grün, ohne etwas zu prüfen');
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
  // Seit alle 154 Produkte eigene Fotos haben, wird fast jedes auch einzeln
  // VERMESSEN – Alias-Schlüssel und gemessene IDs überschneiden sich damit
  // zwangsläufig. Früher war diese Überschneidung verboten, weil der Merge den
  // Alias gewinnen ließ und echte Messungen still ersetzte. Jetzt gewinnt die
  // Messung; geprüft wird direkt dieses Ergebnis – schärfer, weil es den Merge
  // selbst prüft statt einer Hilfsbedingung.
  for (const id of Object.keys(GEOMETRY_ALIAS)) {
    const eigene = GEMESSEN[id];
    if (!eigene) continue;
    assert.deepEqual(
      PRINT_AREA_DATA[id],
      eigene,
      `${id}: eigene Messung wurde vom Klassen-Alias überschrieben`
    );
  }
});

test('jedes Alias-Ziel verweist auf eine gemessene Druckfläche', () => {
  // Zeigt ein Alias auf eine nicht gemessene ID, bleibt merged[neu] ungesetzt –
  // das aliasierte Produkt hätte still gar keine Druckflächen.
  const gemessen = new Set(Object.keys(GEMESSEN));
  for (const rep of Object.values(GEOMETRY_ALIAS)) {
    assert.ok(gemessen.has(rep), `Alias-Ziel "${rep}" ist keine gemessene Druckfläche`);
  }
});

// ── Größenabhängige Torsoflächen (bySize) ───────────────────────────────
// Jede Größe der Maßtabelle bekommt in scripts/generatePrintAreaData.mts
// eine eigene, aus derselben Bildkontur berechnete Fläche (front/back). Diese
// Tests sichern die Eigenschaften, die für JEDE Größe jedes Produkts gelten
// müssen – analog zu den Prüfungen oben für die Referenzgröße.

test('Ärmelansichten führen nie größenabhängige Flächen', () => {
  // Die Ärmelfläche ist bewusst konstant (AERMEL_KONSERVATIV_CM), siehe
  // Kommentar im Generator – eine bySize-Map dort wäre nur toter Ballast.
  for (const [id, views] of Object.entries(PRINT_AREA_DATA)) {
    for (const view of ['sleeve_left', 'sleeve_right'] as const) {
      const a = views[view];
      if (!a) continue;
      assert.equal(a.bySize, undefined, `${id}/${view}: Ärmelansicht mit bySize`);
    }
  }
});

test('bySize deckt jede Größe der Maßtabelle ab', () => {
  for (const p of PRODUCTS) {
    if (!p.sizeGuide) continue;
    for (const view of ['front', 'back'] as const) {
      const a = PRINT_AREA_DATA[p.id]?.[view];
      if (!a) continue;
      // Aliasierte Produkte ohne eigene Maßtabelle erben bySize der geliehenen
      // Tabelle (deckt dann deren, nicht zwingend die eigenen Größen ab) –
      // hier nur geprüft, wo tatsächlich eine bySize-Map vorhanden ist.
      if (!a.bySize) continue;
      for (const m of p.sizeGuide.measurements) {
        assert.ok(a.bySize[m.size], `${p.id}/${view}: Größe "${m.size}" fehlt in bySize`);
      }
    }
  }
});

test('bySize-Flächen respektieren dieselben Grenzen wie die Referenzgröße', () => {
  for (const [id, views] of Object.entries(PRINT_AREA_DATA)) {
    for (const [view, a] of Object.entries(views)) {
      if (!a!.bySize) continue;
      // bySize existiert ohnehin nur für front/back (siehe 'Ärmelansichten
      // führen nie größenabhängige Flächen' oben) – prozessgrenzeVon direkt
      // aus decorationPositions.ts statt einer lokalen Kopie.
      const g = prozessgrenzeVon(view);
      for (const [groesse, box] of Object.entries(a!.bySize)) {
        assert.ok(box.maxWidthCm > 0 && box.maxHeightCm > 0, `${id}/${view}/${groesse}: Maß <= 0`);
        assert.ok(box.maxWidthCm <= g.maxWidthCm + 0.05, `${id}/${view}/${groesse}: ${box.maxWidthCm} cm > Prozessgrenze ${g.maxWidthCm} cm`);
        assert.ok(box.maxHeightCm <= g.maxHeightCm + 0.05, `${id}/${view}/${groesse}: ${box.maxHeightCm} cm > Prozessgrenze ${g.maxHeightCm} cm`);
        assert.ok(box.x0 >= 0 && box.x1 <= 100, `${id}/${view}/${groesse}: x außerhalb (${box.x0}..${box.x1})`);
        assert.ok(box.y0 >= 0 && box.y1 <= 100, `${id}/${view}/${groesse}: y außerhalb (${box.y0}..${box.y1})`);
      }
    }
  }
});

test('größere Konfektionsgrößen bekommen nie eine schmalere oder niedrigere Fläche als kleinere', () => {
  // Kernversprechen der Funktion: XL darf S niemals unterschreiten – sonst
  // würde ein größeres Kleidungsstück ein kleineres Motiv erzwingen, obwohl
  // real mehr Stoff vorhanden ist.
  for (const [id, views] of Object.entries(PRINT_AREA_DATA)) {
    for (const [view, a] of Object.entries(views)) {
      if (!a!.bySize) continue;
      const groessen = Object.keys(a!.bySize).sort((x, y) => groessenRang(x) - groessenRang(y));
      let vorherigeBreite = -Infinity;
      let vorherigeHoehe = -Infinity;
      for (const g of groessen) {
        const box = a!.bySize[g]!;
        assert.ok(
          box.maxWidthCm >= vorherigeBreite - 0.05,
          `${id}/${view}: "${g}" (${box.maxWidthCm} cm) schmaler als die nächstkleinere Größe (${vorherigeBreite} cm)`
        );
        assert.ok(
          box.maxHeightCm >= vorherigeHoehe - 0.05,
          `${id}/${view}: "${g}" (${box.maxHeightCm} cm) niedriger als die nächstkleinere Größe (${vorherigeHoehe} cm)`
        );
        vorherigeBreite = box.maxWidthCm;
        vorherigeHoehe = box.maxHeightCm;
      }
    }
  }
});

test('flaecheFuerGroesse löst eine vorhandene Größe auf', async () => {
  const areas = await getPrintAreas('jamesnicholson-ladies-bio-workwear-t-shirt', 'dtf');
  const front = areas.find((a) => a.view === 'front');
  assert.ok(front?.bySize?.['XS'] && front.bySize['4XL']);
  const klein = flaecheFuerGroesse(front, 'XS');
  const gross = flaecheFuerGroesse(front, '4XL');
  assert.equal(klein.maxWidthCm, front.bySize['XS']!.maxWidthCm);
  assert.equal(gross.maxWidthCm, front.bySize['4XL']!.maxWidthCm);
  // Reales Beispiel mit sichtbarer Größenabhängigkeit (siehe Generator-Lauf):
  // die aufgelöste Fläche für 4XL muss spürbar breiter sein als für XS.
  assert.ok(gross.maxWidthCm > klein.maxWidthCm + 1, 'erwartet spürbar mehr Breite bei 4XL als bei XS');
});

test('flaecheFuerGroesse fällt ohne passenden Eintrag auf die Referenzgröße zurück', async () => {
  const areas = await getPrintAreas('gildan-heavy-t', 'dtf');
  const front = areas.find((a) => a.view === 'front');
  assert.ok(front);
  assert.deepEqual(flaecheFuerGroesse(front, undefined), front);
  assert.deepEqual(flaecheFuerGroesse(front, null), front);
  assert.deepEqual(flaecheFuerGroesse(front, 'gibt-es-nicht'), front);
  const sleeve = areas.find((a) => a.view === 'sleeve_left');
  assert.ok(sleeve && !sleeve.bySize);
  assert.deepEqual(flaecheFuerGroesse(sleeve, 'M'), sleeve);
});
