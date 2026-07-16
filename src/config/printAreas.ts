import type { PrintArea, PrintMethod, PrintView } from '@/types';

/**
 * MOCK-Datenquelle für Druckbereiche.
 *
 * NEU: Statt fester, von Hand geschätzter Rechtecke (nur Brustbereich)
 * folgt der Druckbereich jetzt der TATSÄCHLICH VERMESSENEN Fläche des
 * Kleidungsstücks in jedem Bild (automatisch per Farbschwellenwert-Analyse
 * ermittelt, siehe Kommentare unten je Produkt). Das Ergebnis: ein Logo
 * lässt sich überall auf dem Kleidungsstück platzieren, aber nie auf der
 * weißen Fläche außerhalb davon – die "Leinwand" des Druckbereichs IST
 * jetzt die Kleidungsstück-Fläche selbst (mit kleinem Sicherheitsabstand
 * zum Rand), nicht mehr eine kleine Brust-Box.
 *
 * DTF vs. Stickerei: die POSITION/FREIHEIT ist identisch (beides überall
 * auf dem Kleidungsstück möglich) – nur die maximale Motivgröße
 * unterscheidet sich (DTF kann großflächig sein, Stickerei bleibt auf
 * logogroße Motive begrenzt, da echte Stickmaschinen-Rahmen das technisch
 * limitieren).
 *
 * `getPrintAreas()` hat weiterhin die Signatur einer künftigen
 * Supabase-Abfrage. Der Konfigurator-Kern kennt nur `PrintArea[]`, nicht
 * diese Mock-Daten.
 */
type AreaTemplate = Omit<PrintArea, 'id' | 'productId'>;

/** Vermessene Kleidungsstück-Fläche je Bild (x0,y0,x1,y1 in % des Bildes),
 *  mit 3% Sicherheitsabstand nach innen bereits abgezogen. */
interface MeasuredBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const INSET = 3; // Sicherheitsabstand zum Rand/zur Naht, in Prozentpunkten

// Echte Breite des Kleidungsstücks (Größe M, in cm, "flach gemessen") für
// Vorder-/Rückseite – aus dem Größenleitfaden (sizeGuide) übernommen, wo
// vorhanden. Ärmel nutzen bewusst einen eigenen, deutlich schmaleren Wert
// (Achsel bis Handgelenk-Bereich lässt sich schlecht mit der
// Vorderseiten-Breite vergleichen).
const REFERENCE_WIDTH_CM: Record<string, { body: number; sleeve: number }> = {
  'polo2-test': { body: 52.5, sleeve: 20 }, // echte Lieferantendaten (Größe M, Breite)
};
const DEFAULT_REFERENCE_WIDTH_RATIO = 0.72; // Breite ≈ 72% der Höhe, plausibler Kleidungsstück-Durchschnitt

function toTemplate(
  view: PrintView,
  box: MeasuredBox,
  maxWidthCm: number,
  maxHeightCm: number,
  seamMarginCm: number,
  referenceGarmentHeightCm: number,
  productId: string
): AreaTemplate {
  const widthPercent = box.x1 - box.x0 - INSET * 2;
  const heightPercent = box.y1 - box.y0 - INSET * 2;

  // Echte Breite bevorzugen, wenn vorhanden (siehe REFERENCE_WIDTH_CM) –
  // deutlich zuverlässiger als eine Ableitung aus dem Foto-
  // Seitenverhältnis, da Fotos unterschiedlich eng zugeschnitten sein
  // können (z.B. ein Ärmel-Foto ist viel schmaler zugeschnitten als ein
  // Vorderseiten-Foto, auch wenn beide denselben Höhen-Prozentwert zeigen).
  const isSleeve = view === 'sleeve_left' || view === 'sleeve_right';
  const knownWidth = REFERENCE_WIDTH_CM[productId];
  const movementWidthCm = knownWidth
    ? isSleeve
      ? knownWidth.sleeve
      : knownWidth.body
    : referenceGarmentHeightCm * (isSleeve ? 0.28 : DEFAULT_REFERENCE_WIDTH_RATIO);

  return {
    view,
    xPercent: box.x0 + INSET,
    yPercent: box.y0 + INSET,
    widthPercent,
    heightPercent,
    maxWidthCm,
    maxHeightCm,
    seamMarginCm,
    referenceGarmentHeightCm,
    movementWidthCm,
  };
}

