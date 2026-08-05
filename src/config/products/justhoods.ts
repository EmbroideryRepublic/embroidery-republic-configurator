import { computeBasePrice } from '@/config/pricing/marginTiers';
import { realPhotoColorSet } from './colorHelpers';
import type { ProductConfig } from './types';

/**
 * Just Hoods (by AWDis) – sechste externe Marke im Katalog und erste
 * Hoodie-Kategorie, siehe products/index.ts für das Registrierungs-Rezept
 * künftiger Marken.
 *
 * Bild-Herkunft: AUSSCHLIESSLICH echte Fotos von Spreadshirts Bildserver
 * (image.spreadshirtmedia.net, productType=1047) – dort existiert für jede
 * Farbe ein echtes, farblich passendes Foto für ALLE 4 Ansichten (Vorne,
 * Hinten, Ärmel links, Ärmel rechts) – bei diesem Produkt sind Ansicht 3/4
 * sogar echte Ganzkörper-Seitenprofile (nicht nur Schulter-Nahaufnahmen wie
 * bei den T-Shirts/Polos), keine Umfärbung/Generierung, kein Model. Siehe
 * scripts/ingestSpreadshirtProduct.mjs. Das Kleidungsstück selbst wird über
 * einen Großhändler bezogen (z.B. textil-grosshandel.eu, Artikel JH001).
 *
 * purchasePrice ist eine grobe Schätzung aus dem Großhandelspreis
 * (ab 14,40€ zzgl. USt für Größen S-XXL) – keine endgültige Kalkulation.
 */

