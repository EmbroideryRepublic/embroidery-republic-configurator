import { computeBasePrice } from '@/config/pricing/marginTiers';
import { realPhotoColorSet } from './colorHelpers';
import type { ProductConfig } from './types';

/**
 * Gildan – dritte externe Marke im Katalog (nach Fruit of the Loom und
 * SOL'S), siehe products/index.ts für das Registrierungs-Rezept künftiger
 * Marken.
 *
 * Bild-Herkunft: AUSSCHLIESSLICH echte Fotos von Spreadshirts Bildserver
 * (image.spreadshirtmedia.net, productType=1219) – dort existiert für jede
 * Farbe ein echtes, farblich passendes Foto für ALLE 4 Ansichten (Vorne,
 * Hinten, Ärmel links, Ärmel rechts), keine Umfärbung/Generierung, kein
 * Model. Siehe scripts/ingestSpreadshirtProduct.mjs. Das Kleidungsstück
 * selbst wird über einen Großhändler bezogen (z.B. textil-grosshandel.eu,
 * dasselbe Herstellermodell "Heavy Cotton Adult T-Shirt" / Art.-Nr. G5000).
 *
 * purchasePrice ist eine grobe Schätzung aus dem Großhandelspreis
 * (ab 2,97€ zzgl. USt für Größen S-XXL) – keine endgültige Kalkulation.
 */

