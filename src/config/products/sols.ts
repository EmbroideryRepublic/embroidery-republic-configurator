import { computeBasePrice } from '@/config/pricing/marginTiers';
import { realPhotoColorSet, realPhotoFrontBackColorSet } from './colorHelpers';
import type { ProductConfig } from './types';

/**
 * SOL'S – zweite externe Marke im Katalog (nach Fruit of the Loom), siehe
 * products/index.ts für das Registrierungs-Rezept künftiger Marken.
 *
 * Bild-Herkunft: AUSSCHLIESSLICH echte Fotos von Spreadshirts Bildserver
 * (image.spreadshirtmedia.net) – dort existiert für jede Farbe ein
 * echtes, farblich passendes Foto für ALLE 4 Ansichten (Vorne, Hinten,
 * Ärmel links, Ärmel rechts), keine Umfärbung/Generierung, kein Model.
 * Siehe scripts/addBrandProductFromSpreadshirt.mjs. Das Kleidungsstück
 * selbst wird über einen Großhändler bezogen (z.B. textil-grosshandel.eu,
 * dasselbe Herstellermodell "Imperial T-Shirt" / Art.-Nr. L190).
 *
 * purchasePrice ist eine grobe Schätzung aus dem Großhandelspreis
 * (ab 3,09€ zzgl. USt für Größen S-XXL) – keine endgültige Kalkulation.
 */

const IMPERIAL_PURCHASE_PRICE = 3.09;
const NORTH_FLEECE_PURCHASE_PRICE = 15.06;

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'sols-imperial-t',
    name: 'Imperial T-Shirt',
    brand: "SOL'S",
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: IMPERIAL_PURCHASE_PRICE,
    basePrice: computeBasePrice(IMPERIAL_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Der Bestseller für Textildruck und Promotion',
    material: '100% halbgekämmte Ringspun-Baumwolle (Grey Melange: 85% Baumwolle/15% Viskose)',
    weightGsm: 190,
    fit: 'Unisex-Rundhals, Schlauchwarenverarbeitung',
    description:
      'Eines der beliebtesten T-Shirts für Textildruck und Promotion. Das Unisex-Rundhals-Shirt in Schlauchwarenverarbeitung verfügt durchgehend über Doppelnähte sowie einen klassischen Ripp-Kragen mit Elasthan.',
    certifications: ['OEKO-TEX Standard 100'],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 50, hoeheCm: 70 },
        { size: 'M', breiteCm: 53, hoeheCm: 72 },
        { size: 'L', breiteCm: 56, hoeheCm: 74 },
        { size: 'XL', breiteCm: 59, hoeheCm: 76 },
        { size: 'XXL', breiteCm: 62, hoeheCm: 78 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: "SOL'S",
      productType: 'T-Shirts',
      gender: 'Unisex',
      sustainability: 'OEKO-TEX Standard 100 zertifiziert, REACH-konform',
      materialDetail: 'Halbgekämmte Ringspun-Baumwolle, Heavy-Jersey, Schlauchware',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Verstärkendes Nackenband',
        'Kragenbündchen mit Elasthan',
        'Durchgehende Doppelnähte',
        'OEKO-TEX STANDARD 100 zertifiziert',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('sols-imperial-t', 'black', ['white', 'navy', 'red', 'yellow', 'grey']),
  },
  {
    id: 'sols-north-fleece',
    name: 'Fleecejacket North',
    brand: "SOL'S",
    productType: 'jacket',
    qualityTier: 'standard',
    purchasePrice: NORTH_FLEECE_PURCHASE_PRICE,
    basePrice: computeBasePrice(NORTH_FLEECE_PURCHASE_PRICE, 'standard'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Windfeste Fleecejacke mit Stehkragen für kühle Tage',
    material: '100% Polyester (Fleece)',
    weightGsm: 300,
    fit: 'Unisex, normale Passform, Seitentaschen',
    description:
      'Wundervoll weich, wohlig warm: Die Fleecejacke North ist mit ihrem Stehkragen, Seitentaschen und elastischen Bündchen ein windfester Begleiter für kühle Tage – ideal für Freizeit, Outdoor und Teambekleidung.',
    certifications: [],
    careInstructions: '30°C waschbar, nicht bleichen',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 58, hoeheCm: 70 },
        { size: 'M', breiteCm: 60, hoeheCm: 72 },
        { size: 'L', breiteCm: 63, hoeheCm: 74 },
        { size: 'XL', breiteCm: 66, hoeheCm: 76 },
        { size: 'XXL', breiteCm: 69, hoeheCm: 78 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: "SOL'S",
      productType: 'Fleecejacken',
      gender: 'Unisex',
      sustainability: 'Standard-Polyester-Fleece',
      materialDetail: 'Weicher Anti-Pilling-Fleece (300 g/m²)',
      countryOfOrigin: 'China',
      bulletPoints: [
        'Stehkragen',
        'Durchgehender Reißverschluss',
        'Zwei Seitentaschen mit Reißverschluss',
        'Elastische Bündchen an Ärmeln und Saum',
      ],
    },
    // Nur Vorne+Hinten sind echte, farblich passende Fotos je Farbe – kein
    // echtes Ärmelfoto für dieses productType verfügbar, daher
    // hasSleeves:false statt einer Kompromiss-Ansicht.
    hasSleeves: false,
    colors: realPhotoFrontBackColorSet('sols-north-fleece', 'black', [
      'navy',
      'royal',
      'grey',
      'white',
      'anthracite',
      'green',
    ]),
  },
];
