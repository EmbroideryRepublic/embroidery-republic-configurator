import type { PrintView } from '@/types';

/** Canvas-Grundmaße – alle Prozent-/cm-Umrechnungen basieren darauf. */
export const CANVAS_WIDTH = 700;
export const CANVAS_HEIGHT = 840;

export interface ProductColorConfig {
  id: string;
  name: string;
  hex: string;
  images: Record<PrintView, string>;
}

export interface ProductConfig {
  id: string;
  name: string;
  brand: string;
  basePrice: number;
  sizes: string[];
  colors: ProductColorConfig[];
  tagline: string;
  material: string;
  weightGsm: number;
  fit: string;
  description: string;
  certifications: string[];
  careInstructions: string;
  hasRealPhotos?: boolean;
  /** true = mehr Weißraum um das Motiv (KI-generierte Bilder), Druckbereiche
   *  brauchen dafür ein eigenes Positionierungs-Template. */
  hasWideMargin?: boolean;
  /** false = Produkt hat keine Ärmel (z.B. Weste/Bodywarmer) – die
   *  Ärmel-Ansichten werden dann in Ansichtswechsler, Großansicht und
   *  Preis-Aufschlüsselung ausgeblendet. Default: true (hat Ärmel). */
  hasSleeves?: boolean;
  /** Link zum technischen Datenblatt des Herstellers (optional) */
  datasheetUrl?: string;
  /** Größentabelle mit Maßen je Größe + "wie fällt aus"-Einordnung –
   *  wird als Popup über einen "Größenleitfaden"-Link geöffnet, nicht
   *  dauerhaft eingeblendet. */
  sizeGuide?: SizeGuide;
  /** Detaillierte Herstellerangaben (Material, Herkunft, Nachhaltigkeit
   *  etc.) – so wie sie vom Lieferanten mitgeliefert werden. */
  detailedDescription?: DetailedDescription;
}

export interface SizeGuide {
  /** z.B. [{ size: 'S', breiteCm: 49.5, hoeheCm: 70 }, ...] */
  measurements: { size: string; breiteCm: number; hoeheCm: number; aermelCm?: number }[];
  /** Position auf der "klein–normal–groß"-Skala, 0-100 (50 = normal) */
  fitRating: number;
}

export interface DetailedDescription {
  /** Lieferantenmarke, z.B. "B&C" (nicht die eigene Shop-Marke) */
  supplierBrand: string;
  productType: string;
  gender: string;
  sustainability: string;
  materialDetail: string;
  countryOfOrigin: string;
  /** Einzelne Stichpunkte aus dem Herstellerdatenblatt, z.B.
   *  "Piqué aus 100% ringgesponnener Bio-Baumwolle" */
  bulletPoints: string[];
}

/**
 * ══════════════════════════════════════════════════════════════════════
 * ECHTE PRODUKTBILDER + PROGRAMMATISCH EINGEFÄRBTE FARBVARIANTEN
 * ══════════════════════════════════════════════════════════════════════
 * Jedes "-real"-Produkt wurde in genau EINER Farbe fotografiert (Anker-
 * Farbe). Alle weiteren Farben sind daraus programmatisch erzeugt: Falten,
 * Schatten und Lichter (Helligkeitsstruktur) des Originalfotos bleiben
 * erhalten, nur Farbton/Sättigung werden ersetzt (HSL-Rekolorierung,
 * siehe /home/claude/recolor.py – nicht Teil des Next.js-Projekts, nur das
 * Analyse-Werkzeug, mit dem diese Bilder erzeugt wurden).
 *
 * Das ist eine Annäherung, kein Ersatz für echte Farb-Fotos: feine
 * Mehrfarb-Details (z.B. die schwarzen Knie-Patches der Work Pants)
 * werden mit eingefärbt statt erhalten zu bleiben. Für Marketing-taugliche
 * Bilder empfiehlt sich irgendwann echte Fotografie je Farbe – als
 * Konfigurator-Vorschau ist die Rekolorierung aber eine sehr gute Näherung.
 * ══════════════════════════════════════════════════════════════════════
 */
