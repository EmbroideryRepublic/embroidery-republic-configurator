import type { ExclusionZone, PrintArea, PrintMethod, PrintView } from '@/types';
import { PRINT_AREA_DATA } from './printAreaData.generated';

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

// Echte Körperhöhe des Kleidungsstücks (Größe M, in cm) – von
// textil-grosshandel.eu übernommen (siehe REFERENCE_WIDTH_CM-Kommentar
// oben zu den zwei per Näherung befüllten Produkten).
const REFERENCE_HEIGHT_CM: Record<string, number> = {
  'fotl-heavy-t': 71,
  'fotl-ladies-valueweight-vneck': 64,
  'fotl-original-longsleeve': 69,
  'fotl-original-vneck': 69,
  'fotl-ladies-original-t': 64,
  'fotl-iconic195-longsleeve': 72,
  'fotl-pure-cotton-t': 71, // Näherung, siehe REFERENCE_WIDTH_CM-Kommentar
  'fotl-super-premium-t': 72,
  'fotl-valueweight-t': 72,
  'fotl-valueweight-vneck': 72,
  'fotl-iconic195-t': 72, // Näherung, siehe REFERENCE_WIDTH_CM-Kommentar
  'fotl-ladies-iconic195-t': 64,
  'fotl-original-t': 69,
  'fotl-ladies-valueweight-t': 64,
  'sols-imperial-t': 72, // SOL'S Imperial T-Shirt, Größe M, Länge (siehe Größentabelle)
  'gildan-heavy-t': 73.6, // Gildan Heavy Cotton (G5000), Größe M, Länge (siehe Größentabelle)
  'russell-authentic-t': 70, // Russell Authentic Tee Pure Organic (Z108M), Größe M, Länge (siehe Größentabelle)
  'gildan-softstyle-polo': 74, // Gildan Softstyle Double Piqué Polo (G64800), Größe M, Länge (siehe Größentabelle)
  'neutral-classic-polo': 71, // Neutral Men's Classic Polo (NE20080), Größe M, Länge (siehe Größentabelle)
  'justhoods-college-hoodie': 70, // Just Hoods College Hoodie (JH001), Größe M, Länge (siehe Größentabelle)
  'bandc-inspire-hoodie': 72, // B&C Inspire Hooded Sweat (BCWU33B), Größe M, Länge (siehe Größentabelle)
  'justhoods-zoodie': 70, // Just Hoods Zoodie (JH050), Größe M, Länge (siehe Größentabelle)
  'bandc-inspire-zip-hood': 72, // B&C Inspire Zipped Hood Jacket (BCWU35B), Größe M, Länge (siehe Größentabelle)
  'justhoods-awdis-sweat': 71, // Just Hoods AWDis Sweat (JH030), Größe M, Länge (siehe Größentabelle)
  'sols-north-fleece': 72, // SOL'S Fleecejacket North (L742), Größe M, Länge (siehe Größentabelle)
  'stedman-slimfit-t': 71, // Stedman Classic-T Fitted (S2010), Größe M, Länge (siehe Größentabelle)
  'jn-active-t': 74, // James+Nicholson Men's Active-T (JN358), Größe M, Länge (siehe Größentabelle)
  'jn-halfzip-sweat': 69, // James+Nicholson Workwear Half Zip Sweat (JN831), Größe M, Länge (siehe Größentabelle)
  'gildan-vneck-t': 74, // Gildan Softstyle V-Neck T-Shirt (G64V00), Größe M, Länge (siehe Größentabelle)
  'russell-workwear-t': 73, // Russell Workwear T-Shirt (Z010), Größe M, Länge (siehe Größentabelle)
  'neutral-rollsleeve-t': 71, // Neutral Men's Roll Up Sleeve T-Shirt (NE60012), Größe M, Länge (siehe Größentabelle)
  'justhoods-contrast-hoodie': 70, // Just Hoods Kontrast-Hoodie (JH003), Größe M, Länge (siehe Größentabelle)
  'justhoods-quarterzip-sweat': 70, // Just Hoods Sophomore 1/4 Zip Sweat (JH046), Größe M, Länge (siehe Größentabelle)
  'fotl-baseball-t': 71, // Fruit of the Loom Baseball T-Shirt (F295), Größe M, Länge (siehe Größentabelle)
  'fotl-premium-polo': 72, // Fruit of the Loom Premium Polo (F511N), Größe M, Länge (siehe Größentabelle)
  'fotl-baseball-longsleeve': 71, // Fruit of the Loom Baseball Longsleeve (F296), Größe M, Länge (siehe Größentabelle)
  'gildan-ladies-t': 66, // Gildan Softstyle Ladies T-Shirt (G64000L), Größe M, Länge (siehe Größentabelle)
  'fotl-ladies-premium-polo': 66, // FOTL Premium Polo Lady-Fit (F520), Größe M, Länge (Hersteller-Größentabelle, Näherung)
  'gildan-ladies-heavy-t': 66, // Gildan Heavy Cotton Ladies T-Shirt (GN182), Größe M, Länge (Hersteller-Größentabelle, Näherung)
  'gildan-ladies-vneck-t': 64, // Gildan Softstyle Ladies V-Neck (GN647), Größe M, Länge (Hersteller-Größentabelle, Näherung)
  'russell-ladies-authentic-t': 64, // Russell Ladies Authentic Tee Pure Organic (Z108F), Größe M, Länge (Näherung)
  'gildan-ladies-polo': 64, // Gildan Softstyle Ladies Double Piqué Polo (G64800L), Größe M, Länge (Näherung)
  'gildan-zip-hoodie': 71, // Gildan Heavy Blend Full-Zip Hoodie (GN960), Größe M, Länge (Näherung)
};
const DEFAULT_REFERENCE_HEIGHT_CM = 70;

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