// Automatisch vermessene Kleidungsstück-Flächen je Produkt/Ansicht
// (Farbschwellenwert-Analyse der tatsächlichen Bilddateien).
const MEASURED: Record<string, Record<PrintView, MeasuredBox>> = {
  'hoodie-test': {
    front: { x0: 13, y0: 8, x1: 87, y1: 99 },
    back: { x0: 13, y0: 8, x1: 87, y1: 99 },
    sleeve_left: { x0: 20, y0: 10, x1: 80, y1: 95 },
    sleeve_right: { x0: 20, y0: 10, x1: 80, y1: 95 },
  },
  'softshell-test': {
    front: { x0: 0, y0: 1, x1: 99, y1: 98 },
    back: { x0: 2, y0: 2, x1: 97, y1: 94 },
    sleeve_left: { x0: 7, y0: 5, x1: 87, y1: 96 },
    sleeve_right: { x0: 9, y0: 6, x1: 87, y1: 99 },
  },
  'fleece-test': {
    front: { x0: 1, y0: 4, x1: 100, y1: 93 },
    back: { x0: 0, y0: 4, x1: 99, y1: 90 },
    sleeve_left: { x0: 2, y0: 4, x1: 98, y1: 95 },
    sleeve_right: { x0: 2, y0: 4, x1: 98, y1: 95 },
  },
  'polo2-test': {
    front: { x0: 0, y0: 14, x1: 100, y1: 81 },
    back: { x0: 0, y0: 14, x1: 100, y1: 81 },
    sleeve_left: { x0: 0, y0: 14, x1: 100, y1: 81 },
    sleeve_right: { x0: 0, y0: 14, x1: 100, y1: 81 },
  },
  'polopremium-test': {
    front: { x0: 0, y0: 11, x1: 100, y1: 84 },
    back: { x0: 0, y0: 11, x1: 100, y1: 84 },
    sleeve_left: { x0: 0, y0: 11, x1: 100, y1: 85 },
    sleeve_right: { x0: 0, y0: 10, x1: 100, y1: 85 },
  },
  'bodywarmer-test': {
    front: { x0: 0, y0: 13, x1: 100, y1: 83 },
    back: { x0: 0, y0: 13, x1: 100, y1: 83 },
    sleeve_left: { x0: 0, y0: 13, x1: 100, y1: 83 },
    sleeve_right: { x0: 0, y0: 13, x1: 100, y1: 83 },
  },
  'softshellhood-test': {
    front: { x0: 0, y0: 13, x1: 100, y1: 83 },
    back: { x0: 0, y0: 13, x1: 100, y1: 83 },
    sleeve_left: { x0: 0, y0: 14, x1: 100, y1: 85 },
    sleeve_right: { x0: 0, y0: 14, x1: 100, y1: 85 },
  },
  'softshell2-test': {
    front: { x0: 0, y0: 14, x1: 100, y1: 80 },
    back: { x0: 0, y0: 13, x1: 100, y1: 79 },
    sleeve_left: { x0: 0, y0: 13, x1: 100, y1: 82 },
    sleeve_right: { x0: 0, y0: 13, x1: 100, y1: 82 },
  },
  'ziphoodie-test': {
    front: { x0: 0, y0: 14, x1: 100, y1: 79 },
    back: { x0: 0, y0: 14, x1: 100, y1: 79 },
    sleeve_left: { x0: 0, y0: 14, x1: 100, y1: 81 },
    sleeve_right: { x0: 0, y0: 14, x1: 100, y1: 81 },
  },
  'sweatshirt2-test': {
    front: { x0: 0, y0: 16, x1: 100, y1: 78 },
    back: { x0: 0, y0: 16, x1: 100, y1: 79 },
    sleeve_left: { x0: 0, y0: 16, x1: 100, y1: 81 },
    sleeve_right: { x0: 0, y0: 16, x1: 100, y1: 81 },
  },
  'tshirt2-test': {
    front: { x0: 0, y0: 14, x1: 100, y1: 82 },
    back: { x0: 0, y0: 14, x1: 100, y1: 82 },
    sleeve_left: { x0: 0, y0: 14, x1: 100, y1: 82 },
    sleeve_right: { x0: 0, y0: 14, x1: 100, y1: 82 },
  },
  'hoodie2-test': {
    front: { x0: 0, y0: 11, x1: 100, y1: 80 },
    back: { x0: 0, y0: 11, x1: 100, y1: 79 },
    sleeve_left: { x0: 0, y0: 11, x1: 100, y1: 82 },
    sleeve_right: { x0: 0, y0: 11, x1: 100, y1: 82 },
  },
};

// Realistische maximale Motivgröße je Ansicht und Veredelungsart. DTF darf
// großflächig sein (bis zu Brust-/Rückenbreite), Stickerei bleibt technisch
// auf logogroße Motive begrenzt – beide dürfen aber überall im gemessenen
// Kleidungsstück-Bereich positioniert werden (gleiche xPercent/yPercent/
// widthPercent/heightPercent, siehe buildAreasForProduct).
const DTF_MAX_SIZE: Record<PrintView, { w: number; h: number; seam: number }> = {
  front: { w: 38, h: 50, seam: 1.5 },
  back: { w: 42, h: 55, seam: 2 },
  sleeve_left: { w: 12, h: 40, seam: 1 },
  sleeve_right: { w: 12, h: 40, seam: 1 },
};

