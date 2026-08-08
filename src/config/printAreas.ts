import type { ExclusionZone, PrintArea, PrintMethod, PrintView } from '@/types';
import { PRINT_AREA_DATA, type GeneratedArea } from './printAreaData';
import { GEOMETRY_ALIAS } from './printAreaAlias.generated';
import { seamMarginCmVon } from './decorationPositions';

/**
 * Druck- und Stickflächen je Produkt und Ansicht.
 *
 * ── Hybrides Modell ───────────────────────────────────────────────────
 * Die BILDKONTUR bestimmt, wo im Foto das Kleidungsstück liegt (Position
 * und Ausdehnung in Prozent). Die verifizierten HERSTELLERMASSE bestimmen,
 * wie groß die Fläche real sein darf (maxWidthCm/maxHeightCm). Die
 * PROZESSGRENZEN der Veredelung deckeln beides.
 *
 * Damit erhalten unterschiedliche Schnitte automatisch unterschiedliche
 * Flächen, ohne Sonderregeln je Produkt: Ein Damenshirt bekommt eine
 * schmalere Fläche als ein Hoodie, weil seine Brustbreite kleiner ist –
 * nicht, weil irgendwo ein Sonderfall gepflegt wurde.
 *
 * Die Werte liegen in `printAreaData.generated.ts` und werden von
 * `scripts/generatePrintAreaData.mts` erzeugt. Herleitung, Quellenlage und
 * die geprüften Alternativen stehen in `docs/recherche-herstellermasse.md`.
 *
 * VORGÄNGER: fest verdrahtete Bounding-Boxen des gesamten Kleidungsstücks
 * mit pauschal 3 Prozentpunkten Abstand und einer für ALLE Produkte
 * identischen Maximalgröße (vorne 38×50 cm). Das ließ Motive bis in
 * Kragen- und Saumbereich zu und ignorierte den Schnitt vollständig.
 *
 * `getPrintAreas()` behält die asynchrone Signatur einer künftigen
 * Datenbankabfrage – der Konfigurator-Kern kennt nur `PrintArea[]`.
 */

// (Entfernt in M2.5, O10) Die frühere REFERENCE_HEIGHT_CM-Tabelle (~45
// kleidungs-anatomische Körperlängen) + DEFAULT_REFERENCE_HEIGHT_CM waren seit
// der Umstellung auf boxHeightCm toter Code: boxHeightCm kommt aus
// a.boxHeightCm (siehe unten). Die Herstellermaße leben im Geometrie-Generator
// (scripts/generatePrintAreaData.mts), nicht in dieser Laufzeitdatei.

// Sperrzonen für Hardware, auf der kein Motiv sitzen darf – so knapp wie
// möglich an das tatsächliche Hindernis gelegt, damit maximal viel
// bedruck-/bestickbare Fläche übrig bleibt. Prozentwerte relativ zum
// GESAMTEN Bild, Key = "productId-view".
//
// Koordinaten aus den echten Produktfotos abgelesen (Bildausschnitt-
// Kalibrierung am Anker-front.png je Produkt): Reißverschlüsse verlaufen
// mittig über dem Kleidungsstück-Zentrum, Polo-Knopfleisten sitzen
// unterhalb des Kragens. Die Zonen werden im Canvas rot schraffiert
// dargestellt; Elemente können weder hineingezogen noch hineingesetzt
// werden (Drag-Clamp + Auto-Wegschieben, siehe ConfiguratorCanvas +
// lib/canvas/bounds.ts).
const EXCLUSION_ZONES: Record<string, ExclusionZone[]> = {
  // ── Poloshirts: Knopfleiste unterhalb des Kragens ────────────────────
  'gildan-softstyle-polo-front': [
    { xPercent: 45.5, yPercent: 13.5, widthPercent: 7, heightPercent: 18, label: 'Knopfleiste' },
  ],
  'neutral-classic-polo-front': [
    { xPercent: 45.5, yPercent: 13, widthPercent: 7, heightPercent: 20, label: 'Knopfleiste' },
  ],
  'fotl-premium-polo-front': [
    { xPercent: 45.5, yPercent: 13, widthPercent: 7, heightPercent: 23, label: 'Knopfleiste' },
  ],
  // Lady-Fit: kürzere 2-Knopf-Leiste, per Bildausschnitt kalibriert
  // (Leiste x 48-52%, y 19-34% des Gesamtbilds).
  'fotl-ladies-premium-polo-front': [
    { xPercent: 46.5, yPercent: 18.5, widthPercent: 7, heightPercent: 16, label: 'Knopfleiste' },
  ],
  // Damen-Softstyle-Polo: 3-Knopf-Leiste, per Bildausschnitt kalibriert
  // (Leiste x 48-52%, y 21-37% des Gesamtbilds).
  'gildan-ladies-polo-front': [
    { xPercent: 46.5, yPercent: 20.5, widthPercent: 7, heightPercent: 17, label: 'Knopfleiste' },
  ],
  // Gildan Full-Zip: durchgehender Reißverschluss, per Bildausschnitt
  // kalibriert (Zip mittig, ab Kragenansatz bis Saum).
  'gildan-zip-hoodie-front': [
    { xPercent: 47, yPercent: 20.5, widthPercent: 6, heightPercent: 72.5, label: 'Reißverschluss' },
  ],

  // ── Voll-Reißverschluss (Zip-Hoodies/Jacken): Mittelstreifen bis Saum ─
  'justhoods-zoodie-front': [
    { xPercent: 47, yPercent: 21, widthPercent: 6, heightPercent: 72, label: 'Reißverschluss' },
  ],
  'bandc-inspire-zip-hood-front': [
    { xPercent: 46.9, yPercent: 20, widthPercent: 6, heightPercent: 73, label: 'Reißverschluss' },
  ],
  'sols-north-fleece-front': [
    { xPercent: 47, yPercent: 9, widthPercent: 6, heightPercent: 84, label: 'Reißverschluss' },
    { xPercent: 26.5, yPercent: 55, widthPercent: 6.5, heightPercent: 26, label: 'Tasche' },
    { xPercent: 67, yPercent: 55, widthPercent: 6.5, heightPercent: 26, label: 'Tasche' },
  ],

  // ── Halber/Viertel-Reißverschluss: nur der obere Kragenbereich ───────
  'jn-halfzip-sweat-front': [
    { xPercent: 46.9, yPercent: 8, widthPercent: 6, heightPercent: 27, label: 'Reißverschluss' },
  ],
  'justhoods-quarterzip-sweat-front': [
    { xPercent: 47, yPercent: 11, widthPercent: 6, heightPercent: 25, label: 'Reißverschluss' },
  ],
};

