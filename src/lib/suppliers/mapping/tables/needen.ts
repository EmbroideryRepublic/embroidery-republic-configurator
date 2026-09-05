/**
 * Variantentabelle für needen.de.
 *
 * Label = der exakte Shop-Farbname (Attribut `title` des sichtbaren
 * Swatch-Labels `label.shop-color`, identisch mit dem `data-color` des
 * zugehörigen Radios), damit die label-basierte Auswahl des NeedenAdapters
 * `label.shop-color[title="<Label>"]` trifft.
 *
 * VERIFIZIERT (Juli 2026, öffentliche Produktseiten GN182/GN647/GN960):
 * die eindeutigen Namensübereinstimmungen sind bestätigt –
 *   black→"Schwarz", white→"Weiß", navy→"Navy", royal→"Royal", red→"Red".
 *
 * NOCH NICHT verifiziert (mehrere ähnliche Shop-Töne → keine eindeutige
 * Zuordnung, darf nicht geraten werden → Nutzerentscheidung offen):
 *   grey ("Sport Grey" vs "Ash" vs "Graphite Heather" …),
 *   charcoal (kein "Charcoal"; "Dark Heather"/"Graphite Heather"),
 *   burgundy ("Kastanienbraun"?), kelly-green ("Irish Green"?),
 *   bottle-green ("Forest Green"?), pink ("Azalee"/"Light Pink"?).
 * Diese Labels bleiben unverändert; ihre Auswahl schlägt daher bewusst
 * fehl (Fail-Fast), bis die Zuordnung im Shop bestätigt ist.
 *
 * Hinweis: needens data-color-id ist PRODUKTSPEZIFISCH und wird deshalb
 * NICHT als variantId gepflegt (siehe NeedenAdapter). labelsVerified bleibt
 * false, solange nicht ALLE genutzten Farben bestätigt sind.
 */
import { verified } from '../resolve';
import type { SupplierVariantMap } from '../types';