function svgColorSet(folder: string): ProductColorConfig[] {
  const variants: { id: string; name: string; hex: string; suffix: string }[] = [
    { id: 'black', name: 'Schwarz', hex: '#1a1a1a', suffix: '' },
    { id: 'white', name: 'Weiß', hex: '#f5f5f5', suffix: '-white' },
    { id: 'navy', name: 'Navy', hex: '#1b2a4a', suffix: '-navy' },
    { id: 'red', name: 'Rot', hex: '#a4222f', suffix: '-red' },
    { id: 'grey', name: 'Grau', hex: '#7a7d80', suffix: '-grey' },
  ];

  return variants.map((v) => ({
    id: v.id,
    name: v.name,
    hex: v.hex,
    images: {
      front: `/products/${folder}${v.suffix}/front.svg`,
      back: `/products/${folder}${v.suffix}/back.svg`,
      sleeve_left: `/products/${folder}${v.suffix}/sleeve-left.svg`,
      sleeve_right: `/products/${folder}${v.suffix}/sleeve-right.svg`,
    },
  }));
}

const COLOR_META: Record<string, { name: string; hex: string }> = {
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
};

/**
 * @param folder Basisordner des Ankerfotos, z.B. "polo-real"
 * @param anchorColorId Farb-ID der tatsächlich fotografierten Farbe
 * @param extraColorIds weitere, programmatisch eingefärbte Farb-IDs
 */
/** Wirft einen klaren Fehler, falls eine Farb-ID nicht in COLOR_META
 *  hinterlegt ist – das wäre ein Tippfehler in der Konfiguration, der
 *  früh auffallen soll, statt still eine kaputte Farbe zu erzeugen. */
function getColorMeta(id: string): { name: string; hex: string } {
  const meta = COLOR_META[id];
  if (!meta) {
    throw new Error(`Unbekannte Farb-ID "${id}" – bitte in COLOR_META ergänzen.`);
  }
  return meta;
}