// Nahtabstand je Ansicht kommt jetzt zentral aus der View-Registry
// (decorationPositions.ts, seamMarginCmVon) statt aus einer lokalen
// 4-Schlüssel-Tabelle – eine Quelle der Wahrheit, mit Default für neue Views.

/**
 * Baut die Flächen eines Produkts aus den ERZEUGTEN Daten.
 *
 * Position (x/y/Breite/Höhe in Prozent) stammt aus der Bildkontur, die
 * realen Maße (maxWidthCm/maxHeightCm) aus der verifizierten
 * Herstellertabelle, gedeckelt durch die Prozessgrenzen der Veredelung.
 * Siehe scripts/generatePrintAreaData.mts und
 * docs/recherche-herstellermasse.md.
 *
 * DTF und Stickerei erhalten dieselbe Fläche – der Mehraufwand der
 * Stickerei steckt im €/cm²-Satz (pricingRules), nicht in einer künstlich
 * kleineren Fläche. Bestehende Festlegung, unverändert übernommen.
 */
/** Übersetzt die je-Größe-Flächen des Generators (x0/x1/y0/y1, Prozent der
 *  Bildkante) ins Laufzeitformat (xPercent/widthPercent) – dieselbe
 *  x1-x0→widthPercent-Umrechnung wie für die Referenzgröße unten. `undefined`
 *  bei Ärmelansichten und Produkten ohne eigene Maßtabelle (der Generator
 *  lässt bySize dort ganz weg). */
function uebersetzeBySize(
  bySize: GeneratedArea['bySize']
): PrintArea['bySize'] {
  if (!bySize) return undefined;
  const uebersetzt: NonNullable<PrintArea['bySize']> = {};
  for (const [groesse, g] of Object.entries(bySize)) {
    uebersetzt[groesse] = {
      xPercent: g.x0,
      yPercent: g.y0,
      widthPercent: g.x1 - g.x0,
      heightPercent: g.y1 - g.y0,
      maxWidthCm: g.maxWidthCm,
      maxHeightCm: g.maxHeightCm,
      boxWidthCm: g.boxWidthCm,
      boxHeightCm: g.boxHeightCm,
    };
  }
  return uebersetzt;
}

