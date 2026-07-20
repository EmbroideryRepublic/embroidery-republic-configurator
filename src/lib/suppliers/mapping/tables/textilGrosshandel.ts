/**
 * Variantentabelle für textil-grosshandel.eu.
 *
 * Enthält alle Farb-IDs und Größen, die aktuell von Katalogprodukten mit
 * diesem Lieferanten verwendet werden (Stand siehe Arbeitsprotokoll). Die
 * Label-Strings sind für den deutschsprachigen Shop als Näherung aus
 * unseren Anzeigenamen abgeleitet und noch NICHT im realen Shop verifiziert
 * → labelsVerified: false. Die Existenzprüfung funktioniert unabhängig
 * davon (sie stützt sich auf die Schlüssel, nicht die Werte).
 *
 * Erweiterung: neue Farbe/Größe eines künftigen Produkts hier als Zeile
 * ergänzen; abweichende Artikelnummer über articleNumberByProduct.
 */
import { verified } from '../resolve';
import { TG_PRODUCT_COLOR_OVERRIDES } from './textilGrosshandelColorHex';
import type { SupplierVariantMap } from '../types';

export const textilGrosshandelMap: SupplierVariantMap = {
  supplierId: 'textil-grosshandel',
  colors: {
    // einfarbig
    anthracite: 'Anthrazit',
    black: 'Schwarz',
    'bottle-green': 'Bottle Green',
    burgundy: 'Burgundy',
    charcoal: 'Dunkelgrau meliert',
    graphite: 'Graphite',
    green: 'Grün',
    grey: 'Grau meliert',
    'kelly-green': 'Kelly Green',
    navy: 'Navy',
    // ── Am realen Shop VERIFIZIERT (Juli 2026) ─────────────────────────
    // Aus den Farb-Swatches der FOTL-Produktseiten ausgelesen
    // (`div.swiper-slide[data-key=HEX] img` alt „… in <Name>: …").
    // Jeweils EINDEUTIG: pro Produktseite gab es genau einen Kandidaten.
    azure: verified('Azure Blue', { variantId: '0076AD' }),
    cranberry: verified('Cranberry', { variantId: 'A1224E' }),
    'deep-navy': verified('Deep Navy', { variantId: '000F33' }),
    'heather-grey': verified('Heather Grey', { variantId: 'D4D9DC' }),
    natural: verified('Natural', { variantId: 'FFFAD9' }),
    sand: verified('Desert Sand', { variantId: 'DFC8B7' }),
    olive: 'Olive',
    orange: 'Orange',
    red: 'Rot',
    royal: 'Royal',
    sage: 'Sage',
    white: 'Weiß',
    yellow: 'Yellow',
    // zweifarbig (Kontrast-/Baseball-Modelle)
    'black-red': 'Schwarz/Rot',
    'burgundy-anthracite': 'Weinrot/Anthrazit',
    'grey-navy': 'Grau meliert/Navy',
    'navy-grey': 'Navy/Grau meliert',
    'red-white': 'Rot/Weiß',
    'white-black': 'Weiß/Schwarz',
    'white-navy': 'Weiß/Navy',
    'white-royal': 'Weiß/Royalblau',
  },
  sizes: {
    // VERIFIZIERT (td.cell-size im Shop bestätigt, G5000): 1:1, inkl. „XXL".
    S: verified('S'),
    M: verified('M'),
    L: verified('L'),
    XL: verified('XL'),
    XXL: verified('XXL'),
  },
  /**
   * PRODUKTSPEZIFISCHE Farb-Hex (variantId) – TG wählt Farben über
   * `button.switch-to[data-key="<HEX>"]`; der Hex variiert je Marke/Produkt
   * und gehört daher hierher, nicht in die per-Lieferant-Tabelle oben. Die
   * verifizierten Werte je Produkt stehen (mit Aufnahmeregel) in
   * textilGrosshandelColorHex.ts. Farben ohne Override fallen auf den
   * per-Lieferant-Default (nur Label, kein Hex) → Farbwahl schlägt bewusst
   * fehl (blocked), bis der Hex verifiziert bzw. die mehrdeutige Farbe
   * entschieden ist.
   */
  productOverrides: TG_PRODUCT_COLOR_OVERRIDES,
  labelsVerified: false,
};
