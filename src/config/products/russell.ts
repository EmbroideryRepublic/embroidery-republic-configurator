import { computeBasePrice } from '@/config/pricing/marginTiers';
import { realPhotoColorSet } from './colorHelpers';
import type { ProductConfig } from './types';

/**
 * Russell Europe – vierte externe Marke im Katalog (nach Fruit of the Loom,
 * SOL'S und Gildan), siehe products/index.ts für das Registrierungs-Rezept
 * künftiger Marken.
 *
 * Bild-Herkunft: AUSSCHLIESSLICH echte Fotos von Spreadshirts Bildserver
 * (image.spreadshirtmedia.net, productType=1561) – dort existiert für jede
 * Farbe ein echtes, farblich passendes Foto für ALLE 4 Ansichten (Vorne,
 * Hinten, Ärmel links, Ärmel rechts), keine Umfärbung/Generierung, kein
 * Model. Das productType ist auf spreadshirt.de selbst nicht mehr gelistet,
 * der Bildserver-Endpunkt und die Schwestermarke teamshirts.de (dieselbe
 * Spreadshirt-Unternehmensgruppe) führen das Produkt aber weiterhin, dort
 * auch die appearance-IDs je Farbe verifiziert. Siehe
 * scripts/ingestSpreadshirtProduct.mjs. Das Kleidungsstück selbst wird über
 * einen Großhändler bezogen (z.B. textil-grosshandel.eu, Artikel Z108M).
 *
 * purchasePrice ist eine grobe Schätzung aus dem Großhandelspreis
 * (ab 5,48€ zzgl. USt für Größen S-XXL) – keine endgültige Kalkulation.
 */

