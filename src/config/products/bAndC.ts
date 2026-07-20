import { computeBasePrice } from '@/config/pricing/marginTiers';
import { realPhotoFrontBackColorSet } from './colorHelpers';
import type { ProductConfig } from './types';

/**
 * B&C Collection – siebte externe Marke im Katalog, siehe products/index.ts
 * für das Registrierungs-Rezept künftiger Marken.
 *
 * Bild-Herkunft: echte Fotos von Spreadshirts Bildserver
 * (image.spreadshirtmedia.net, productType=1535) – dort existiert für jede
 * Farbe ein echtes, farblich passendes Foto für Vorne+Hinten, aber KEIN
 * echtes Ärmel-/Seitenfoto (Ansicht 3/4 fallen bei diesem productType auf
 * die Vorderansicht zurück). Daher hasSleeves:false – die Ärmel-Ansichten
 * werden im Konfigurator vollständig ausgeblendet (siehe
 * realPhotoFrontBackColorSet()-Kommentar in colorHelpers.ts), es wird
 * nirgends ein Foto ALS Ärmel-Ansicht gezeigt. Kein Model, keine
 * Umfärbung. Siehe scripts/ingestSpreadshirtProduct.mjs. Das
 * Kleidungsstück selbst wird über einen Großhändler bezogen (z.B.
 * textil-grosshandel.eu, Artikel BCWU33B).
 *
 * purchasePrice ist eine grobe Schätzung aus dem Großhandelspreis
 * (ab 17,43€ zzgl. USt für Größen S-XXL) – keine endgültige Kalkulation.
 */

const INSPIRE_HOODIE_PURCHASE_PRICE = 17.43;
const INSPIRE_ZIP_HOOD_PURCHASE_PRICE = 23.63;

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'bandc-inspire-hoodie',
    name: 'Inspire Hooded Sweat',
    brand: 'B&C',
    productType: 'hoodie',
    qualityTier: 'standard',
    purchasePrice: INSPIRE_HOODIE_PURCHASE_PRICE,
    basePrice: computeBasePrice(INSPIRE_HOODIE_PURCHASE_PRICE, 'standard'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Nachhaltiger Kapuzenpullover aus Bio-/Recycling-Baumwolle',
    material: '80% biologisch erzeugte Baumwolle, 20% recyceltes Polyester',
    weightGsm: 280,
    fit: 'Unisex, normale Passform, Kängurutasche',
    description:
      'Kuschelig warmer Hoodie aus der nachhaltigen B&C Inspire-Kollektion: weicher Innenfleece, doppellagige Kapuze mit farblich passenden Kordeln und Kängurutasche – aus biologisch erzeugter Baumwolle und recyceltem Polyester.',
    certifications: ['OCS'],
    careInstructions: '30°C waschbar, nicht bleichen',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 52, hoeheCm: 70 },
        { size: 'M', breiteCm: 56, hoeheCm: 72 },
        { size: 'L', breiteCm: 59, hoeheCm: 74 },
        { size: 'XL', breiteCm: 63, hoeheCm: 76 },
        { size: 'XXL', breiteCm: 66, hoeheCm: 78 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'B&C',
      productType: 'Hoodies',
      gender: 'Unisex',
      sustainability: '100% OCS organically grown cotton, Fairly Made zertifiziert',
      materialDetail: 'Angerauter Innenfleece aus Bio-Baumwolle/recyceltem Polyester (280 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Doppellagige Kapuze mit farblich passenden Kordeln',
        'Kängurutasche',
        'Rippstrick an Bund und Ärmeln',
        'OCS-zertifizierte Bio-Baumwolle',
      ],
    },
    // Nur Vorne+Hinten sind echte, farblich passende Fotos je Farbe – kein
    // echtes Ärmelfoto für dieses productType verfügbar (siehe Kommentar
    // oben), daher hasSleeves:false statt einer Kompromiss-Ansicht.
    hasSleeves: false,
    colors: realPhotoFrontBackColorSet('bandc-inspire-hoodie', 'black', [
      'white',
      'navy',
      'grey',
      'royal',
      'red',
      'burgundy',
    ]),
  },
  {
    id: 'bandc-inspire-zip-hood',
    name: 'Inspire Zipped Hood Jacket',
    brand: 'B&C',
    productType: 'zip-hoodie',
    qualityTier: 'standard',
    purchasePrice: INSPIRE_ZIP_HOOD_PURCHASE_PRICE,
    basePrice: computeBasePrice(INSPIRE_ZIP_HOOD_PURCHASE_PRICE, 'standard'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Nachhaltige Reißverschluss-Kapuzenjacke aus Bio-/Recycling-Baumwolle',
    material: '80% biologisch erzeugte Baumwolle, 20% recyceltes Polyester',
    weightGsm: 280,
    fit: 'Unisex, normale Passform, Kängurutasche',
    description:
      'Reißverschluss-Kapuzenjacke aus der nachhaltigen B&C Inspire-Kollektion: weicher Innenfleece, doppellagige Kapuze mit farblich passenden Kordeln und Kängurutasche – aus biologisch erzeugter Baumwolle und recyceltem Polyester.',
    certifications: ['OCS'],
    careInstructions: '30°C waschbar, nicht bleichen',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 52, hoeheCm: 70 },
        { size: 'M', breiteCm: 56, hoeheCm: 72 },
        { size: 'L', breiteCm: 59, hoeheCm: 74 },
        { size: 'XL', breiteCm: 63, hoeheCm: 76 },
        { size: 'XXL', breiteCm: 66, hoeheCm: 78 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'B&C',
      productType: 'Zip-Hoodies',
      gender: 'Unisex',
      sustainability: '100% OCS organically grown cotton, Fairly Made zertifiziert',
      materialDetail: 'Angerauter Innenfleece aus Bio-Baumwolle/recyceltem Polyester (280 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Durchgehender Reißverschluss',
        'Doppellagige Kapuze mit farblich passenden Kordeln',
        'Kängurutasche',
        'OCS-zertifizierte Bio-Baumwolle',
      ],
    },
    // Nur Vorne+Hinten sind echte, farblich passende Fotos je Farbe – kein
    // echtes Ärmelfoto für dieses productType verfügbar, daher
    // hasSleeves:false statt einer Kompromiss-Ansicht.
    hasSleeves: false,
    colors: realPhotoFrontBackColorSet('bandc-inspire-zip-hood', 'black', [
      'white',
      'navy',
      'grey',
      'royal',
      'red',
      'sage',
    ]),
  },
];