export const needenMap: SupplierVariantMap = {
  supplierId: 'needen',
  colors: {
    // VERIFIZIERT (data-color im Shop bestätigt) → verified()
    black: verified('Schwarz'),
    white: verified('Weiß'),
    navy: verified('Navy'),
    royal: verified('Royal'),
    red: verified('Red'), // needen nutzt "Red" (engl.), nicht "Rot"
    // UNBESTÄTIGT (Kurzform-String) – mehrere ähnliche Shop-Töne, nicht
    // geraten; erscheinen im Abdeckungs-Report als noch zu verifizieren.
    // Bewusst NICHT hier aufgelöst, auch wenn productOverrides unten für
    // einzelne Produkte bereits eine eindeutige Farbe kennt: der Basis-
    // Eintrag gilt produktübergreifend, und für "grey"/"charcoal" bietet
    // nicht jedes Produkt dieselben Kandidaten an (z.B. GN960 führt gar
    // kein "Sport Grey", nur Ash/Dark Heather/Graphite Heather) – ein
    // pauschal "aufgelöster" Basiswert wäre für DIESES Produkt dann falsch.
    grey: 'Grau meliert', // "Sport Grey" vs "Ash" vs "Graphite Heather"?
    charcoal: 'Dunkelgrau meliert', // "Dark Heather"/"Graphite Heather"?
    burgundy: 'Burgundy', // "Kastanienbraun"?
    'kelly-green': 'Kelly Green', // "Irish Green"?
    'bottle-green': 'Bottle Green', // "Forest Green"?
    pink: 'Pink', // "Azalee"/"Light Pink"?
  },
  sizes: {
    // VERIFIZIERT (Zeilen-Klasse `tr.size-class-<Label>` im Shop bestätigt,
    // GN182/GN960): S/M/L/XL 1:1; unser internes „XXL" heißt bei needen „2XL".
    S: verified('S'),
    M: verified('M'),
    L: verified('L'),
    XL: verified('XL'),
    XXL: verified('2XL'),
  },
  /**
   * PRODUKTSPEZIFISCH verifiziert (live am Shop geprüft, 2026-09-05, über
   * `label.shop-color[for="farbe_<id>"]` je Produktseite – siehe
   * NeedenAdapter.ts). `variantId` ist needens `data-color-id`, damit der
   * Produkt-Link im Admin dieselbe Deep-Link-Technik wie textil-grosshandel
   * nutzen kann: `<productUrl>/c<variantId>-<beliebiger-slug>` lädt die
   * Seite bereits mit dieser Farbe ausgewählt (der Slug-Teil ist rein
   * kosmetisch und wird von needen ignoriert – geprüft mit einem bewusst
   * falschen Slug).
   *
   * Dabei zwei konkrete, bisher unentdeckte Abweichungen vom Basis-Eintrag
   * gefunden und hier korrigiert (NICHT im Basis-Eintrag, siehe Kommentar
   * dort): "grey" heißt auf beiden Produkten real "Sport Grey", nicht
   * "Grau meliert" – der Basiswert war eine ungeprüfte Näherung.
   *
   * "red" fehlt bei GN647 (gildan-ladies-vneck-t) VOLLSTÄNDIG im Sortiment
   * (Stand 2026-09-05) – kein Override möglich, bleibt bewusst auf dem
   * (dort nicht zutreffenden) Basiswert, bis der Betreiber entscheidet, wie
   * damit umzugehen ist.
   */
  productOverrides: {
    'gildan-ladies-heavy-t': {
      // GN182 – alle sechs genutzten Farben live geprüft.
      colors: {
        black: verified('Schwarz', { variantId: '20' }),
        white: verified('Weiß', { variantId: '23' }),
        navy: verified('Navy', { variantId: '2305' }),
        grey: verified('Sport Grey', { variantId: '810' }), // korrigiert: nicht "Grau meliert"
        red: verified('Red', { variantId: '2307' }),
        royal: verified('Royal', { variantId: '345' }),
        // charcoal bleibt offen: GN182 bietet "Dark Heather" (876) UND
        // "Graphite Heather" (16365) – beide ähnlich dunkel, keine
        // eindeutige Zuordnung ohne Musterware.
      },
    },
    'gildan-ladies-vneck-t': {
      // GN647 – Navy/grey/pink haben eine ANDERE ID als bei GN182 (bestätigt
      // produktspezifisch, wie im Adapter-Kommentar dokumentiert).
      colors: {
        black: verified('Schwarz', { variantId: '20' }),
        white: verified('Weiß', { variantId: '23' }),
        navy: verified('Navy', { variantId: '343' }),
        grey: verified('Sport Grey', { variantId: '106' }), // korrigiert: nicht "Grau meliert"
        pink: verified('Azalee', { variantId: '181' }), // korrigiert: nicht "Pink" – einzige Pink-Option dieses Produkts
        // red: KEIN Override – GN647 führt aktuell gar kein "Red" (siehe
        // Kommentar oben), der Basiswert 'Red' greift ins Leere.
      },
    },
    'gildan-zip-hoodie': {
      // GN960 – Navy/Royal teilen sich IDs mit GN647 bzw. GN182 (Zufall,
      // nicht verlässlich – deshalb weiterhin je Produkt einzeln gepflegt).
      colors: {
        navy: verified('Navy', { variantId: '343' }),
        red: verified('Red', { variantId: '59' }),
        royal: verified('Royal', { variantId: '345' }),
        'kelly-green': verified('Irish Green', { variantId: '152' }), // korrigiert: nicht "Kelly Green"
        burgundy: verified('Kastanienbraun', { variantId: '176' }), // korrigiert: nicht "Burgundy"
        'bottle-green': verified('Forest Green', { variantId: '175' }), // korrigiert: nicht "Bottle Green"
        // grey bleibt offen: GN960 bietet gar kein "Sport Grey", nur
        // Ash (264)/Dark Heather (188)/Graphite Heather (16365) – keine
        // eindeutige Zuordnung ohne Musterware.
      },
    },
  },
  labelsVerified: false,
};