const AUTHENTIC_TEE_PURCHASE_PRICE = 5.48;
const WORKWEAR_T_PURCHASE_PRICE = 9.77;
const LADIES_AUTHENTIC_TEE_PURCHASE_PRICE = 5.48; // ab-Preis textil-grosshandel.eu (Artikel Z108F)

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'russell-authentic-t',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: 'Authentic Tee Pure Organic',
    brand: 'Russell',
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: AUTHENTIC_TEE_PURCHASE_PRICE,
    basePrice: computeBasePrice(AUTHENTIC_TEE_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Schlank geschnittenes Bio-Baumwoll-T-Shirt',
    material: '100% biologisch erzeugte, gekämmte Ringspun-Baumwolle (Grau meliert: 97% Baumwolle/3% Viskose)',
    weightGsm: 160,
    fit: 'Moderner, körperbetonter Slim Fit, schmales Rundhals-Bündchen',
    description:
      'Ein besonders edles Bio-T-Shirt aus 100% biologisch erzeugter Baumwolle: moderne, körperbetonte Passform mit schmalem Rundhals-Kragenbündchen und Schulter-zu-Schulter-Nackenband für zusätzliche Stabilität.',
    certifications: [],
    careInstructions: '30°C waschbar, nicht bleichen',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 48, hoeheCm: 67.5 },
        { size: 'M', breiteCm: 51, hoeheCm: 70 },
        { size: 'L', breiteCm: 54, hoeheCm: 72.5 },
        { size: 'XL', breiteCm: 57, hoeheCm: 75 },
        { size: 'XXL', breiteCm: 60, hoeheCm: 77.5 },
      ],
      fitRating: 35,
    },
    detailedDescription: {
      supplierBrand: 'Russell',
      productType: 'T-Shirts',
      gender: 'Herren',
      sustainability: 'Aus biologisch erzeugter Baumwolle',
      materialDetail: 'Leichter Jersey aus 100% biologisch erzeugter, gekämmter Ringspun-Baumwolle (160 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Moderner, körperbetonter Slim Fit',
        'Schmales Rundhals-Kragenbündchen',
        'Schulter-zu-Schulter-Nackenband für mehr Stabilität',
        'Aus biologisch erzeugter Baumwolle',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('russell-authentic-t', 'black', ['white', 'navy', 'red', 'grey', 'royal', 'burgundy']),
  },
  {
    id: 'russell-workwear-t',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: 'Workwear T-Shirt',
    brand: 'Russell',
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: WORKWEAR_T_PURCHASE_PRICE,
    basePrice: computeBasePrice(WORKWEAR_T_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Strapazierfähiges T-Shirt in schwerer Qualität für den Alltag',
    material: '100% Baumwolle',
    weightGsm: 200,
    fit: 'Unisex, normale Passform',
    description:
      'T-Shirt in schwerer Qualität für den dauerhaften Einsatz unter anspruchsvollen Bedingungen: doppelte Schulterverstärkung und doppelte Naht am Armausschnitt für außergewöhnliche Haltbarkeit, enzymgewaschene und gekämmte Baumwolle für hohen Tragekomfort.',
    certifications: [],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 51, hoeheCm: 71 },
        { size: 'M', breiteCm: 54, hoeheCm: 73 },
        { size: 'L', breiteCm: 57, hoeheCm: 76 },
        { size: 'XL', breiteCm: 60, hoeheCm: 78 },
        { size: 'XXL', breiteCm: 63, hoeheCm: 81 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'Russell',
      productType: 'T-Shirts',
      gender: 'Unisex',
      sustainability: 'Standard-Baumwollproduktion',
      materialDetail: 'Schwerer, enzymgewaschener und gekämmter Baumwoll-Jersey (200 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Doppelte Schulterverstärkung',
        'Doppelte Naht am Armausschnitt',
        'Enzymgewaschene, gekämmte Baumwolle',
        'Besonders strapazierfähig für den Alltag',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('russell-workwear-t', 'black', [
      'navy',
      'royal',
      'grey',
      'white',
      'red',
      'bottle-green',
    ]),
  },
  {
    id: 'russell-ladies-authentic-t',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: 'Ladies Authentic Tee Pure Organic',
    brand: 'Russell',
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: LADIES_AUTHENTIC_TEE_PURCHASE_PRICE,
    basePrice: computeBasePrice(LADIES_AUTHENTIC_TEE_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Tailliertes Bio-Baumwoll-T-Shirt für Damen',
    material: '100% biologisch erzeugte, gekämmte Ringspun-Baumwolle (Grau meliert: 97% Baumwolle/3% Viskose)',
    weightGsm: 160,
    fit: 'Damen, taillierter Schnitt mit Seitennähten',
    description:
      'Die Damen-Variante des Authentic Tee: 100% biologisch erzeugte, gekämmte Ringspun-Baumwolle in taillierter Passform mit schmalem Rundhals-Bündchen und Schulter-zu-Schulter-Nackenband.',
    certifications: [],
    careInstructions: '30°C waschbar, nicht bleichen',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 42, hoeheCm: 62 },
        { size: 'M', breiteCm: 45, hoeheCm: 64 },
        { size: 'L', breiteCm: 48, hoeheCm: 66 },
        { size: 'XL', breiteCm: 51, hoeheCm: 68 },
        { size: 'XXL', breiteCm: 54, hoeheCm: 70 },
      ],
      fitRating: 30,
    },
    detailedDescription: {
      supplierBrand: 'Russell',
      productType: 'T-Shirts',
      gender: 'Damen',
      sustainability: 'Aus biologisch erzeugter Baumwolle',
      materialDetail: 'Leichter Jersey aus 100% biologisch erzeugter, gekämmter Ringspun-Baumwolle (160 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Taillierter Damen-Schnitt mit Seitennähten',
        'Schmales Rundhals-Kragenbündchen',
        'Schulter-zu-Schulter-Nackenband für mehr Stabilität',
        'Aus biologisch erzeugter Baumwolle',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('russell-ladies-authentic-t', 'black', [
      'white',
      'navy',
      'grey',
      'red',
      'royal',
      'bottle-green',
    ]),
  },
];
