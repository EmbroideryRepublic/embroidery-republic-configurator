import { computeBasePrice } from '@/config/pricing/marginTiers';
import { realPhotoColorSet } from './colorHelpers';
import type { ProductConfig } from './types';

/**
 * Neutral – fünfte externe Marke im Katalog (nach Fruit of the Loom, SOL'S,
 * Gildan und Russell) und erste Marke mit einem zweiten Poloshirt neben
 * Gildan, siehe products/index.ts für das Registrierungs-Rezept künftiger
 * Marken.
 *
 * Bild-Herkunft: AUSSCHLIESSLICH echte Fotos von Spreadshirts Bildserver
 * (image.spreadshirtmedia.net, productType=1532) – dort existiert für jede
 * Farbe ein echtes, farblich passendes Foto für ALLE 4 Ansichten (Vorne,
 * Hinten, Ärmel links, Ärmel rechts), keine Umfärbung/Generierung, kein
 * Model – im Vorderansicht-Foto ist sogar das reale "Neutral"-Nackenlabel
 * sichtbar. Siehe scripts/ingestSpreadshirtProduct.mjs. Das Kleidungsstück
 * selbst wird über einen Großhändler bezogen (z.B. textil-grosshandel.eu,
 * Artikel NE20080).
 *
 * purchasePrice ist eine grobe Schätzung aus dem Großhandelspreis
 * (ab 19,69€ zzgl. USt für Größen S-XXL) – keine endgültige Kalkulation.
 * Neutral ist als GOTS-zertifizierte/Fair-Wear-Marke deutlich hochpreisiger
 * positioniert als z.B. Gildan, daher qualityTier 'premium' statt 'basic'.
 */

const CLASSIC_POLO_PURCHASE_PRICE = 19.69;
const ROLLSLEEVE_T_PURCHASE_PRICE = 9.92;

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'neutral-classic-polo',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: "Men's Classic Polo",
    brand: 'Neutral',
    productType: 'polo',
    qualityTier: 'premium',
    purchasePrice: CLASSIC_POLO_PURCHASE_PRICE,
    basePrice: computeBasePrice(CLASSIC_POLO_PURCHASE_PRICE, 'premium'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Klassisches Bio-Poloshirt aus fairer, zertifizierter Produktion',
    material: '100% biologisch erzeugte Baumwolle (Piqué)',
    weightGsm: 235,
    fit: 'Gerader Schnitt, normale Passform, Seitenschlitze',
    description:
      'Der farbenfrohe Klassiker für Arbeit, Sport und Freizeit: gerader Schnitt mit normaler Passform, 2-Knopfleiste mit farblich abgestimmten Knöpfen aus gepresster Baumwolle und Ripp-Strick an Kragen und Ärmeln – stilvoll und nachhaltig dank Baumwolle aus biologischem Anbau.',
    certifications: ['GOTS', 'Fair Wear Foundation'],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 50, hoeheCm: 68 },
        { size: 'M', breiteCm: 53, hoeheCm: 71 },
        { size: 'L', breiteCm: 56, hoeheCm: 74 },
        { size: 'XL', breiteCm: 59, hoeheCm: 77 },
        { size: 'XXL', breiteCm: 62, hoeheCm: 80 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'Neutral',
      productType: 'Poloshirts',
      gender: 'Herren',
      sustainability: 'GOTS-zertifizierte Bio-Baumwolle, Fair Wear Foundation Leader',
      materialDetail: 'Schwerer Piqué-Stoff aus biologisch erzeugter Baumwolle (235 g/m²)',
      countryOfOrigin: 'Indien',
      bulletPoints: [
        '2-Knopfleiste mit Knöpfen aus gepresster Baumwolle',
        'Seitenschlitze für bequeme Bewegungsfreiheit',
        'Ripp-Strick an Kragen und Ärmeln',
        'GOTS-zertifiziert, Fair Wear Foundation Leader',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('neutral-classic-polo', 'black', [
      'white',
      'navy',
      'royal',
      'red',
      'grey',
      'bottle-green',
    ]),
  },
  {
    id: 'neutral-rollsleeve-t',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: "Men's Roll Up Sleeve T-Shirt",
    brand: 'Neutral',
    productType: 'tshirt',
    qualityTier: 'standard',
    purchasePrice: ROLLSLEEVE_T_PURCHASE_PRICE,
    basePrice: computeBasePrice(ROLLSLEEVE_T_PURCHASE_PRICE, 'standard'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Bio-Baumwoll-T-Shirt mit stilvoll gerollten Ärmeln',
    material: '100% biologisch erzeugte Baumwolle',
    weightGsm: 180,
    fit: 'Unisex, normale Passform',
    description:
      'T-Shirt aus biologisch erzeugter Baumwolle mit stilvoll gerollten Ärmeln für einen lässigen, modernen Look – vielseitig einsetzbar für Freizeit und Business-Casual.',
    certifications: ['GOTS', 'Fair Wear Foundation'],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 48, hoeheCm: 68 },
        { size: 'M', breiteCm: 51, hoeheCm: 71 },
        { size: 'L', breiteCm: 54, hoeheCm: 74 },
        { size: 'XL', breiteCm: 57, hoeheCm: 77 },
        { size: 'XXL', breiteCm: 60, hoeheCm: 80 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'Neutral',
      productType: 'T-Shirts',
      gender: 'Herren',
      sustainability: 'GOTS-zertifizierte Bio-Baumwolle, Fair Wear Foundation Leader',
      materialDetail: 'Weicher Single-Jersey aus biologisch erzeugter Baumwolle (180 g/m²)',
      countryOfOrigin: 'Indien',
      bulletPoints: [
        'Stilvoll gerollte Ärmel',
        'Rundhalsausschnitt',
        'GOTS-zertifiziert',
        'Fair Wear Foundation Leader',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('neutral-rollsleeve-t', 'black', [
      'grey',
      'navy',
      'anthracite',
      'white',
      'burgundy',
      'olive',
    ]),
  },
];
