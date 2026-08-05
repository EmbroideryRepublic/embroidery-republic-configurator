import { computeBasePrice } from '@/config/pricing/marginTiers';
import { realPhotoColorSet, realPhotoFrontBackColorSet } from './colorHelpers';
import type { ProductConfig } from './types';

/**
 * James+Nicholson – neunte externe Marke im Katalog, siehe
 * products/index.ts für das Registrierungs-Rezept künftiger Marken.
 *
 * Bild-Herkunft: AUSSCHLIESSLICH echte Fotos von Spreadshirts Bildserver
 * (image.spreadshirtmedia.net, productType=1310) – dort existiert für
 * jede Farbe ein echtes, farblich passendes Foto für ALLE 4 Ansichten
 * (Vorne, Hinten, Ärmel links, Ärmel rechts), keine Umfärbung/Generierung,
 * kein Model. Siehe scripts/ingestSpreadshirtProduct.mjs. Das
 * Kleidungsstück selbst wird über einen Großhändler bezogen (z.B.
 * textil-grosshandel.eu, Artikel JN358).
 *
 * purchasePrice ist eine grobe Schätzung aus dem Großhandelspreis
 * (ab 6,18€ zzgl. USt für Größen S-XXL) – keine endgültige Kalkulation.
 */

const ACTIVE_T_PURCHASE_PRICE = 6.18;
const HALFZIP_SWEAT_PURCHASE_PRICE = 29.78;

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'jn-active-t',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: "Men's Active-T",
    brand: 'James+Nicholson',
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: ACTIVE_T_PURCHASE_PRICE,
    basePrice: computeBasePrice(ACTIVE_T_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Atmungsaktives Funktions-T-Shirt für Sport und Freizeit',
    material: '100% Micro-Polyester',
    weightGsm: 130,
    fit: 'Unisex, normale Passform',
    description:
      'Atmungsaktives Funktions-T-Shirt aus feuchtigkeitsableitendem Micro-Polyester – ideal für Sport, Teamkleidung und aktive Einsätze. Leicht, schnelltrocknend und angenehm auf der Haut.',
    certifications: [],
    careInstructions: '40°C waschbar, nicht bügeln',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 50, hoeheCm: 72 },
        { size: 'M', breiteCm: 53, hoeheCm: 74 },
        { size: 'L', breiteCm: 56, hoeheCm: 76 },
        { size: 'XL', breiteCm: 59, hoeheCm: 78 },
        { size: 'XXL', breiteCm: 62, hoeheCm: 80 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'James+Nicholson',
      productType: 'Funktions-T-Shirts',
      gender: 'Unisex',
      sustainability: 'Standard-Polyesterproduktion',
      materialDetail: 'Feuchtigkeitsableitendes Micro-Polyester (130 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Atmungsaktiv und feuchtigkeitsableitend',
        'Schnelltrocknend',
        'Leichtes Funktionsgewebe',
        'Ideal für Sport und Teamkleidung',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('jn-active-t', 'black', ['royal', 'navy', 'white', 'red', 'yellow', 'kelly-green']),
  },
  {
    id: 'jn-halfzip-sweat',
    views: ["front","back"],
    name: 'Workwear Half Zip Sweat',
    brand: 'James+Nicholson',
    productType: 'zip-hoodie',
    qualityTier: 'standard',
    purchasePrice: HALFZIP_SWEAT_PURCHASE_PRICE,
    basePrice: computeBasePrice(HALFZIP_SWEAT_PURCHASE_PRICE, 'standard'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Robuster Half-Zip-Sweater mit Stehkragen für die Arbeit',
    material: '70% Baumwolle, 30% Polyester',
    weightGsm: 290,
    fit: 'Unisex, normale Passform',
    description:
      'Strapazierfähiger Sweater mit Stehkragen und halbem Reißverschluss aus pflegeleichtem Baumwoll-/Polyester-Mix mit weichem Innenfleece – elastische Rippstrick-Bündchen an Ärmeln und Bund, waschbar bei 60°C.',
    certifications: [],
    careInstructions: '60°C waschbar, trocknergeeignet',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 54, hoeheCm: 66 },
        { size: 'M', breiteCm: 57, hoeheCm: 69 },
        { size: 'L', breiteCm: 60, hoeheCm: 72 },
        { size: 'XL', breiteCm: 63, hoeheCm: 75 },
        { size: 'XXL', breiteCm: 66, hoeheCm: 78 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'James+Nicholson',
      productType: 'Zip-Hoodies',
      gender: 'Unisex',
      sustainability: 'Standard-Baumwoll-/Polyester-Mischung',
      materialDetail: 'Weicher Innenfleece, Stehkragen mit halbem Reißverschluss (290 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Stehkragen mit halbem Reißverschluss',
        'Weicher Innenfleece',
        'Elastische Rippstrick-Bündchen',
        'Waschbar bei 60°C, trocknergeeignet',
      ],
    },
    // Nur Vorne+Hinten sind echte, farblich passende Fotos je Farbe – kein
    // echtes Ärmelfoto für dieses productType verfügbar, daher
    // hasSleeves:false statt einer Kompromiss-Ansicht.
    colors: realPhotoFrontBackColorSet('jn-halfzip-sweat', 'black', ['navy']),
  },
];