const HEAVY_COTTON_PURCHASE_PRICE = 2.97;
const SOFTSTYLE_POLO_PURCHASE_PRICE = 6.25;
const VNECK_T_PURCHASE_PRICE = 3.76;
const LADIES_T_PURCHASE_PRICE = 2.69;
const LADIES_HEAVY_T_PURCHASE_PRICE = 3.29; // ab-Preis needen.de (Artikel GN182)
const LADIES_VNECK_T_PURCHASE_PRICE = 3.99; // ab-Preis needen.de (Artikel GN647)
const LADIES_POLO_PURCHASE_PRICE = 6.25; // ab-Preis textil-grosshandel.eu (Artikel G64800L)
const ZIP_HOODIE_PURCHASE_PRICE = 22.98; // ab-Preis needen.de (Artikel GN960)

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'gildan-heavy-t',
    name: 'Heavy Cotton T-Shirt',
    brand: 'Gildan',
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: HEAVY_COTTON_PURCHASE_PRICE,
    basePrice: computeBasePrice(HEAVY_COTTON_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Der Klassiker für Textildruck – schwer, formstabil, langlebig',
    material:
      '100% Baumwolle (Jersey), außer Grau meliert: 90% Baumwolle/10% Polyester, Dunkelgrau meliert: 50% Baumwolle/50% Polyester',
    weightGsm: 180,
    fit: 'Gerader Schnitt, rundgewebter Stoff ohne Seitennähte',
    description:
      'Das meistverkaufte T-Shirt weltweit für Textildruck: schwerer, formstabiler Jersey-Stoff ohne Seitennähte für einen geraden, klassischen Schnitt. Doppelt genähter Saum an Ärmeln und Bund für hohe Haltbarkeit.',
    certifications: [],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 45.7, hoeheCm: 71.1 },
        { size: 'M', breiteCm: 50.8, hoeheCm: 73.6 },
        { size: 'L', breiteCm: 55.8, hoeheCm: 76.2 },
        { size: 'XL', breiteCm: 60.9, hoeheCm: 78.7 },
        { size: 'XXL', breiteCm: 66, hoeheCm: 81.2 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'Gildan',
      productType: 'T-Shirts',
      gender: 'Unisex',
      sustainability: 'Standard-Baumwollproduktion',
      materialDetail: 'Schwerer Jersey-Stoff (180 g/m²), rundgewebt ohne Seitennähte',
      countryOfOrigin: 'Honduras/Nicaragua',
      bulletPoints: [
        'Rundgewebter Stoff ohne Seitennähte',
        'Doppelt genähter Saum an Ärmeln und Bund',
        'Klassischer, gerader Schnitt',
        'Sehr formstabil auch nach häufigem Waschen',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('gildan-heavy-t', 'black', [
      'white',
      'grey',
      'charcoal',
      'red',
      'navy',
      'orange',
      'royal',
    ]),
  },
  {
    id: 'gildan-softstyle-polo',
    name: 'Softstyle Double Piqué Polo',
    brand: 'Gildan',
    productType: 'polo',
    qualityTier: 'basic',
    purchasePrice: SOFTSTYLE_POLO_PURCHASE_PRICE,
    basePrice: computeBasePrice(SOFTSTYLE_POLO_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Weiches Piqué-Poloshirt für Freizeit und Firmenkleidung',
    material: '100% Baumwolle (Piqué), außer Grau meliert: 90% Baumwolle/10% Polyester',
    weightGsm: 177,
    fit: 'Weit geschnitten, 2-Knopfleiste, Rippstrick-Kragen und Ärmelsäume',
    description:
      'Sportlich-legeres Poloshirt mit strukturiertem Piqué-Stoff, 2-Knopfleiste und typischem Rippstrick-Kragen. Der besonders geschmeidige Stoff macht es zum vielseitigen Begleiter für Freizeit, Beruf und Teambekleidung.',
    certifications: [],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 50, hoeheCm: 70 },
        { size: 'M', breiteCm: 53, hoeheCm: 74 },
        { size: 'L', breiteCm: 56, hoeheCm: 76 },
        { size: 'XL', breiteCm: 59, hoeheCm: 79 },
        { size: 'XXL', breiteCm: 62, hoeheCm: 81 },
      ],
      fitRating: 55,
    },
    detailedDescription: {
      supplierBrand: 'Gildan',
      productType: 'Poloshirts',
      gender: 'Unisex',
      sustainability: 'Standard-Baumwollproduktion',
      materialDetail: 'Strukturierter Piqué-Stoff (177 g/m²)',
      countryOfOrigin: 'Honduras/Nicaragua',
      bulletPoints: [
        '2-Knopfleiste mit Rippstrick-Kragen',
        'Ärmelsäume aus Rippstrick',
        'Weit geschnittener, bequemer Schnitt',
        'Besonders geschmeidiger Piqué-Stoff',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('gildan-softstyle-polo', 'black', ['white', 'navy', 'grey', 'royal', 'red', 'green']),
  },
  {
    id: 'gildan-vneck-t',
    name: 'Softstyle V-Neck T-Shirt',
    brand: 'Gildan',
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: VNECK_T_PURCHASE_PRICE,
    basePrice: computeBasePrice(VNECK_T_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Weiches T-Shirt mit V-Ausschnitt für einen lässigen Look',
    material: '100% Baumwolle',
    weightGsm: 153,
    fit: 'Unisex, normale Passform',
    description:
      'Weiches, ringgesponnenes Baumwoll-T-Shirt mit V-Ausschnitt für einen lässigen, modernen Look. Schmales Rippbündchen am Kragen, Nackenband und doppelt genähter Saum sorgen für Formstabilität.',
    certifications: [],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 46, hoeheCm: 71 },
        { size: 'M', breiteCm: 51, hoeheCm: 74 },
        { size: 'L', breiteCm: 56, hoeheCm: 76 },
        { size: 'XL', breiteCm: 61, hoeheCm: 79 },
        { size: 'XXL', breiteCm: 66, hoeheCm: 81 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'Gildan',
      productType: 'T-Shirts',
      gender: 'Unisex',
      sustainability: 'Standard-Baumwollproduktion',
      materialDetail: 'Ringgesponnene Baumwolle, weicher Griff (153 g/m²)',
      countryOfOrigin: 'Honduras/Nicaragua',
      bulletPoints: [
        'V-Ausschnitt mit schmalem Rippbündchen',
        'Nackenband für mehr Komfort',
        'Doppelt genähter Saum',
        'Weicher, ringgesponnener Baumwollgriff',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('gildan-vneck-t', 'black', ['navy', 'royal', 'grey', 'white', 'red']),
  },
  {
    id: 'gildan-ladies-t',
    name: 'Softstyle Ladies T-Shirt',
    brand: 'Gildan',
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: LADIES_T_PURCHASE_PRICE,
    basePrice: computeBasePrice(LADIES_T_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Körpernah geschnittenes Damen-T-Shirt aus weicher Baumwolle',
    material: '100% Baumwolle (Grau meliert: 90% Baumwolle/10% Polyester)',
    weightGsm: 153,
    fit: 'Damen, körpernah geschnitten mit Seitennähten',
    description:
      'Körpernah geschnittenes T-Shirt für Frauen aus weicher, ringgesponnener Softstyle-Baumwolle – taillierte Silhouette mit Seitennähten, schmales Ripp-Bündchen am Rundhalsausschnitt.',
    certifications: [],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 41, hoeheCm: 64 },
        { size: 'M', breiteCm: 44, hoeheCm: 66 },
        { size: 'L', breiteCm: 47, hoeheCm: 68 },
        { size: 'XL', breiteCm: 50, hoeheCm: 70 },
        { size: 'XXL', breiteCm: 53, hoeheCm: 72 },
      ],
      fitRating: 35,
    },
    detailedDescription: {
      supplierBrand: 'Gildan',
      productType: 'T-Shirts',
      gender: 'Damen',
      sustainability: 'Standard-Baumwollproduktion',
      materialDetail: 'Ringgesponnene Softstyle-Baumwolle (153 g/m²), taillierter Schnitt',
      countryOfOrigin: 'Honduras/Nicaragua',
      bulletPoints: [
        'Körpernaher, taillierter Damen-Schnitt',
        'Seitennähte für präzise Passform',
        'Schmales Ripp-Bündchen am Rundhals',
        'Weicher Softstyle-Griff',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('gildan-ladies-t', 'black', ['white', 'navy', 'royal', 'grey', 'red', 'kelly-green']),
  },
  {
    id: 'gildan-ladies-heavy-t',
    name: 'Heavy Cotton Ladies T-Shirt',
    brand: 'Gildan',
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: LADIES_HEAVY_T_PURCHASE_PRICE,
    basePrice: computeBasePrice(LADIES_HEAVY_T_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Der Heavy-Cotton-Klassiker im taillierten Damen-Schnitt',
    material: '100% Baumwolle (Grau meliert: 90% Baumwolle/10% Polyester, Dunkelgrau meliert: 50%/50%)',
    weightGsm: 180,
    fit: 'Damen, taillierte Passform mit Seitennähten',
    description:
      'Die Damen-Variante des meistverkauften Heavy Cotton T-Shirts: gleicher schwerer, formstabiler Jersey-Stoff, aber tailliert geschnitten mit Seitennähten und halb anliegenden Ärmeln – ideal für Teams, die Herren- und Damen-Passform kombinieren.',
    certifications: [],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 43, hoeheCm: 63.5 },
        { size: 'M', breiteCm: 46, hoeheCm: 66 },
        { size: 'L', breiteCm: 49, hoeheCm: 68.5 },
        { size: 'XL', breiteCm: 52, hoeheCm: 71 },
        { size: 'XXL', breiteCm: 56, hoeheCm: 73.5 },
      ],
      fitRating: 35,
    },
    detailedDescription: {
      supplierBrand: 'Gildan',
      productType: 'T-Shirts',
      gender: 'Damen',
      sustainability: 'Standard-Baumwollproduktion',
      materialDetail: 'Schwerer Jersey-Stoff (180 g/m²), taillierter Schnitt mit Seitennähten',
      countryOfOrigin: 'Honduras/Nicaragua',
      bulletPoints: [
        'Taillierte Damen-Passform mit Seitennähten',
        'Halb anliegende Ärmel',
        'Schwerer, formstabiler Heavy-Cotton-Stoff',
        'Doppelt genähter Saum an Ärmeln und Bund',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('gildan-ladies-heavy-t', 'black', ['white', 'navy', 'grey', 'red', 'charcoal', 'royal']),
  },
  {
    id: 'gildan-ladies-vneck-t',
    name: 'Softstyle Ladies V-Neck T-Shirt',
    brand: 'Gildan',
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: LADIES_VNECK_T_PURCHASE_PRICE,
    basePrice: computeBasePrice(LADIES_VNECK_T_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Weiches Damen-T-Shirt mit femininem V-Ausschnitt',
    material: '100% Baumwolle (Grau meliert: 90% Baumwolle/10% Polyester)',
    weightGsm: 153,
    fit: 'Damen, körpernah geschnitten mit Seitennähten',
    description:
      'Damen-T-Shirt aus weicher, ringgesponnener Softstyle-Baumwolle mit femininem V-Ausschnitt – körpernah geschnitten mit Seitennähten, die V-Variante unseres Softstyle Ladies T-Shirts.',
    certifications: [],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 41, hoeheCm: 62 },
        { size: 'M', breiteCm: 44, hoeheCm: 64 },
        { size: 'L', breiteCm: 47, hoeheCm: 66 },
        { size: 'XL', breiteCm: 50, hoeheCm: 68 },
        { size: 'XXL', breiteCm: 53, hoeheCm: 70 },
      ],
      fitRating: 35,
    },
    detailedDescription: {
      supplierBrand: 'Gildan',
      productType: 'T-Shirts',
      gender: 'Damen',
      sustainability: 'Standard-Baumwollproduktion',
      materialDetail: 'Ringgesponnene Softstyle-Baumwolle (153 g/m²), V-Ausschnitt',
      countryOfOrigin: 'Honduras/Nicaragua',
      bulletPoints: [
        'Femininer V-Ausschnitt mit schmalem Bündchen',
        'Körpernaher Schnitt mit Seitennähten',
        'Weicher Softstyle-Griff',
        'Doppelt genähter Saum',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('gildan-ladies-vneck-t', 'black', ['white', 'navy', 'red', 'grey', 'pink']),
  },
  {
    id: 'gildan-ladies-polo',
    name: 'Softstyle Ladies Double Piqué Polo',
    brand: 'Gildan',
    productType: 'polo',
    qualityTier: 'basic',
    purchasePrice: LADIES_POLO_PURCHASE_PRICE,
    basePrice: computeBasePrice(LADIES_POLO_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Weiches Damen-Poloshirt mit flachem Strickkragen',
    material: '100% Baumwolle (Piqué), außer Grau meliert: 90% Baumwolle/10% Polyester',
    weightGsm: 177,
    fit: 'Damen, taillierter Schnitt mit Seitennähten, 3-Knopfleiste',
    description:
      'Die Damen-Variante des Softstyle-Polos: besonders geschmeidiger Piqué-Stoff, taillierter Schnitt mit Seitennähten, flacher Strickkragen und 3-Knopfleiste mit farblich passenden Knöpfen.',
    certifications: [],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 44, hoeheCm: 62 },
        { size: 'M', breiteCm: 47, hoeheCm: 64 },
        { size: 'L', breiteCm: 50, hoeheCm: 66 },
        { size: 'XL', breiteCm: 53, hoeheCm: 68 },
        { size: 'XXL', breiteCm: 57, hoeheCm: 70 },
      ],
      fitRating: 40,
    },
    detailedDescription: {
      supplierBrand: 'Gildan',
      productType: 'Poloshirts',
      gender: 'Damen',
      sustainability: 'Standard-Baumwollproduktion',
      materialDetail: 'Strukturierter Piqué-Stoff (177 g/m²), taillierter Schnitt',
      countryOfOrigin: 'Honduras/Nicaragua',
      bulletPoints: [
        'Taillierter Damen-Schnitt mit Seitennähten',
        '3-Knopfleiste mit passenden Knöpfen',
        'Flacher Strickkragen',
        'Besonders geschmeidiger Piqué-Stoff',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('gildan-ladies-polo', 'black', ['white', 'navy', 'grey', 'royal']),
  },
  {
    id: 'gildan-zip-hoodie',
    name: 'Heavy Blend Full-Zip Hoodie',
    brand: 'Gildan',
    productType: 'zip-hoodie',
    qualityTier: 'basic',
    purchasePrice: ZIP_HOODIE_PURCHASE_PRICE,
    basePrice: computeBasePrice(ZIP_HOODIE_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Klassische Kapuzenjacke mit durchgehendem Reißverschluss',
    material: '50% Baumwolle, 50% Polyester (Fleece, innen angeraut)',
    weightGsm: 271,
    fit: 'Unisex, gerader Schnitt, Kapuze mit Kordelzug',
    description:
      'Die Zip-Variante des Heavy-Blend-Hoodies: schwerer, innen angerauter Fleece-Stoff, durchgehender Reißverschluss, gefütterte Kapuze mit Kordelzug und geteilte Kängurutaschen – ein Klassiker für Teams und Vereine.',
    certifications: [],
    careInstructions: '40°C waschbar',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 51, hoeheCm: 68.5 },
        { size: 'M', breiteCm: 56, hoeheCm: 71 },
        { size: 'L', breiteCm: 61, hoeheCm: 73.5 },
        { size: 'XL', breiteCm: 66, hoeheCm: 76 },
        { size: 'XXL', breiteCm: 71, hoeheCm: 78.5 },
      ],
      fitRating: 55,
    },
    detailedDescription: {
      supplierBrand: 'Gildan',
      productType: 'Sweatjacken',
      gender: 'Unisex',
      sustainability: 'Standard-Produktion',
      materialDetail: 'Schwerer Heavy-Blend-Fleece (271 g/m²), innen angeraut',
      countryOfOrigin: 'Honduras/Nicaragua',
      bulletPoints: [
        'Durchgehender Reißverschluss',
        'Gefütterte Kapuze mit Kordelzug',
        'Geteilte Kängurutaschen',
        'Innen angerauter Fleece-Stoff',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben); Schwarz bietet die Bildquelle für dieses
    // Modell nicht an, daher ist Navy die Ankerfarbe.
    colors: realPhotoColorSet('gildan-zip-hoodie', 'navy', ['grey', 'red', 'royal', 'kelly-green', 'burgundy', 'bottle-green']),
  },
];
