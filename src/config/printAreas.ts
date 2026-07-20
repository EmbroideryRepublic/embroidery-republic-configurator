import type { ExclusionZone, PrintArea, PrintMethod, PrintView } from '@/types';

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
  /** Natürliche Pixel-Maße der vermessenen Bilddatei (aus scripts/measureAllFotlBounds.mjs).
   *  Nötig, weil die Fotos NICHT quadratisch sind (z.B. 667×732) – ohne das
   *  echte Seitenverhältnis würde movementWidthCm systematisch falsch
   *  berechnet (siehe Kommentar in toTemplate). */
  imgW: number;
  imgH: number;
}

const INSET = 3; // Sicherheitsabstand zum Rand/zur Naht, in Prozentpunkten

function toTemplate(
  view: PrintView,
  box: MeasuredBox,
  maxWidthCm: number,
  maxHeightCm: number,
  seamMarginCm: number,
  referenceGarmentHeightCm: number
): AreaTemplate {
  const widthPercent = box.x1 - box.x0 - INSET * 2;
  const heightPercent = box.y1 - box.y0 - INSET * 2;

  // WICHTIG: movementWidthCm (die reale Breite des Druckbereichs in cm,
  // Grundlage für "Mittig"-Zentrierung und Ärmel-Bewegungsspielraum) MUSS
  // aus dem Seitenverhältnis derselben vermessenen Box abgeleitet werden,
  // NICHT aus einer unabhängigen Lieferanten-Breitenangabe (z.B. "Brust,
  // flach gemessen") – die beschreibt den Torso ohne Ärmel, während die
  // vermessene Box bei Vorder-/Rückseite auch die seitlich abstehenden
  // Ärmel einschließt. Zwei unabhängig ermittelte Breiten führen dazu,
  // dass "Mittig" spürbar neben der Bildmitte landet, obwohl die Formel
  // selbst korrekt rechnet (beobachtet bei fotl-original-vneck: Box-Breite
  // ~66,5cm vs. Lieferanten-"Breite" 51cm → Element landete ca. 11% der
  // Druckbereich-Breite links der echten Mitte).
  //
  // Zusätzlich MUSS das echte Seitenverhältnis der Bilddatei (imgW/imgH)
  // einfließen, nicht nur widthPercent/heightPercent – die Fotos sind NICHT
  // quadratisch (z.B. 667×732px). cmConversion.ts leitet einen EINZIGEN
  // isotropen Pixel-pro-cm-Faktor nur aus der Höhe ab (pxPerCm =
  // areaPx.height / referenceGarmentHeightCm) und wendet ihn auch auf X an.
  // Damit movementWidthCm * pxPerCm exakt areaPx.width ergibt (= die
  // Bedingung für pixelgenaues "Mittig"), muss die reale Bild-Breite/Höhe
  // mit einbezogen werden – sonst wird bei nicht-quadratischen Fotos ein
  // systematischer Fehler proportional zum Seitenverhältnis eingeführt
  // (beobachtet: ohne imgW/imgH-Korrektur blieb bei fotl-original-vneck
  // trotz Seitenverhältnis-Ableitung noch ein Rest-Versatz von ~5% der
  // Druckbereich-Breite). Diese Ableitung ist damit garantiert exakt,
  // unabhängig vom Bildformat.
  const movementWidthCm =
    referenceGarmentHeightCm * (widthPercent / heightPercent) * (box.imgW / box.imgH);

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
  // Fruit of the Loom: Boxen automatisch per Farbschwellenwert-Analyse aus
  // dem Anker-Farbfoto jedes Produkts vermessen (siehe
  // scripts/measureAllFotlBounds.mjs) – kein geschätzter Platzhalter mehr.
  'fotl-heavy-t': {
    front: { x0: 26.5, y0: 4.1, x1: 72.9, y1: 92, imgW: 668, imgH: 726 },
    back: { x0: 27.9, y0: 4.4, x1: 73.3, y1: 94.1, imgW: 661, imgH: 711 },
    sleeve_left: { x0: 30.8, y0: 3.3, x1: 66.7, y1: 90.8, imgW: 663, imgH: 729 },
    sleeve_right: { x0: 33.2, y0: 3.3, x1: 69.1, y1: 90.8, imgW: 663, imgH: 729 },
  },
  'fotl-ladies-valueweight-vneck': {
    front: { x0: 20.9, y0: 2.9, x1: 75.2, y1: 95.2, imgW: 602, imgH: 691 },
    back: { x0: 26.6, y0: 7.2, x1: 71.2, y1: 93.9, imgW: 681, imgH: 736 },
    sleeve_left: { x0: 29.2, y0: 4.8, x1: 66, y1: 91.6, imgW: 641, imgH: 735 },
    sleeve_right: { x0: 33.9, y0: 4.8, x1: 70.7, y1: 91.6, imgW: 641, imgH: 735 },
  },
  'fotl-original-longsleeve': {
    front: { x0: 27.6, y0: 6.4, x1: 70.3, y1: 94.6, imgW: 668, imgH: 723 },
    back: { x0: 29.1, y0: 6.6, x1: 72.3, y1: 92.7, imgW: 654, imgH: 741 },
    sleeve_left: { x0: 34.9, y0: 5.9, x1: 67.1, y1: 91.8, imgW: 677, imgH: 743 },
    sleeve_right: { x0: 32.8, y0: 5.9, x1: 65, y1: 91.8, imgW: 677, imgH: 743 },
  },
  'fotl-original-vneck': {
    front: { x0: 28.7, y0: 5.3, x1: 73.1, y1: 92.5, imgW: 667, imgH: 732 },
    back: { x0: 27.2, y0: 0.9, x1: 71.6, y1: 92.7, imgW: 655, imgH: 737 },
    sleeve_left: { x0: 29.7, y0: 6.7, x1: 69.6, y1: 88.5, imgW: 569, imgH: 780 },
    sleeve_right: { x0: 30.2, y0: 6.7, x1: 70.1, y1: 88.5, imgW: 569, imgH: 780 },
  },
  'fotl-ladies-original-t': {
    front: { x0: 24.2, y0: 3.8, x1: 75.1, y1: 96.9, imgW: 632, imgH: 685 },
    back: { x0: 23.1, y0: 2.7, x1: 73.2, y1: 93.8, imgW: 624, imgH: 698 },
    sleeve_left: { x0: 8, y0: 4.2, x1: 66.5, y1: 93.2, imgW: 650, imgH: 717 },
    sleeve_right: { x0: 33.4, y0: 4.2, x1: 91.8, y1: 93.2, imgW: 650, imgH: 717 },
  },
  'fotl-iconic195-longsleeve': {
    front: { x0: 29.5, y0: 5.4, x1: 69.9, y1: 95.2, imgW: 662, imgH: 682 },
    back: { x0: 27.1, y0: 3, x1: 67.4, y1: 94.6, imgW: 595, imgH: 669 },
    sleeve_left: { x0: 26.8, y0: 4.8, x1: 60.6, y1: 93.6, imgW: 616, imgH: 689 },
    sleeve_right: { x0: 39.3, y0: 4.8, x1: 73.1, y1: 93.6, imgW: 616, imgH: 689 },
  },
  'fotl-pure-cotton-t': {
    front: { x0: 26.3, y0: 11.3, x1: 71.3, y1: 91.9, imgW: 632, imgH: 816 },
    back: { x0: 27.7, y0: 8.6, x1: 69.4, y1: 92.5, imgW: 644, imgH: 787 },
    sleeve_left: { x0: 32.9, y0: 9.9, x1: 68.1, y1: 92.4, imgW: 608, imgH: 798 },
    sleeve_right: { x0: 31.7, y0: 9.9, x1: 66.9, y1: 92.4, imgW: 608, imgH: 798 },
  },
  'fotl-super-premium-t': {
    front: { x0: 26.6, y0: 7.1, x1: 73.2, y1: 95.4, imgW: 632, imgH: 722 },
    back: { x0: 29.3, y0: 5.9, x1: 74.5, y1: 96.2, imgW: 653, imgH: 707 },
    sleeve_left: { x0: 8.2, y0: 3.8, x1: 65.6, y1: 94.1, imgW: 620, imgH: 707 },
    sleeve_right: { x0: 34.2, y0: 3.8, x1: 91.6, y1: 94.1, imgW: 620, imgH: 707 },
  },
  'fotl-valueweight-t': {
    front: { x0: 23.8, y0: 9.3, x1: 72.6, y1: 96.3, imgW: 613, imgH: 733 },
    back: { x0: 24.4, y0: 12.4, x1: 73, y1: 95, imgW: 589, imgH: 773 },
    sleeve_left: { x0: 29.4, y0: 6.3, x1: 72.4, y1: 90.7, imgW: 497, imgH: 756 },
    sleeve_right: { x0: 27.4, y0: 6.3, x1: 70.4, y1: 90.7, imgW: 497, imgH: 756 },
  },
  'fotl-valueweight-vneck': {
    front: { x0: 27.2, y0: 3.6, x1: 75.6, y1: 93.1, imgW: 645, imgH: 713 },
    back: { x0: 27.8, y0: 4.5, x1: 74.1, y1: 96.1, imgW: 627, imgH: 696 },
    sleeve_left: { x0: 35.9, y0: 4.6, x1: 68.3, y1: 91.2, imgW: 660, imgH: 737 },
    sleeve_right: { x0: 31.5, y0: 4.6, x1: 63.9, y1: 91.2, imgW: 660, imgH: 737 },
  },
  'fotl-iconic195-t': {
    front: { x0: 31.3, y0: 2.8, x1: 71.7, y1: 93.2, imgW: 669, imgH: 679 },
    back: { x0: 33.1, y0: 5.4, x1: 70.1, y1: 97.2, imgW: 656, imgH: 667 },
    sleeve_left: { x0: 30.8, y0: 7.7, x1: 66.1, y1: 92.3, imgW: 614, imgH: 724 },
    sleeve_right: { x0: 33.7, y0: 7.7, x1: 69.1, y1: 92.3, imgW: 614, imgH: 724 },
  },
  'fotl-ladies-iconic195-t': {
    front: { x0: 30.6, y0: 1.9, x1: 72.2, y1: 95.1, imgW: 631, imgH: 673 },
    back: { x0: 30.8, y0: 4.7, x1: 71.7, y1: 95.3, imgW: 607, imgH: 676 },
    sleeve_left: { x0: 25, y0: 6.3, x1: 69.1, y1: 94.4, imgW: 540, imgH: 696 },
    sleeve_right: { x0: 30.7, y0: 6.3, x1: 74.8, y1: 94.4, imgW: 540, imgH: 696 },
  },
  'fotl-original-t': {
    front: { x0: 27.4, y0: 8.1, x1: 71.7, y1: 91.9, imgW: 676, imgH: 762 },
    back: { x0: 26.6, y0: 2.4, x1: 73.2, y1: 95.1, imgW: 631, imgH: 748 },
    sleeve_left: { x0: 15.5, y0: 6.1, x1: 66.7, y1: 91.6, imgW: 631, imgH: 752 },
    sleeve_right: { x0: 33.1, y0: 6.1, x1: 84.3, y1: 91.6, imgW: 631, imgH: 752 },
  },
  'fotl-ladies-valueweight-t': {
    front: { x0: 23, y0: 6.5, x1: 78, y1: 93.3, imgW: 622, imgH: 735 },
    back: { x0: 23, y0: 5.8, x1: 76.8, y1: 94.2, imgW: 639, imgH: 736 },
    sleeve_left: { x0: 28.2, y0: 7.5, x1: 71.8, y1: 90.5, imgW: 535, imgH: 769 },
    sleeve_right: { x0: 28, y0: 7.5, x1: 71.6, y1: 90.5, imgW: 535, imgH: 769 },
  },
  // SOL'S: zweite Nicht-FOTL-Marke. Alle 4 Ansichten sind ECHTE, farblich
  // passende Fotos von Spreadshirts Bildserver (image.spreadshirtmedia.net,
  // productType=6) – im Gegensatz zu den meisten anderen geprüften
  // Großhändler-Quellen gibt es dort auch für Ärmel/Seite ein echtes Foto
  // je Farbe (keine Umfärbung, kein Model). Siehe
  // scripts/addBrandProductFromSpreadshirt.mjs. Das Kleidungsstück selbst
  // wird weiterhin z.B. über textil-grosshandel.eu bezogen (dasselbe
  // Herstellermodell).
  'sols-imperial-t': {
    front: { x0: 24.4, y0: 7.6, x1: 75.3, y1: 92.1, imgW: 620, imgH: 720 },
    back: { x0: 24.4, y0: 7.1, x1: 75.3, y1: 92.6, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 7.1, y0: 7.6, x1: 92.9, y1: 92.4, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 7.1, y0: 7.6, x1: 92.9, y1: 92.5, imgW: 620, imgH: 720 },
  },
  // Gildan Heavy Cotton (G5000): dritte Nicht-FOTL-Marke, gleiche
  // Bildquelle wie SOL'S (Spreadshirt-Bildserver, productType=1219) – echte,
  // farblich passende Fotos für alle 4 Ansichten je Farbe. Siehe
  // scripts/ingestSpreadshirtProduct.mjs. Werte per
  // scripts/measureGarmentBounds.mjs aus der Anker-Farbe (Schwarz) ermittelt.
  'gildan-heavy-t': {
    front: { x0: 26.1, y0: 7.1, x1: 73.9, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 26.3, y0: 7.1, x1: 73.5, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 10, y0: 7.1, x1: 90, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 10, y0: 7.1, x1: 90, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Russell Europe (Authentic Tee Pure Organic, Z108M): vierte Nicht-FOTL-
  // Marke, gleiche Bildquelle wie SOL'S/Gildan (Spreadshirt-Bildserver,
  // productType=1561, über teamshirts.de aufgefunden – auf spreadshirt.de
  // selbst nicht mehr gelistet, Bildserver-Endpunkt aber weiterhin aktiv).
  // Siehe scripts/ingestSpreadshirtProduct.mjs.
  'russell-authentic-t': {
    front: { x0: 26, y0: 7.1, x1: 74.2, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 27.4, y0: 7.1, x1: 72.4, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 9.5, y0: 7.1, x1: 90.8, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 9, y0: 7.1, x1: 90.6, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Gildan Softstyle Double Piqué Polo (G64800): erste Poloshirt-Kategorie
  // im Katalog, gleiche Bildquelle (Spreadshirt-Bildserver, productType=1266)
  // – echte, farblich passende Fotos für alle 4 Ansichten je Farbe.
  'gildan-softstyle-polo': {
    front: { x0: 27.3, y0: 7.1, x1: 73.5, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 27.9, y0: 7.1, x1: 72.2, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 12.3, y0: 7.1, x1: 87.6, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 12.3, y0: 7.1, x1: 88.2, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Neutral Men's Classic Polo (NE20080): zweite Poloshirt-Marke, gleiche
  // Bildquelle (Spreadshirt-Bildserver, productType=1532) – echte, farblich
  // passende Fotos für alle 4 Ansichten je Farbe.
  'neutral-classic-polo': {
    front: { x0: 28.4, y0: 7.1, x1: 73.2, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 28.9, y0: 7.1, x1: 71.6, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 12.1, y0: 7.1, x1: 87.9, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 11.8, y0: 7.1, x1: 88.2, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Just Hoods (AWDis) College Hoodie (JH001): erste Hoodie-Kategorie im
  // Katalog, gleiche Bildquelle (Spreadshirt-Bildserver, productType=1047)
  // – echte, farblich passende Fotos für alle 4 Ansichten je Farbe, inkl.
  // echter Ganzkörper-Seitenansichten (nicht nur Schulter-Nahaufnahme).
  'justhoods-college-hoodie': {
    front: { x0: 30, y0: 7.1, x1: 69.8, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 30.3, y0: 7.1, x1: 70, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 31.6, y0: 7.1, x1: 68.1, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 31.9, y0: 7.1, x1: 68.2, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // B&C Inspire Hooded Sweat (BCWU33B): zweite Hoodie-Marke, aber OHNE
  // echtes Ärmel-/Seitenfoto (Spreadshirt-productType=1535 fällt bei
  // Ansicht 3/4 auf die Vorderansicht zurück) – daher hasSleeves:false in
  // bAndC.ts, sleeve_left/right hier nur Platzhalter (identisch zu front,
  // wird nie gerendert, siehe realPhotoFrontBackColorSet()-Kommentar).
  'bandc-inspire-hoodie': {
    front: { x0: 29.9, y0: 7.1, x1: 70.5, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 31.3, y0: 7.1, x1: 69.5, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 13.5, y0: 7.1, x1: 86.1, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 13.5, y0: 7.1, x1: 86.1, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Just Hoods (AWDis) Zoodie (JH050): erste Zip-Hoodie-Kategorie im
  // Katalog, gleiche Bildquelle (Spreadshirt-Bildserver, productType=1529)
  // – echte, farblich passende Fotos für alle 4 Ansichten je Farbe, inkl.
  // echter Ganzkörper-Seitenprofile mit sichtbarem Reißverschluss.
  'justhoods-zoodie': {
    front: { x0: 29.7, y0: 7.1, x1: 72.1, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 29.7, y0: 7.1, x1: 70, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 31.1, y0: 7.1, x1: 68.9, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 31, y0: 7.1, x1: 68.9, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // B&C Inspire Zipped Hood Jacket (BCWU35B): zweite Zip-Hoodie-Marke, aber
  // OHNE echtes Ärmel-/Seitenfoto (wie bandc-inspire-hoodie), daher
  // hasSleeves:false, sleeve_left/right nur Platzhalter (identisch zu front).
  'bandc-inspire-zip-hood': {
    front: { x0: 30.5, y0: 7.1, x1: 69.7, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 29.7, y0: 7.1, x1: 70.1, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 11.6, y0: 7.1, x1: 88.1, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 11.6, y0: 7.1, x1: 88.1, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Just Hoods (AWDis) Sweat (JH030): erste Sweater-Kategorie im Katalog,
  // gleiche Bildquelle (Spreadshirt-Bildserver, productType=5) – echte,
  // farblich passende Fotos für alle 4 Ansichten je Farbe, inkl. echter
  // Ganzkörper-Seitenprofile.
  'justhoods-awdis-sweat': {
    front: { x0: 27.3, y0: 7.1, x1: 72.6, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 28.1, y0: 7.1, x1: 72.1, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 31, y0: 7.1, x1: 69, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 31, y0: 7.1, x1: 69, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // SOL'S Fleecejacket North (L742): erste Fleecejacken-Marke im Katalog,
  // aber OHNE echtes Ärmel-/Seitenfoto (Spreadshirt-productType=1630 fällt
  // bei Ansicht 3/4 auf die Vorderansicht zurück) – daher hasSleeves:false.
  'sols-north-fleece': {
    front: { x0: 28.2, y0: 7.1, x1: 71.6, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 27.9, y0: 7.1, x1: 71, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 12.4, y0: 7.1, x1: 87.6, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 12.4, y0: 7.1, x1: 87.6, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Stedman Classic-T Fitted (S2010): achte externe Marke im Katalog,
  // gleiche Bildquelle (Spreadshirt-Bildserver, productType=963) – echte,
  // farblich passende Fotos für alle 4 Ansichten je Farbe.
  'stedman-slimfit-t': {
    front: { x0: 25.3, y0: 7.1, x1: 74.5, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 26.3, y0: 7.1, x1: 72.9, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 8.4, y0: 7.1, x1: 91, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 8.9, y0: 7.1, x1: 91.3, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // James+Nicholson Men's Active-T (JN358): neunte externe Marke im
  // Katalog, gleiche Bildquelle (Spreadshirt-Bildserver, productType=1310)
  // – echte, farblich passende Fotos für alle 4 Ansichten je Farbe.
  'jn-active-t': {
    front: { x0: 27.4, y0: 7.1, x1: 72.2, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 27.6, y0: 7.1, x1: 72.2, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 11, y0: 7.1, x1: 88.9, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 11, y0: 7.1, x1: 88.9, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // James+Nicholson Workwear Half Zip Sweat (JN831): OHNE echtes Ärmel-/
  // Seitenfoto (productType=1467 fällt bei Ansicht 3/4 auf die
  // Vorderansicht zurück) – daher hasSleeves:false.
  'jn-halfzip-sweat': {
    front: { x0: 30.3, y0: 7.1, x1: 70.1, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 33.9, y0: 7.1, x1: 66.1, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 14.8, y0: 7.1, x1: 85, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 14.8, y0: 7.1, x1: 85, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Gildan Softstyle V-Neck T-Shirt (G64V00): zweites T-Shirt-Modell von
  // Gildan, gleiche Bildquelle (Spreadshirt-Bildserver, productType=1330).
  'gildan-vneck-t': {
    front: { x0: 28.6, y0: 7.1, x1: 71.6, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 30.3, y0: 7.1, x1: 70, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 15.6, y0: 7.1, x1: 84.2, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 15.6, y0: 7.1, x1: 84.4, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Russell Workwear T-Shirt (Z010): zweites T-Shirt-Modell von Russell,
  // gleiche Bildquelle (Spreadshirt-Bildserver, productType=1217).
  'russell-workwear-t': {
    front: { x0: 24.2, y0: 7.8, x1: 75.6, y1: 92.1, imgW: 620, imgH: 720 },
    back: { x0: 24.4, y0: 7.1, x1: 75.5, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 12.9, y0: 7.1, x1: 86.9, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 12.9, y0: 7.1, x1: 86.9, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Neutral Men's Roll Up Sleeve T-Shirt (NE60012): zweites T-Shirt-Modell
  // von Neutral, gleiche Bildquelle (Spreadshirt-Bildserver, productType=1570).
  'neutral-rollsleeve-t': {
    front: { x0: 26, y0: 7.1, x1: 74.8, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 27.1, y0: 7.1, x1: 74, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 7.1, y0: 8.6, x1: 92.9, y1: 91.4, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 7.1, y0: 8.6, x1: 92.9, y1: 91.3, imgW: 620, imgH: 720 },
  },
  // Just Hoods (AWDis) Kontrast-Hoodie (JH003 Varsity Hoodie): zweites
  // Hoodie-Modell von Just Hoods mit echter zweifarbiger Kapuze/Kordel je
  // Farbe, gleiche Bildquelle (Spreadshirt-Bildserver, productType=1007).
  'justhoods-contrast-hoodie': {
    front: { x0: 26.5, y0: 7.1, x1: 73.9, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 27, y0: 7.1, x1: 73, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 29.7, y0: 7.1, x1: 70.2, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 29.7, y0: 7.1, x1: 70.2, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Just Hoods (AWDis) Sophomore 1/4 Zip Sweat (JH046): zweites
  // Zip-Sweater-Modell im Katalog (Viertelreißverschluss statt Halb-/
  // Vollreißverschluss), gleiche Bildquelle (Spreadshirt-Bildserver,
  // productType=4107).
  'justhoods-quarterzip-sweat': {
    front: { x0: 29.7, y0: 7.1, x1: 71.1, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 29, y0: 7.1, x1: 70.8, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 33.7, y0: 7.1, x1: 66.3, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 33.5, y0: 7.1, x1: 66.3, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Fruit of the Loom Valueweight Shortsleeve Baseball T (F295): 15.
  // FOTL-Modell im Katalog, echte zweifarbige Raglanärmel je Farbe,
  // gleiche Bildquelle (Spreadshirt-Bildserver, productType=114).
  'fotl-baseball-t': {
    front: { x0: 26.1, y0: 9.7, x1: 74.2, y1: 90.3, imgW: 620, imgH: 720 },
    back: { x0: 26, y0: 9.2, x1: 74.3, y1: 90.7, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 13.4, y0: 7.1, x1: 86.6, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 13.4, y0: 7.1, x1: 86.6, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Fruit of the Loom Premium Polo (F511N): erstes Poloshirt von FOTL,
  // gleiche Bildquelle (Spreadshirt-Bildserver, productType=1523).
  'fotl-premium-polo': {
    front: { x0: 30.5, y0: 7.1, x1: 70.6, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 29.7, y0: 7.1, x1: 71, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 13.9, y0: 7.1, x1: 86, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 13.5, y0: 7.1, x1: 86, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Gildan Softstyle Ladies T-Shirt (G64000L): erstes Damen-Modell von
  // Gildan, gleiche Bildquelle (Spreadshirt-Bildserver, productType=631).
  // front/back bereits Torso-vermessen (Saum-Methode, wie alle Produkte).
  'gildan-ladies-t': {
    front: { x0: 25.3, y0: 9.9, x1: 75.1, y1: 89.9, imgW: 620, imgH: 720 },
    back: { x0: 25.2, y0: 8.8, x1: 74.5, y1: 91.1, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 7.1, y0: 7.9, x1: 92.9, y1: 92.1, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 7.1, y0: 7.1, x1: 92.9, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Gildan Heavy Cotton Ladies T-Shirt (Needen GN182): Damen-Variante des
  // Heavy Cotton T, gleiche Bildquelle (Spreadshirt-Bildserver,
  // productType=1220), 4 echte Ansichten. front/back Torso-vermessen.
  'gildan-ladies-heavy-t': {
    front: { x0: 25.5, y0: 7.1, x1: 74.3, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 25.3, y0: 7.1, x1: 75.3, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 7.1, y0: 10.4, x1: 92.9, y1: 89.7, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 7.1, y0: 10.4, x1: 92.9, y1: 89.7, imgW: 620, imgH: 720 },
  },
  // Gildan Softstyle Ladies V-Neck (Needen GN647): Damen-V-Neck, gleiche
  // Bildquelle (Spreadshirt-Bildserver, productType=1329), 4 echte
  // Ansichten. front/back Torso-vermessen. y0 der Front knapp unter dem
  // V-Ausschnitt-Ansatz belassen (V reicht tiefer als beim Rundhals).
  'gildan-ladies-vneck-t': {
    front: { x0: 24.2, y0: 7.1, x1: 75.6, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 25.3, y0: 7.1, x1: 74.8, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 9.7, y0: 7.1, x1: 90.2, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 9.7, y0: 7.1, x1: 90, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Russell Ladies Authentic Tee Pure Organic (Z108F): Damen-Variante des
  // Authentic Tee, gleiche Bildquelle (Spreadshirt-Bildserver,
  // productType=1562), 4 echte Ansichten. front/back Torso-vermessen.
  'russell-ladies-authentic-t': {
    front: { x0: 24.7, y0: 7.1, x1: 76.9, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 24.5, y0: 7.1, x1: 76.1, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 7.1, y0: 9.3, x1: 92.9, y1: 90.6, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 7.1, y0: 9.3, x1: 92.9, y1: 90.8, imgW: 620, imgH: 720 },
  },
  // Gildan Softstyle Ladies Double Piqué Polo (G64800L): Damen-Variante
  // des Softstyle-Polos, gleiche Bildquelle (Spreadshirt-Bildserver,
  // productType=1267), 4 echte Ansichten. front/back Torso-vermessen.
  'gildan-ladies-polo': {
    front: { x0: 24, y0: 7.1, x1: 76.1, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 24.2, y0: 7.1, x1: 76.3, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 11.3, y0: 7.1, x1: 88.9, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 11, y0: 7.1, x1: 88.9, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Gildan Heavy Blend Full-Zip Hoodie (Needen GN960): dritte
  // Zip-Hoodie-Marke, gleiche Bildquelle (Spreadshirt-Bildserver,
  // productType=1242), 4 echte Ansichten inkl. echter Seitenprofile.
  // front/back Torso-vermessen.
  'gildan-zip-hoodie': {
    front: { x0: 25.3, y0: 7.1, x1: 74.8, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 26.8, y0: 7.1, x1: 73.4, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 29, y0: 7.1, x1: 70.8, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 29.2, y0: 7.1, x1: 70.8, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Fruit of the Loom Premium Polo Lady-Fit (F520): erstes Damen-Polo,
  // gleiche Bildquelle (Spreadshirt-Bildserver, productType=1524), 4 echte
  // Ansichten inkl. echter Ärmel-Nahaufnahmen. front/back Torso-vermessen.
  'fotl-ladies-premium-polo': {
    front: { x0: 30.2, y0: 7.1, x1: 74.3, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 30.7, y0: 7.1, x1: 74.2, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 7.7, y0: 7.1, x1: 92.1, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 7.7, y0: 7.1, x1: 91.6, y1: 92.9, imgW: 620, imgH: 720 },
  },
  // Fruit of the Loom Valueweight Long Sleeve Baseball T (F296): 16.
  // FOTL-Modell, echte zweifarbige Raglanärmel je Farbe (Langarm-Variante
  // von fotl-baseball-t), gleiche Bildquelle (Spreadshirt, productType=36).
  'fotl-baseball-longsleeve': {
    front: { x0: 27.1, y0: 7.1, x1: 73.9, y1: 92.9, imgW: 620, imgH: 720 },
    back: { x0: 30.8, y0: 7.1, x1: 68.7, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_left: { x0: 32.9, y0: 7.1, x1: 66.9, y1: 92.9, imgW: 620, imgH: 720 },
    sleeve_right: { x0: 32.9, y0: 7.1, x1: 66.9, y1: 92.9, imgW: 620, imgH: 720 },
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

function buildAreasForProduct(productId: string, method: PrintMethod): PrintArea[] {
  const boxes = MEASURED[productId];
  if (!boxes) return [];
  const sizes = method === 'embroidery' ? EMBROIDERY_MAX_SIZE : DTF_MAX_SIZE;
  const referenceHeightCm = REFERENCE_HEIGHT_CM[productId] ?? DEFAULT_REFERENCE_HEIGHT_CM;

  return (Object.keys(boxes) as PrintView[]).map((view) => {
    const template = toTemplate(view, boxes[view], sizes[view].w, sizes[view].h, sizes[view].seam, referenceHeightCm);
    const exclusionZones = EXCLUSION_ZONES[`${productId}-${view}`];
    return { id: `${productId}-${method}-${view}`, productId, ...template, ...(exclusionZones ? { exclusionZones } : {}) };
  });
}

const KNOWN_PRODUCT_IDS = Object.keys(MEASURED);

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