function realPhotoColorSet(folder: string, anchorColorId: string, extraColorIds: string[]): ProductColorConfig[] {
  const anchor: ProductColorConfig = {
    id: anchorColorId,
    name: getColorMeta(anchorColorId).name,
    hex: getColorMeta(anchorColorId).hex,
    images: {
      front: `/products/${folder}/front.webp`,
      back: `/products/${folder}/back.webp`,
      sleeve_left: `/products/${folder}/sleeve-left.webp`,
      sleeve_right: `/products/${folder}/sleeve-right.webp`,
    },
  };

  const extras: ProductColorConfig[] = extraColorIds.map((id) => ({
    id,
    name: getColorMeta(id).name,
    hex: getColorMeta(id).hex,
    images: {
      front: `/products/${folder}-${id}/front.webp`,
      back: `/products/${folder}-${id}/back.webp`,
      sleeve_left: `/products/${folder}-${id}/sleeve-left.webp`,
      sleeve_right: `/products/${folder}-${id}/sleeve-right.webp`,
    },
  }));

  return [anchor, ...extras];
}

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'hoodie-test',
    name: 'Unisex Hoodie',
    brand: 'Stanley/Stella',
    basePrice: 34.9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Der Klassiker für Team- und Firmenbekleidung',
    material: '80% Baumwolle, 20% Polyester',
    weightGsm: 280,
    fit: 'Regular Fit, Unisex',
    description:
      'Schwerer Fleece-Hoodie mit Känguru-Tasche und Kordelzug. Idealer Allrounder für Firmen- und Teambekleidung, angenehm warm und langlebig.',
    certifications: ['OEKO-TEX Standard 100'],
    careInstructions: 'Waschbar bei 30°C, nicht bleichen, keine Trockneranwendung',
    colors: svgColorSet('hoodie').map((c) => ({
      ...c,
      images:
        c.id === 'black'
          ? {
              front: '/products/hoodie-black/front.svg',
              back: '/products/hoodie-black/back.svg',
              sleeve_left: '/products/hoodie-black/sleeve-left.svg',
              sleeve_right: '/products/hoodie-black/sleeve-right.svg',
            }
          : c.images,
    })),
  },
  {
    id: 'softshell-test',
    name: 'Softshell Jacket (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 54.9,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
    tagline: 'Wasserabweisend & atmungsaktiv für Outdoor-Einsätze',
    material: '96% Polyester, 4% Elasthan',
    weightGsm: 280,
    fit: 'Regular Fit',
    description:
      'Wasserabweisende und atmungsaktive Unisex Softshell Jacke – ideal für Outdoor-Arbeitseinsätze und körperliche Tätigkeiten. Wasserabweisend bis 8.000mm, atmungsaktiv bis 3.000 g/m²/24h.',
    certifications: [],
    careInstructions: '30°C waschbar, nicht bügeln, nicht im Trockner trocknen',
    hasRealPhotos: true,
    colors: realPhotoColorSet('softshell-real', 'black', ['navy', 'grey', 'anthracite', 'royal']),
  },
  {
    id: 'fleece-test',
    name: 'Fleece Jacket (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 34.9,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
    tagline: 'Warme Fleecejacke für kühle Tage',
    material: '100% Polyester (Fleece)',
    weightGsm: 280,
    fit: 'Regular Fit',
    description:
      'Kuschelig warme Unisex Fleecejacke mit durchgehendem Reißverschluss und Brusttasche mit Reißverschluss. Vielseitiger Begleiter für kühle Arbeitstage oder als Zwischenschicht.',
    certifications: [],
    careInstructions: '30°C waschbar, nicht bügeln, trocknergeeignet auf niedriger Stufe',
    hasRealPhotos: true,
    colors: realPhotoColorSet('fleece-real', 'black', ['navy', 'grey', 'anthracite', 'royal']),
  },
  {
    id: 'polo2-test',
    name: 'Poloshirt Classic (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 18.9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    tagline: 'Klassisches Poloshirt',
    material: '100% Baumwolle (Piqué)',
    weightGsm: 200,
    fit: 'Regular Fit',
    description: 'Klassisches Unisex Poloshirt.',
    certifications: [],
    careInstructions: '40°C waschbar',
    hasRealPhotos: true,
    hasWideMargin: true,
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 49.5, hoeheCm: 70 },
        { size: 'M', breiteCm: 52.5, hoeheCm: 72 },
        { size: 'L', breiteCm: 55.5, hoeheCm: 74 },
        { size: 'XL', breiteCm: 58.5, hoeheCm: 76 },
        { size: 'XXL', breiteCm: 61.5, hoeheCm: 78 },
        { size: '3XL', breiteCm: 64.5, hoeheCm: 80 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'B&C',
      productType: 'Poloshirts',
      gender: 'Herren',
      sustainability: 'Fairwear, Bio-Baumwolle, Nachhaltig',
      materialDetail:
        '100% einlaufvorbehandelte ringgesponnene In-Konversion-Bio-Baumwolle (Heather Grey: 90% Bio- oder In-Konversion-Baumwolle / 10% Viskose)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Piqué aus 100% ringgesponnener Bio-Baumwolle in Umstellung',
        'Vorgeschrumpft',
        'Weiches Handgefühl',
        '„B&C No Neck-Etikett"',
        'Kragen und Bündchen aus 1x1 Ripp-Strick',
        'Farblich abgestimmte Knöpfe',
        'Nackenband aus identischem Material',
        'Moderner Schnitt',
        'Seitennähte',
        'Ebenmäßige Oberfläche',
        'B&C Collection ist Mitglied der Fair Wear Foundation',
        'REACH',
        'Vegan',
        'Faire Arbeitsbedingungen',
        'Bio-Baumwolle in Umstellung',
        'Oeko-Tex 100',
        'Bügeln erlaubt',
        'Trockner geeignet',
        '40°C waschbar',
      ],
    },
    colors: realPhotoColorSet('polo2-real', 'black', [
      'white',
      'heather-grey',
      'dark-grey-solid',
      'orange',
      'fire-red',
      'sorbet',
      'very-turquoise',
      'sky-blue',
      'cobalt-blue',
      'urban-navy',
      'bottle-green',
      'urban-khaki',
      'solar-yellow',
      'urban-orange',
      'orchid-pink',
      'orchid-green',
      'radiant-purple',
      'millennial-lilac',
      'millennial-mint',
    ]),
  },
  {
    id: 'polopremium-test',
    name: 'Poloshirt Premium (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 24.9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Hochwertiges Poloshirt in Premium-Qualität',
    material: '95% Baumwolle, 5% Elasthan',
    weightGsm: 220,
    fit: 'Regular Fit',
    description: 'Hochwertiges Poloshirt mit elastischem Piqué-Gewebe.',
    certifications: [],
    careInstructions: '40°C waschbar',
    hasRealPhotos: true,
    hasWideMargin: true,
    colors: realPhotoColorSet('polopremium-real', 'black', ['navy', 'grey', 'white', 'royal']),
  },
  {
    id: 'bodywarmer-test',
    name: 'Bodywarmer / Weste (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 29.9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Gesteppte Weste für die Übergangszeit',
    material: '100% Polyester (gesteppt)',
    weightGsm: 260,
    fit: 'Regular Fit',
    description: 'Gesteppter Bodywarmer mit durchgehendem Reißverschluss und Seitentaschen.',
    certifications: [],
    careInstructions: '30°C waschbar, nicht bügeln',
    hasRealPhotos: true,
    hasWideMargin: true,
    hasSleeves: false,
    colors: realPhotoColorSet('bodywarmer-real', 'black', ['navy', 'grey', 'anthracite']),
  },
  {
    id: 'softshellhood-test',
    name: 'Softshelljacke mit Kapuze (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 59.9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Softshelljacke mit abnehmbarer Kapuze',
    material: '96% Polyester, 4% Elasthan',
    weightGsm: 300,
    fit: 'Regular Fit',
    description: 'Wetterfeste Softshelljacke mit Kapuze und Brusttasche.',
    certifications: [],
    careInstructions: '30°C waschbar, nicht bügeln',
    hasRealPhotos: true,
    hasWideMargin: true,
    colors: realPhotoColorSet('softshellhood-real', 'black', ['navy', 'grey', 'anthracite']),
  },
  {
    id: 'softshell2-test',
    name: 'Softshelljacke Classic (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 54.9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Softshelljacke ohne Kapuze, mit Stehkragen',
    material: '96% Polyester, 4% Elasthan',
    weightGsm: 280,
    fit: 'Regular Fit',
    description: 'Wetterfeste Softshelljacke mit Stehkragen und Brusttasche.',
    certifications: [],
    careInstructions: '30°C waschbar, nicht bügeln',
    hasRealPhotos: true,
    hasWideMargin: true,
    colors: realPhotoColorSet('softshell2-real', 'black', ['navy', 'grey', 'anthracite']),
  },
  {
    id: 'ziphoodie-test',
    name: 'Zip Hoodie (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 39.9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Hoodie mit durchgehendem Reißverschluss',
    material: '80% Baumwolle, 20% Polyester',
    weightGsm: 300,
    fit: 'Regular Fit',
    description: 'Kapuzenjacke mit durchgehendem Reißverschluss und Känguru-Tasche.',
    certifications: [],
    careInstructions: '30°C waschbar',
    hasRealPhotos: true,
    hasWideMargin: true,
    colors: realPhotoColorSet('ziphoodie-real', 'black', ['navy', 'grey', 'anthracite', 'royal']),
  },
  {
    id: 'sweatshirt2-test',
    name: 'Sweatshirt Classic (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 22.9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Klassisches Rundhals-Sweatshirt',
    material: '80% Baumwolle, 20% Polyester',
    weightGsm: 280,
    fit: 'Regular Fit',
    description: 'Klassisches Rundhals-Sweatshirt.',
    certifications: [],
    careInstructions: '30°C waschbar',
    hasRealPhotos: true,
    hasWideMargin: true,
    colors: realPhotoColorSet('sweatshirt2-real', 'black', ['navy', 'grey', 'white', 'royal', 'red']),
  },
  {
    id: 'tshirt2-test',
    name: 'T-Shirt Classic (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 11.0,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Klassisches Rundhals-T-Shirt',
    material: '100% Baumwolle',
    weightGsm: 160,
    fit: 'Regular Fit',
    description: 'Klassisches Rundhals-T-Shirt.',
    certifications: [],
    careInstructions: '40°C waschbar',
    hasRealPhotos: true,
    hasWideMargin: true,
    colors: realPhotoColorSet('tshirt2-real', 'black', ['navy', 'grey', 'white', 'royal', 'red', 'green']),
  },
  {
    id: 'hoodie2-test',
    name: 'Hoodie Classic (Unisex)',
    brand: 'Eigene Kollektion',
    basePrice: 32.9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Klassischer Kapuzenpullover',
    material: '80% Baumwolle, 20% Polyester',
    weightGsm: 280,
    fit: 'Regular Fit',
    description: 'Klassischer Kapuzenpullover mit Känguru-Tasche.',
    certifications: [],
    careInstructions: '30°C waschbar',
    hasRealPhotos: true,
    hasWideMargin: true,
    colors: realPhotoColorSet('hoodie2-real', 'black', ['navy', 'grey', 'white', 'royal', 'red']),
  },
];

export const TEST_PRODUCT_ID = PRODUCTS[0]?.id ?? '';

export function getProduct(productId: string): ProductConfig | undefined {
  return PRODUCTS.find((p) => p.id === productId);
}
