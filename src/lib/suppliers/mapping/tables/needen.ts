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
    // geraten; erscheinen im Abdeckungs-Report als noch zu verifizieren:
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
  labelsVerified: false,
};