function buildAreasForProduct(productId: string, method: PrintMethod): PrintArea[] {
  // Klassen-Übernahme: Hat das Produkt keine eigene gemessene Geometrie, aber
  // einen Alias auf ein Bestandsprodukt gleicher Klasse (printAreaAlias.
  // generated.ts), wird dessen Fläche 1:1 übernommen. Die erzeugten Flächen
  // tragen weiterhin die EIGENE productId, damit getPrintAreas() sie findet.
  // PRINT_AREA_DATA ist bereits alias-aufgelöst (printAreaData.ts). Für die
  // Exclusion-Zonen (nur hier gepflegt) wird zusätzlich auf die Quelle des
  // Klassen-Alias verwiesen, damit aliasierte Produkte deren Hardware-Sperren
  // (Reißverschluss, Knopfleiste …) miterben.
  const views = PRINT_AREA_DATA[productId];
  if (!views) return [];
  const exclId = GEOMETRY_ALIAS[productId] ?? productId;

  return (Object.keys(views) as PrintView[]).map((view) => {
    const a = views[view]!;
    const widthPercent = a.x1 - a.x0;
    const heightPercent = a.y1 - a.y0;

    // Bezug für die Pixel↔Zentimeter-Umrechnung ist die WAHRE Ausdehnung der
    // gezeichneten Box (boxWidthCm/boxHeightCm aus dem Generator).
    //
    // VORGÄNGER: hier stand die KÖRPERLÄNGE des Kleidungsstücks (z.B. 72 cm),
    // obwohl die Box nur den bedruckbaren Bereich zeigt (z.B. 47 cm). Im
    // laufenden Canvas nachgemessen: Box 457,7 px hoch, das Standardlogo mit
    // 13,95 cm wurde 89 px breit gezeichnet – 6,38 px/cm statt der korrekten
    // 9,74. Jedes Motiv erschien dadurch mit 65 % seiner angegebenen Größe;
    // der Druck wäre 1,53-fach größer ausgefallen als in der Vorschau. Das
    // Lineal am Canvas beschriftete dieselbe Box korrekt mit maxHeightCm –
    // Anzeige und Umrechnung widersprachen sich also.
    const boxWidthCm = a.boxWidthCm;

    const exclusionZones = EXCLUSION_ZONES[`${exclId}-${view}`];
    return {
      id: `${productId}-${method}-${view}`,
      productId,
      view,
      xPercent: a.x0,
      yPercent: a.y0,
      widthPercent,
      heightPercent,
      maxWidthCm: a.maxWidthCm,
      maxHeightCm: a.maxHeightCm,
      seamMarginCm: seamMarginCmVon(view),
      boxHeightCm: a.boxHeightCm,
      boxWidthCm,
      ...(a.startXCm !== undefined && a.startYCm !== undefined
        ? { startXCm: a.startXCm, startYCm: a.startYCm }
        : {}),
      ...(exclusionZones ? { exclusionZones } : {}),
      ...(a.bySize ? { bySize: uebersetzeBySize(a.bySize) } : {}),
    };
  });
}

const KNOWN_PRODUCT_IDS = Object.keys(PRINT_AREA_DATA);

const DTF_PRINT_AREAS: PrintArea[] = KNOWN_PRODUCT_IDS.flatMap((id) => buildAreasForProduct(id, 'dtf'));
const EMBROIDERY_PRINT_AREAS: PrintArea[] = KNOWN_PRODUCT_IDS.flatMap((id) => buildAreasForProduct(id, 'embroidery'));

// O(1)-Index je Methode statt linearem source.filter je Produkt-/Methodenwechsel.
function indexByProduct(areas: PrintArea[]): Map<string, PrintArea[]> {
  const map = new Map<string, PrintArea[]>();
  for (const area of areas) {
    const list = map.get(area.productId);
    if (list) list.push(area);
    else map.set(area.productId, [area]);
  }
  return map;
}
const DTF_BY_PRODUCT = indexByProduct(DTF_PRINT_AREAS);
const EMBROIDERY_BY_PRODUCT = indexByProduct(EMBROIDERY_PRINT_AREAS);

/** Asynchrone Signatur bewusst beibehalten (alle Aufrufer erwarten ein
 *  Promise, und eine spätere echte DB-Anbindung bliebe damit ein reiner
 *  Implementierungstausch) – aber OHNE die frühere künstliche 150ms-
 *  Wartezeit: die bremste jeden Produkt-/Methoden-Wechsel im Konfigurator
 *  spürbar aus, ohne irgendetwas zu testen. */
export async function getPrintAreas(productId: string, printMethod: PrintMethod): Promise<PrintArea[]> {
  const map = printMethod === 'embroidery' ? EMBROIDERY_BY_PRODUCT : DTF_BY_PRODUCT;
  return map.get(productId) ?? [];
}

/**
 * Löst die für eine KONKRETE Größe geltende Fläche auf – die einzige Stelle,
 * die `bySize` liest. Ohne passenden Eintrag (Ärmelansicht, keine Größe
 * übergeben, Produkt ohne eigene Maßtabelle) gelten unverändert die
 * Referenzgrößen-Felder von `area` selbst – das bisherige, größenunabhängige
 * Verhalten bleibt damit der sichere Rückfall.
 *
 * Aufrufer bestimmen die GELTENDE Größe selbst (siehe
 * `kleinsteBestellteGroesse` in config/products/groessen.ts) – diese Funktion
 * kennt nur „Fläche zu Größe X", nicht die Regel, welche Größe gilt.
 */
export function flaecheFuerGroesse(area: PrintArea, groesse: string | null | undefined): PrintArea {
  const variante = groesse ? area.bySize?.[groesse] : undefined;
  if (!variante) return area;
  return {
    ...area,
    xPercent: variante.xPercent,
    yPercent: variante.yPercent,
    widthPercent: variante.widthPercent,
    heightPercent: variante.heightPercent,
    maxWidthCm: variante.maxWidthCm,
    maxHeightCm: variante.maxHeightCm,
    boxWidthCm: variante.boxWidthCm,
    boxHeightCm: variante.boxHeightCm,
  };
}
