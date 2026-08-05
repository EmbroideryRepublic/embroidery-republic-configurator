import { MEASURED_SWATCH_HEX } from './measuredSwatchHexes';
import type { ProductColorConfig } from './types';

// Bildpfade, Platzhalter und repräsentatives Bild leben seit ADR 0004
// ausschließlich in der Asset-Schicht (src/lib/assets); colorHelpers deklariert
// nur noch Farb-Identität (id/name/hex).

/** Canvas-Grundmaße – alle Prozent-/cm-Umrechnungen basieren darauf. */
export const CANVAS_WIDTH = 700;
export const CANVAS_HEIGHT = 840;

/**
 * ══════════════════════════════════════════════════════════════════════
 * PRODUKTBILDER JE FARBE
 * ══════════════════════════════════════════════════════════════════════
 * Jede Marke liefert ihre Farbvarianten über realPhotoColorSet() unten.
 * "anchorColorId" ist reine Ordner-Namenskonvention (der Anker-Ordner hat
 * keinen Farb-Suffix, alle weiteren Farben liegen unter `${folder}-${id}`)
 * – das bedeutet NICHT zwingend "nur diese Farbe ist echt fotografiert".
 * Bei Fruit of the Loom (siehe fruitOfTheLoom.ts) hat jede Farbe ihr
 * eigenes echtes Foto; realPhotoColorSet() baut lediglich Pfad-Strings
 * und ist davon unabhängig.
 * ══════════════════════════════════════════════════════════════════════
 */
export const COLOR_META: Record<string, { name: string; hex: string }> = {
  black: { name: 'Schwarz', hex: '#1a1a1a' },
  navy: { name: 'Navy', hex: '#1b2a4a' },
  grey: { name: 'Grau', hex: '#7a7d80' },
  anthracite: { name: 'Anthrazit', hex: '#3a3a3d' },
  royal: { name: 'Royal', hex: '#1e5fbf' },
  red: { name: 'Rot', hex: '#a4222f' },
  green: { name: 'Grün', hex: '#2f5233' },
  white: { name: 'Weiß', hex: '#f5f5f5' },
  // B&C-Farbpalette (Lieferanten-Farbkarte)
  'heather-grey': { name: 'Heather Grey', hex: '#B7B7B7' },
  'dark-grey-solid': { name: 'Dark Grey (Solid)', hex: '#3B3F42' },
  orange: { name: 'Orange', hex: '#E8631C' },
  'fire-red': { name: 'Fire Red', hex: '#CE1126' },
  sorbet: { name: 'Sorbet', hex: '#F2A6B4' },
  'very-turquoise': { name: 'Very Turquoise', hex: '#00A9A0' },
  'sky-blue': { name: 'Sky Blue', hex: '#7BB8E0' },
  'cobalt-blue': { name: 'Cobalt Blue', hex: '#1E4B8F' },
  'urban-navy': { name: 'Urban Navy', hex: '#1B2A41' },
  'bottle-green': { name: 'Bottle Green', hex: '#1B4332' },
  'urban-khaki': { name: 'Urban Khaki', hex: '#6B6650' },
  'solar-yellow': { name: 'Solar Yellow', hex: '#F5D000' },
  'urban-orange': { name: 'Urban Orange', hex: '#C1440E' },
  'orchid-pink': { name: 'Orchid Pink', hex: '#E8A0BF' },
  'orchid-green': { name: 'Orchid Green', hex: '#7A9A5C' },
  'radiant-purple': { name: 'Radiant Purple', hex: '#6A3D9A' },
  'millennial-lilac': { name: 'Millennial Lilac', hex: '#B19CD9' },
  'millennial-mint': { name: 'Millennial Mint', hex: '#8FD4C1' },
  // Fruit of the Loom
  pink: { name: 'Pink', hex: '#E4007C' },
  sage: { name: 'Sage', hex: '#B2C2AE' },
  sand: { name: 'Sand', hex: '#CBB994' },
  petrol: { name: 'Petrol', hex: '#1C3F4C' },
  olive: { name: 'Olive', hex: '#5C5F3D' },
  graphite: { name: 'Graphite', hex: '#2B2E33' },
  sunflower: { name: 'Sunflower', hex: '#F0B400' },
  burgundy: { name: 'Burgundy', hex: '#6E1E2E' },
  natural: { name: 'Natural', hex: '#E8DCC3' },
  'brick-red': { name: 'Brick Red', hex: '#B33A3A' },
  chocolate: { name: 'Chocolate', hex: '#4A3826' },
  purple: { name: 'Purple', hex: '#4B2E63' },
  'heather-royal': { name: 'Heather Royal', hex: '#3D5A99' },
  azure: { name: 'Azure', hex: '#1AA3C4' },
  'deep-navy': { name: 'Deep Navy', hex: '#141B2E' },
  'heather-charcoal': { name: 'Heather Charcoal', hex: '#3E3E42' },
  khaki: { name: 'Khaki', hex: '#5C4A32' },
  cranberry: { name: 'Cranberry', hex: '#9E1B3D' },
  'powder-blue': { name: 'Powder Blue', hex: '#A8C4D6' },
  blush: { name: 'Blush', hex: '#F3C9CE' },
  'kelly-green': { name: 'Kelly Green', hex: '#189B4A' },
  yellow: { name: 'Yellow', hex: '#FFD700' },
  'lime-green': { name: 'Lime Green', hex: '#7FD436' },
  'heather-purple': { name: 'Heather Purple', hex: '#5C4A73' },
  // Gildan
  charcoal: { name: 'Dunkelgrau meliert', hex: '#3C4041' },
  // Just Hoods Kontrast-Hoodie (echte zweifarbige Kapuze/Kordel je Farbe)
  'navy-grey': { name: 'Navy/Grau meliert', hex: '#192030' },
  'black-red': { name: 'Schwarz/Rot', hex: '#101010' },
  'grey-navy': { name: 'Grau meliert/Navy', hex: '#9C9C9C' },
  'burgundy-anthracite': { name: 'Weinrot/Anthrazit', hex: '#610B26' },
  'red-white': { name: 'Rot/Weiß', hex: '#C20000' },
  // Fruit of the Loom Baseball T-Shirt (echte zweifarbige Raglanärmel je Farbe)
  'white-navy': { name: 'Weiß/Navy', hex: '#2B2F40' },
  'white-black': { name: 'Weiß/Schwarz', hex: '#2B2B2B' },
  'white-royal': { name: 'Weiß/Royalblau', hex: '#3566DE' },
};