// Stickerei nutzt bewusst dieselben Maximalgrößen wie DTF (auf
// ausdrücklichen Wunsch) – der höhere Aufwand/Preis der Stickerei wird
// stattdessen ausschließlich über den höheren €/cm²-Satz in den
// Preisregeln abgebildet (siehe pricingRules.ts), nicht über eine
// künstlich kleinere Fläche.
const EMBROIDERY_MAX_SIZE: Record<PrintView, { w: number; h: number; seam: number }> = DTF_MAX_SIZE;

// Echte Körperhöhe des Kleidungsstücks (Größe M, in cm) – Grundlage für
// die Pixel-zu-cm-Umrechnung. "polo2-test" nutzt echte Lieferantendaten
// (siehe sizeGuide in products.ts). Alle anderen Produkte haben noch
// keine echten Maße vom Hersteller -> plausible Schätzwerte je
// Produkttyp, werden ersetzt sobald echte Daten vorliegen (wie beim
// Poloshirt: einfach den Wert hier anpassen).
const REFERENCE_HEIGHT_CM: Record<string, number> = {
  'polo2-test': 72, // echte Lieferantendaten (Größe M)
  'polopremium-test': 72,
  'tshirt2-test': 74,
  'hoodie2-test': 72,
  'hoodie-test': 72,
  'sweatshirt2-test': 70,
  'ziphoodie-test': 74,
  'softshell2-test': 68,
  'softshellhood-test': 70,
  'softshell-test': 68,
  'fleece-test': 68,
  'bodywarmer-test': 66,
};
const DEFAULT_REFERENCE_HEIGHT_CM = 70;

// Sperrzonen für Hardware in der Mitte des Kleidungsstücks (Knopfleiste,
// Reißverschluss) – kein Motiv darf darauf platziert werden. Prozentwerte
// relativ zum GESAMTEN Bild, Key = "productId-view".
const EXCLUSION_ZONES: Record<string, { xPercent: number; yPercent: number; widthPercent: number; heightPercent: number; label: string }[]> = {
  // Knopfleiste – etwas länger als zuvor (reichte vorher nicht bis zum
  // letzten Knopf).
  'polo2-test-front': [
    { xPercent: 45, yPercent: 14, widthPercent: 10, heightPercent: 21, label: 'Knopfleiste' },
  ],
  'polopremium-test-front': [
    { xPercent: 45, yPercent: 11, widthPercent: 10, heightPercent: 22, label: 'Knopfleiste' },
  ],
  // Reißverschluss – volle Höhe des Druckbereichs, mittig. Betrifft alle
  // Produkte mit durchgehendem Zipper, nicht nur den namentlichen
  // "Zip-Hoodie": Softshelljacken und Bodywarmer haben ihn genauso.
  'ziphoodie-test-front': [{ xPercent: 46, yPercent: 14, widthPercent: 8, heightPercent: 65, label: 'Reißverschluss' }],
  'softshell-test-front': [{ xPercent: 46, yPercent: 1, widthPercent: 8, heightPercent: 97, label: 'Reißverschluss' }],
  'softshell2-test-front': [{ xPercent: 46, yPercent: 14, widthPercent: 8, heightPercent: 66, label: 'Reißverschluss' }],
  'softshellhood-test-front': [{ xPercent: 46, yPercent: 13, widthPercent: 8, heightPercent: 70, label: 'Reißverschluss' }],
  'bodywarmer-test-front': [{ xPercent: 46, yPercent: 13, widthPercent: 8, heightPercent: 70, label: 'Reißverschluss' }],
};

function buildAreasForProduct(productId: string, method: PrintMethod): PrintArea[] {
  const boxes = MEASURED[productId];
  if (!boxes) return [];
  const sizes = method === 'embroidery' ? EMBROIDERY_MAX_SIZE : DTF_MAX_SIZE;
  const referenceHeightCm = REFERENCE_HEIGHT_CM[productId] ?? DEFAULT_REFERENCE_HEIGHT_CM;

  return (Object.keys(boxes) as PrintView[]).map((view) => {
    const template = toTemplate(view, boxes[view], sizes[view].w, sizes[view].h, sizes[view].seam, referenceHeightCm, productId);
    const exclusionZones = EXCLUSION_ZONES[`${productId}-${view}`];
    return { id: `${productId}-${method}-${view}`, productId, ...template, ...(exclusionZones ? { exclusionZones } : {}) };
  });
}

const KNOWN_PRODUCT_IDS = Object.keys(MEASURED);

const DTF_PRINT_AREAS: PrintArea[] = KNOWN_PRODUCT_IDS.flatMap((id) => buildAreasForProduct(id, 'dtf'));
const EMBROIDERY_PRINT_AREAS: PrintArea[] = KNOWN_PRODUCT_IDS.flatMap((id) => buildAreasForProduct(id, 'embroidery'));

/** Simuliert asynchronen Abruf (Netzwerklatenz) wie bei einer echten DB-Anfrage. */
export async function getPrintAreas(productId: string, printMethod: PrintMethod): Promise<PrintArea[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const source = printMethod === 'embroidery' ? EMBROIDERY_PRINT_AREAS : DTF_PRINT_AREAS;
  return source.filter((area) => area.productId === productId);
}