const COLLEGE_HOODIE_PURCHASE_PRICE = 14.4;
const ZOODIE_PURCHASE_PRICE = 18.95;
const AWDIS_SWEAT_PURCHASE_PRICE = 10.74;
const CONTRAST_HOODIE_PURCHASE_PRICE = 16.5;
const QUARTERZIP_SWEAT_PURCHASE_PRICE = 17.5;

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'justhoods-college-hoodie',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: 'College Hoodie',
    brand: 'Just Hoods',
    productType: 'hoodie',
    qualityTier: 'basic',
    purchasePrice: COLLEGE_HOODIE_PURCHASE_PRICE,
    basePrice: computeBasePrice(COLLEGE_HOODIE_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Der klassische Kapuzenpullover für Freizeit und Teambekleidung',
    material: '80% Baumwolle, 20% Polyester (Anthrazit: 52%/48%, Hellgrau meliert: 75%/25%)',
    weightGsm: 280,
    fit: 'Unisex, normale Passform, Kängurutasche',
    description:
      'Der klassische College-Hoodie: weicher, angerauter Innenfleece, doppellagige Kapuze mit farblich passenden Kordeln, Kängurutasche und Rippstrick an Bund und Ärmeln. Vielseitig einsetzbar für Freizeit, Teams und Firmenbekleidung.',
    certifications: [],
    careInstructions: '40°C waschbar, nicht bleichen',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 51, hoeheCm: 67 },
        { size: 'M', breiteCm: 56, hoeheCm: 70 },
        { size: 'L', breiteCm: 61, hoeheCm: 73 },
        { size: 'XL', breiteCm: 65, hoeheCm: 76 },
        { size: 'XXL', breiteCm: 69, hoeheCm: 79 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'Just Hoods (AWDis)',
      productType: 'Hoodies',
      gender: 'Unisex',
      sustainability: 'Standard-Baumwoll-/Polyester-Mischung',
      materialDetail: 'Angerauter Innenfleece, doppellagige Kapuze (280 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Doppellagige Kapuze mit farblich passenden Kordeln',
        'Kängurutasche',
        'Rippstrick an Bund und Ärmeln',
        'Weicher, angerauter Innenfleece',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – die Ärmel-/Seitenansicht ist hier sogar ein
    // echtes Ganzkörper-Seitenprofil, kein Schulter-Ausschnitt.
    colors: realPhotoColorSet('justhoods-college-hoodie', 'black', [
      'white',
      'navy',
      'grey',
      'royal',
      'red',
      'bottle-green',
    ]),
  },
  {
    id: 'justhoods-zoodie',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: 'Zoodie',
    brand: 'Just Hoods',
    productType: 'zip-hoodie',
    qualityTier: 'basic',
    purchasePrice: ZOODIE_PURCHASE_PRICE,
    basePrice: computeBasePrice(ZOODIE_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Der klassische Reißverschluss-Hoodie für Sport, Freizeit und Team',
    material: '80% Baumwolle, 20% Polyester (Anthrazit: 52%/48%, Hellgrau meliert: 75%/25%)',
    weightGsm: 280,
    fit: 'Unisex, normale Passform, Kängurutaschen',
    description:
      'Die perfekte Begleiterin für Sport, Spiel und Freizeit: doppellagige Kapuze mit gleichfarbiger Kordel, zwei aufgesetzte Taschen, durchgehender verdeckter Reißverschluss und weiches, gebürstetes Innenvlies.',
    certifications: [],
    careInstructions: '40°C waschbar, nicht bleichen',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 51, hoeheCm: 67 },
        { size: 'M', breiteCm: 56, hoeheCm: 70 },
        { size: 'L', breiteCm: 61, hoeheCm: 73 },
        { size: 'XL', breiteCm: 65, hoeheCm: 76 },
        { size: 'XXL', breiteCm: 69, hoeheCm: 79 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'Just Hoods (AWDis)',
      productType: 'Zip-Hoodies',
      gender: 'Unisex',
      sustainability: 'Standard-Baumwoll-/Polyester-Mischung',
      materialDetail: 'Angerauter Innenfleece, doppellagige Kapuze (280 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Durchgehender, verdeckter Reißverschluss',
        'Doppellagige Kapuze mit gleichfarbiger Kordel',
        'Zwei aufgesetzte Kängurutaschen',
        'Weiches, gebürstetes Innenvlies',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – die Ärmel-/Seitenansicht ist hier sogar ein
    // echtes Ganzkörper-Seitenprofil mit sichtbarem Reißverschluss.
    colors: realPhotoColorSet('justhoods-zoodie', 'black', ['navy', 'royal', 'grey', 'burgundy', 'anthracite', 'green']),
  },
  {
    id: 'justhoods-awdis-sweat',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: 'AWDis Sweat',
    brand: 'Just Hoods',
    productType: 'sweater',
    qualityTier: 'basic',
    purchasePrice: AWDIS_SWEAT_PURCHASE_PRICE,
    basePrice: computeBasePrice(AWDIS_SWEAT_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Der klassische Rundhals-Sweater für Freizeit und Team',
    material: '80% Baumwolle, 20% Polyester',
    weightGsm: 280,
    fit: 'Unisex, normale Passform',
    description:
      'Wohlig warmer Klassiker mit Rundhalsausschnitt: strapazierfähiger, angerauter Innenfleece, Rippstrick an Bund und Ärmeln – der vielseitige Allrounder für Freizeit, Sport und Team.',
    certifications: [],
    careInstructions: '40°C waschbar, nicht bleichen',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 52, hoeheCm: 68 },
        { size: 'M', breiteCm: 56, hoeheCm: 71 },
        { size: 'L', breiteCm: 60, hoeheCm: 74 },
        { size: 'XL', breiteCm: 64, hoeheCm: 77 },
        { size: 'XXL', breiteCm: 68, hoeheCm: 80 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'Just Hoods (AWDis)',
      productType: 'Sweater',
      gender: 'Unisex',
      sustainability: 'Standard-Baumwoll-/Polyester-Mischung',
      materialDetail: 'Angerauter Innenfleece, Rundhalsausschnitt (280 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Rundhalsausschnitt',
        'Rippstrick an Bund und Ärmeln',
        'Strapazierfähiger, angerauter Innenfleece',
        'Vielseitig einsetzbar für Freizeit und Team',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – die Ärmel-/Seitenansicht ist hier sogar ein
    // echtes Ganzkörper-Seitenprofil.
    colors: realPhotoColorSet('justhoods-awdis-sweat', 'black', ['white', 'navy', 'red', 'royal', 'grey', 'kelly-green']),
  },
  {
    id: 'justhoods-contrast-hoodie',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: 'Kontrast-Hoodie',
    brand: 'Just Hoods',
    productType: 'hoodie',
    qualityTier: 'basic',
    purchasePrice: CONTRAST_HOODIE_PURCHASE_PRICE,
    basePrice: computeBasePrice(CONTRAST_HOODIE_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Hoodie mit zweifarbiger Kontrastkapuze und -kordel',
    material: '80% Baumwolle, 20% Polyester',
    weightGsm: 280,
    fit: 'Unisex, normale Passform',
    description:
      'Der auffällige Zwilling des College Hoodie: Kontrastfarbene Kapuzeninnenseite und passende Kordeln setzen einen echten Farbakzent. Kängurutasche und Rippstrick an Bund und Ärmeln wie beim Klassiker.',
    certifications: [],
    careInstructions: '40°C waschbar, nicht bleichen',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 51, hoeheCm: 67 },
        { size: 'M', breiteCm: 56, hoeheCm: 70 },
        { size: 'L', breiteCm: 61, hoeheCm: 73 },
        { size: 'XL', breiteCm: 65, hoeheCm: 76 },
        { size: 'XXL', breiteCm: 69, hoeheCm: 79 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'Just Hoods (AWDis)',
      productType: 'Hoodies',
      gender: 'Unisex',
      sustainability: 'Standard-Baumwoll-/Polyester-Mischung',
      materialDetail: 'Angerauter Innenfleece, zweifarbige Kapuze (280 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Zweifarbige Kapuzeninnenseite und Kordeln',
        'Kängurutasche',
        'Rippstrick an Bund und Ärmeln',
        'Auffälliger Farbkontrast',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – die Ärmel-/Seitenansicht ist hier sogar ein
    // echtes Ganzkörper-Seitenprofil.
    colors: realPhotoColorSet('justhoods-contrast-hoodie', 'navy-grey', [
      'black-red',
      'grey-navy',
      'burgundy-anthracite',
      'red-white',
    ]),
  },
  {
    id: 'justhoods-quarterzip-sweat',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: '1/4 Zip Sweat',
    brand: 'Just Hoods',
    productType: 'zip-hoodie',
    qualityTier: 'basic',
    purchasePrice: QUARTERZIP_SWEAT_PURCHASE_PRICE,
    basePrice: computeBasePrice(QUARTERZIP_SWEAT_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Sportlicher Sweater mit kurzem Reißverschluss am Kragen',
    material: '80% ringgesponnene Baumwolle, 20% Polyester',
    weightGsm: 280,
    fit: 'Unisex, normale Passform',
    description:
      'Kurzer Reißverschluss am Stehkragen für flexible Belüftung – der Quarter-Zip-Sweater aus ringgesponnener Baumwolle mit weichem Innenfleece und Rippstrick-Bündchen ist der sportliche Allrounder für Freizeit und Team.',
    certifications: [],
    careInstructions: '40°C waschbar, nicht bleichen',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 51, hoeheCm: 64.5 },
        { size: 'M', breiteCm: 56, hoeheCm: 70 },
        { size: 'L', breiteCm: 61, hoeheCm: 73 },
        { size: 'XL', breiteCm: 65, hoeheCm: 76 },
        { size: 'XXL', breiteCm: 69, hoeheCm: 79 },
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: 'Just Hoods (AWDis)',
      productType: 'Zip-Hoodies',
      gender: 'Unisex',
      sustainability: 'Ringgesponnene Baumwolle',
      materialDetail: 'Weicher Innenfleece, Stehkragen mit kurzem Reißverschluss (280 g/m²)',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Kurzer Reißverschluss am Stehkragen',
        'Metall-Reißverschluss mit Anhänger',
        'Rippstrick-Bündchen an Ärmeln und Bund',
        'Weicher, angerauter Innenfleece',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – die Ärmel-/Seitenansicht ist hier sogar ein
    // echtes Ganzkörper-Seitenprofil.
    colors: realPhotoColorSet('justhoods-quarterzip-sweat', 'grey', ['black', 'anthracite']),
  },
];
