import { computeBasePrice } from '@/config/pricing/marginTiers';
import { realPhotoColorSet } from './colorHelpers';
import type { ProductConfig } from './types';

/**
 * Stedman – achte externe Marke im Katalog, siehe products/index.ts für
 * das Registrierungs-Rezept künftiger Marken.
 *
 * Bild-Herkunft: AUSSCHLIESSLICH echte Fotos von Spreadshirts Bildserver
 * (image.spreadshirtmedia.net, productType=963) – dort existiert für jede
 * Farbe ein echtes, farblich passendes Foto für ALLE 4 Ansichten (Vorne,
 * Hinten, Ärmel links, Ärmel rechts), keine Umfärbung/Generierung, kein
 * Model. Siehe scripts/ingestSpreadshirtProduct.mjs. Das Kleidungsstück
 * selbst wird über einen Großhändler bezogen (z.B. textil-grosshandel.eu,
 * Artikel S2010).
 *
 * purchasePrice ist eine grobe Schätzung aus dem Großhandelspreis
 * (ab 3,22€ zzgl. USt für Größen S-XXL) – keine endgültige Kalkulation.
 */

const SLIMFIT_T_PURCHASE_PRICE = 3.22;

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'stedman-slimfit-t',
    views: ["front","back","sleeve_left","sleeve_right"],
    name: 'Classic-T Fitted',
    brand: 'Stedman',
    productType: 'tshirt',
    qualityTier: 'basic',
    purchasePrice: SLIMFIT_T_PURCHASE_PRICE,
    basePrice: computeBasePrice(SLIMFIT_T_PURCHASE_PRICE, 'basic'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tagline: 'Figurbetontes T-Shirt für einen sportlichen Look',
    material: '100% Baumwolle (außer Grau meliert: 85% Baumwolle, 15% Viskose)',
    weightGsm: 155,
    fit: 'Figurbetont, fällt klein aus',
    description:
      'Figurbetontes T-Shirt für Männer mit schmaler Silhouette und sportlicher Passform – ideal für alle, die es körperbetont mögen. Fällt eine Nummer kleiner aus als klassische Schnitte.',
    certifications: [],
    careInstructions: '40°C waschbar, bügeln erlaubt',
    sizeGuide: {
      measurements: [
        { size: 'S', breiteCm: 45, hoeheCm: 69 },
        { size: 'M', breiteCm: 48, hoeheCm: 71 },
        { size: 'L', breiteCm: 51, hoeheCm: 73 },
        { size: 'XL', breiteCm: 54, hoeheCm: 75 },
        { size: 'XXL', breiteCm: 57, hoeheCm: 76 },
      ],
      fitRating: 25,
    },
    detailedDescription: {
      supplierBrand: 'Stedman',
      productType: 'T-Shirts',
      gender: 'Herren',
      sustainability: 'Standard-Baumwollproduktion',
      materialDetail: 'Leichter Single-Jersey (155 g/m²), figurbetonter Schnitt',
      countryOfOrigin: 'Bangladesch',
      bulletPoints: [
        'Figurbetonte, schmale Silhouette',
        'Fällt eine Nummer kleiner aus',
        'Rundhalsausschnitt mit Elasthan-Bündchen',
        'Leichter, sportlicher Jersey-Stoff',
      ],
    },
    // Alle 4 Ansichten sind bei jeder Farbe echte, farblich passende Fotos
    // (siehe Kommentar oben) – anders als bei den meisten anderen Marken
    // im Katalog ist hier auch die Ärmelansicht kein Kompromiss.
    colors: realPhotoColorSet('stedman-slimfit-t', 'black', [
      'white',
      'navy',
      'grey',
      'royal',
      'red',
      'olive',
      'graphite',
    ]),
  },
];