/** Wirft einen klaren Fehler, falls eine Farb-ID nicht in COLOR_META
 *  hinterlegt ist – das wäre ein Tippfehler in der Konfiguration, der
 *  früh auffallen soll, statt still eine kaputte Farbe zu erzeugen. */
export function getColorMeta(id: string): { name: string; hex: string } {
  const meta = COLOR_META[id];
  if (!meta) {
    throw new Error(`Unbekannte Farb-ID "${id}" – bitte in COLOR_META ergänzen.`);
  }
  return meta;
}

/**
 * @param folder Basisordner des Ankerfotos, z.B. "polo-real"
 * @param anchorColorId Farb-ID der tatsächlich fotografierten Farbe (oder,
 *   bei Marken mit echten Fotos je Farbe, einfach die als "Anker"-Ordner
 *   gewählte Farbe – reine Namenskonvention, siehe Kommentar oben)
 * @param extraColorIds weitere Farb-IDs (rekoloriert ODER echt fotografiert,
 *   je nach Marke)
 */
/** Swatch-Farbe: bevorzugt der aus dem ECHTEN Produktfoto gemessene
 *  Stoffton (measuredSwatchHexes.ts, auto-generiert) – so zeigt der
 *  Auswahlpunkt exakt den Ton des Fotos, nicht den generischen
 *  COLOR_META-Ton, der je Marke leicht abweichen kann. */
function swatchHex(folderName: string, colorId: string): string {
  return MEASURED_SWATCH_HEX[folderName] ?? getColorMeta(colorId).hex;
}

/**
 * ══════════════════════════════════════════════════════════════════════
 * PLATZHALTER-FARBSATZ (Produkte OHNE echte Fotos)
 * ══════════════════════════════════════════════════════════════════════
 * Für neu aufgenommene Produkte, für die noch keine echten Fotos vorliegen
 * (`bildStatus: 'fehlt'` auf dem ProductConfig). Jede Farbe zeigt in ALLEN
 * Ansichten denselben neutralen Platzhalter; der Farb-Swatch nutzt aber den
 * ECHTEN, aus der Lieferantenquelle (textil-grosshandel.eu, Swatch-`data-key`)
 * verifizierten Hex – kein geschätzter Ton. So bleibt das Produkt vollständig
 * pflegbar und wird beim späteren Bebildern gesammelt umgestellt (Platzhalter
 * → echte `/products/<ordner>/…`-Pfade), ohne dass je ein Platzhalter für ein
 * echtes Foto gehalten wird.
 */
export function platzhalterFarbSet(
  farben: { id: string; name: string; hex: string }[],
  // Historischer Parameter (welche Ansichten Platzhalter bekamen). Seit ADR 0004
  // liefert die Asset-Schicht die Bilder über das Manifest – der Parameter wird
  // ignoriert und bleibt nur, damit bestehende generierte Aufrufe kompilieren.
  _views?: readonly string[]
): ProductColorConfig[] {
  return farben.map(({ id, name, hex }) => ({ id, name, hex }));
}

/**
 * Gemeinsamer Aufbau eines Farbsatzes: Anker-Farbe + Extra-Farben. Deklariert
 * ausschließlich die Farb-Identität – Name aus COLOR_META, Hex aus dem gemessenen
 * Swatch (measuredSwatchHexes, je Bild-Ablageordner). Die Bildpfade liegen im
 * Asset-Manifest (ADR 0004); die Produktdefinition kennt sie nicht.
 */
function realPhotoSet(
  folder: string,
  anchorColorId: string,
  extraColorIds: string[]
): ProductColorConfig[] {
  const baue = (ordner: string, id: string): ProductColorConfig => ({
    id,
    name: getColorMeta(id).name,
    hex: swatchHex(ordner, id),
  });
  return [baue(folder, anchorColorId), ...extraColorIds.map((id) => baue(`${folder}-${id}`, id))];
}

/** Farbsatz eines Produkts mit echten Fotos. `folder` = Ablage-Basis (heute die
 *  Produkt-ID); wird nur noch für den gemessenen Swatch-Hex genutzt, NICHT für
 *  Bildpfade (die liegen im Asset-Manifest, ADR 0004). */
export function realPhotoColorSet(
  folder: string,
  anchorColorId: string,
  extraColorIds: string[]
): ProductColorConfig[] {
  return realPhotoSet(folder, anchorColorId, extraColorIds);
}

/** Historisch für Produkte ohne echte Ärmel-/Seitenfotos; seit der Asset-Schicht
 *  (ADR 0004) identisch zu realPhotoColorSet – der frühere front-Fallback lebt
 *  jetzt im Manifest. Bleibt als eigener Name für die bestehenden Aufrufer. */
export function realPhotoFrontBackColorSet(
  folder: string,
  anchorColorId: string,
  extraColorIds: string[]
): ProductColorConfig[] {
  return realPhotoSet(folder, anchorColorId, extraColorIds);
}