/** Nahtabstand je Ansicht in cm – nur noch für die Anzeige/Preislogik,
 *  die Fläche selbst bringt den Abstand bereits abgezogen mit. */
const SEAM_MARGIN_CM: Record<PrintView, number> = {
  front: 2,
  back: 2,
  sleeve_left: 1.5,
  sleeve_right: 1.5,
};

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
function buildAreasForProduct(productId: string, method: PrintMethod): PrintArea[] {
  const views = PRINT_AREA_DATA[productId];
  if (!views) return [];
  const referenceHeightCm = REFERENCE_HEIGHT_CM[productId] ?? DEFAULT_REFERENCE_HEIGHT_CM;

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
    const movementWidthCm = a.boxWidthCm;

    const exclusionZones = EXCLUSION_ZONES[`${productId}-${view}`];
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
      seamMarginCm: SEAM_MARGIN_CM[view],
      referenceGarmentHeightCm: a.boxHeightCm,
      movementWidthCm,
      ...(a.startXCm !== undefined && a.startYCm !== undefined
        ? { startXCm: a.startXCm, startYCm: a.startYCm }
        : {}),
      ...(exclusionZones ? { exclusionZones } : {}),
    };
  });
}

const KNOWN_PRODUCT_IDS = Object.keys(PRINT_AREA_DATA);

const DTF_PRINT_AREAS: PrintArea[] = KNOWN_PRODUCT_IDS.flatMap((id) => buildAreasForProduct(id, 'dtf'));
const EMBROIDERY_PRINT_AREAS: PrintArea[] = KNOWN_PRODUCT_IDS.flatMap((id) => buildAreasForProduct(id, 'embroidery'));

/** Asynchrone Signatur bewusst beibehalten (alle Aufrufer erwarten ein
 *  Promise, und eine spätere echte DB-Anbindung bliebe damit ein reiner
 *  Implementierungstausch) – aber OHNE die frühere künstliche 150ms-
 *  Wartezeit: die bremste jeden Produkt-/Methoden-Wechsel im Konfigurator
 *  spürbar aus, ohne irgendetwas zu testen. */
export async function getPrintAreas(productId: string, printMethod: PrintMethod): Promise<PrintArea[]> {
  const source = printMethod === 'embroidery' ? EMBROIDERY_PRINT_AREAS : DTF_PRINT_AREAS;
  return source.filter((area) => area.productId === productId);
}
