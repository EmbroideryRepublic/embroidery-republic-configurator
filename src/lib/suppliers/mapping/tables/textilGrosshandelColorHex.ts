/**
 * VERIFIZIERTE Farb-Hex (data-key der `button.switch-to`-Swatches) je
 * textil-grosshandel-Produkt – direkt aus den Produkt-DOMs extrahiert
 * (Juli 2026, `div.swiper-slide[data-key=HEX] img` alt „…in <Name>:…" +
 * `#chosenColorName` gegengeprüft). Format je Eintrag: [Hex, exakter Shop-Name].
 *
 * KONTRASTMODELLE (Baseball/Varsity): der Shop führt jede Kontrast-Kombination
 * als EINE Einheit mit kombiniertem data-key „<HauptHex>_<KontrastHex>" (Name
 * „<Haupt>|<Kontrast>"). Das passt 1:1 auf die bestehende variant-id-Mechanik
 * (`button.switch-to[data-key="{value}"]`) – KEINE Sonderarchitektur nötig; der
 * kombinierte Key steht einfach als variantId.
 *
 * AUFNAHMEREGEL (streng, damit nichts geschätzt wird):
 *  1. EXAKTER Namenstreffer hat Vorrang: unser „navy" ⇔ Shop „Navy".
 *  2. Sonst EINDEUTIGER Einzelkandidat aus einem engen Standard-Synonymsatz,
 *     bei dem nur der Herstellername abweicht – NUR wenn es im Produkt GENAU
 *     EINEN solchen Kandidaten gibt:
 *       royal ⇔ „Royal Blue"/„Bright Royal", navy ⇔ „French Navy"/„Navy Blue"/
 *       „Oxford Navy", red ⇔ „Classic Red", black ⇔ „Deep Black"/„Black Pure"/
 *       „Black Opal"/„Jet Black", white ⇔ „Arctic White".
 *     Sobald MEHRERE gleichwertige Kandidaten existieren (z.B. AWDis „Royal
 *     Blue" UND „Bright Royal", oder „Jet Black" UND „Deep Black"), bleibt die
 *     Farbe offen (kein Raten).
 *  3. Business-Farben werden NUR nach ausdrücklicher Freigabe je Kandidat
 *     eingepflegt (keine automatische Zuordnung). Freigegeben & enthalten:
 *     kelly-green, burgundy sowie bottle-green (nur wo genau EIN „Bottle
 *     Green" existiert – Neutral/Just-Hoods-College bleiben wegen mehrerer
 *     gleichwertiger dunkler Grüns offen). NOCH offen (separate Entscheidung
 *     je Marke): grey, charcoal. pink wird von keinem TG-Produkt genutzt.
 *     Ebenso offen: die Kontrastfarben der Baseball-/Varsity-Modelle (eigene
 *     Shop-Struktur).
 *
 * Der Hex ist marken-/produktspezifisch (Gildan Navy 263147 ≠ Neutral Navy
 * 1F2A44 ≠ B&C Navy 1F2532 ≠ SOL'S Navy 07213B), deshalb je Produkt getrennt.
 * Neue Werte hier ergänzen genügt – Adapter/Resolver bleiben unverändert.
 */
import { verified } from '../resolve';
import type { ProductVariantOverride } from '../types';

/** Produkt → (interne Farb-ID → [Shop-Hex, exakter Shop-Name]). */
const HEX_BY_PRODUCT: Record<string, Record<string, readonly [string, string]>> = {
  // ── Fruit of the Loom ────────────────────────────────────────────────
  'fotl-original-vneck': { black: ['120F14', 'Black'], white: ['FFFFFF', 'White'] },
  'fotl-premium-polo': {
    black: ['120F14', 'Black'], navy: ['051734', 'Navy'], royal: ['004D9F', 'Royal Blue'],
    white: ['FFFFFF', 'White'], red: ['E61709', 'Red'], 'bottle-green': ['1E4026', 'Bottle Green'],
  },
  'fotl-ladies-premium-polo': {
    black: ['120F14', 'Black'], white: ['FFFFFF', 'White'], navy: ['051734', 'Navy'],
    red: ['E61709', 'Red'], royal: ['004D9F', 'Royal Blue'], burgundy: ['77002F', 'Burgundy'],
  },
  // KONTRASTMODELLE (Baseball): der Shop führt jede Kontrast-Kombination als
  // EINE wählbare Einheit mit kombiniertem data-key „<HauptHex>_<KontrastHex>"
  // (Name „<Haupt>|<Kontrast>"). Damit greift der bestehende variant-id-Plan
  // `button.switch-to[data-key="{value}"]` unverändert – keine Sonderlogik.
  // FOTL ist eine „saubere" Marke (nur White + Standard-Kontrast) → eindeutig.
  'fotl-baseball-t': {
    'white-navy': ['FFFFFF_000F33', 'White|Deep Navy'],
    'white-black': ['FFFFFF_120F14', 'White|Black'],
    'white-royal': ['FFFFFF_004D9F', 'White|Royal Blue'],
  },
  'fotl-baseball-longsleeve': {
    'white-navy': ['FFFFFF_000F33', 'White|Deep Navy'],
    'white-black': ['FFFFFF_120F14', 'White|Black'],
    'white-royal': ['FFFFFF_004D9F', 'White|Royal Blue'],
  },
  // ── SOL'S ────────────────────────────────────────────────────────────
  'sols-imperial-t': {
    black: ['000000', 'Deep Black'], white: ['FFFFFF', 'White'], navy: ['07213B', 'Navy'], red: ['C4082D', 'Red'],
    grey: ['8F8B8B', 'Grey Melange'],
  },
  'sols-north-fleece': {
    black: ['180F12', 'Black'], navy: ['07213B', 'Navy'], royal: ['193574', 'Royal Blue'], white: ['FFFFFF', 'White'],
    grey: ['8F8B8B', 'Grey Melange'],
  },
  // ── Gildan ───────────────────────────────────────────────────────────
  'gildan-heavy-t': {
    black: ['25282B', 'Black'], white: ['FFFFFF', 'White'], red: ['B1302A', 'Red'],
    navy: ['263147', 'Navy'], orange: ['DF6426', 'Orange'], royal: ['224D8F', 'Royal'],
    grey: ['97999B', 'Sport Grey (Heather)'], charcoal: ['66676C', 'Charcoal (Solid)'],
  },
  'gildan-softstyle-polo': {
    black: ['25282B', 'Black'], white: ['FFFFFF', 'White'], navy: ['263147', 'Navy'],
    royal: ['224D8F', 'Royal'], red: ['B1302A', 'Red'], grey: ['97999B', 'Sport Grey (Heather)'],
  },
  'gildan-vneck-t': {
    black: ['25282B', 'Black'], navy: ['263147', 'Navy'], royal: ['224D8F', 'Royal'],
    white: ['FFFFFF', 'White'], red: ['B1302A', 'Red'], grey: ['97999B', 'Sport Grey (Heather)'],
  },
  'gildan-ladies-t': {
    black: ['25282B', 'Black'], white: ['FFFFFF', 'White'], navy: ['263147', 'Navy'],
    royal: ['224D8F', 'Royal'], red: ['B1302A', 'Red'], 'kelly-green': ['009E69', 'Irish Green'],
    grey: ['97999B', 'Sport Grey (Heather)'],
  },
  'gildan-ladies-polo': {
    black: ['25282B', 'Black'], white: ['FFFFFF', 'White'], navy: ['263147', 'Navy'], royal: ['224D8F', 'Royal'],
    grey: ['97999B', 'Sport Grey (Heather)'],
  },
  // ── Russell (Marken-Namen: French Navy / Classic Red / Bright Royal) ──
  'russell-authentic-t': {
    black: ['000000', 'Black'], white: ['FFFFFF', 'White'], navy: ['021E42', 'French Navy'],
    red: ['D71925', 'Classic Red'], royal: ['1E519E', 'Bright Royal'], burgundy: ['5A032C', 'Burgundy'],
    grey: ['9DA6AB', 'Light Oxford (Heather)'],
  },
  'russell-workwear-t': {
    black: ['000000', 'Black'], navy: ['021E42', 'French Navy'], royal: ['1E519E', 'Bright Royal'],
    white: ['FFFFFF', 'White'], red: ['D71925', 'Classic Red'], 'bottle-green': ['00461C', 'Bottle Green'],
    grey: ['9DA6AB', 'Light Oxford (Heather)'],
  },
  'russell-ladies-authentic-t': {
    black: ['000000', 'Black'], white: ['FFFFFF', 'White'], navy: ['021E42', 'French Navy'],
    red: ['D71925', 'Classic Red'], royal: ['1E519E', 'Bright Royal'], 'bottle-green': ['00461C', 'Bottle Green'],
    grey: ['9DA6AB', 'Light Oxford (Heather)'],
  },
  // ── Neutral ──────────────────────────────────────────────────────────
  'neutral-classic-polo': {
    black: ['000000', 'Black'], white: ['FFFFFF', 'White'], navy: ['1F2A44', 'Navy'],
    royal: ['0033A0', 'Royal'], red: ['D50032', 'Red'], grey: ['B8B8B9', 'Sports Grey'],
  },
  'neutral-rollsleeve-t': {
    black: ['000000', 'Black'], navy: ['1F2A44', 'Navy'], white: ['FFFFFF', 'White'], burgundy: ['6C1D45', 'Bordeaux'],
    grey: ['B8B8B9', 'Sports Grey'],
  },
  // ── Just Hoods (AWDis) – meiste Farben echt mehrdeutig, daher wenig ──
  'justhoods-college-hoodie': { white: ['FFFFFF', 'Arctic White'] },
  'justhoods-zoodie': { royal: ['003594', 'Royal Blue'], burgundy: ['651C32', 'Burgundy'] },
  'justhoods-awdis-sweat': { white: ['FFFFFF', 'Arctic White'], 'kelly-green': ['009A44', 'Kelly Green'] },
  // ── B&C (Black Pure / Royal Blue) ────────────────────────────────────
  'bandc-inspire-hoodie': {
    black: ['070509', 'Black Pure'], white: ['FFFFFF', 'White'], navy: ['1F2532', 'Navy'],
    royal: ['154E8F', 'Royal Blue'], red: ['DB001B', 'Red'], burgundy: ['5B263D', 'Burgundy'],
    grey: ['B1B3B4', 'Heather Grey'],
  },
  'bandc-inspire-zip-hood': {
    black: ['070509', 'Black Pure'], white: ['FFFFFF', 'White'], navy: ['1F2532', 'Navy'],
    royal: ['154E8F', 'Royal Blue'], red: ['DB001B', 'Red'], sage: ['AAC1B3', 'Sage'],
    grey: ['B1B3B4', 'Heather Grey'],
  },
  // ── Stedman (Black Opal / Navy Blue / Bright Royal) ──────────────────
  'stedman-slimfit-t': {
    black: ['000000', 'Black Opal'], white: ['FFFFFF', 'White'], navy: ['051733', 'Navy Blue'],
    royal: ['2D428A', 'Bright Royal'], grey: ['A1A1A2', 'Grey Heather'],
  },
  // ── James+Nicholson ──────────────────────────────────────────────────
  'jn-active-t': {
    black: ['1B1B1F', 'Black'], royal: ['004985', 'Royal'], navy: ['003254', 'Navy'],
    white: ['FFFFFF', 'White'], red: ['C80A25', 'Red'], yellow: ['FFED00', 'Yellow'],
    'kelly-green': ['009A41', 'Green'],
  },
  'jn-halfzip-sweat': { black: ['1B1B1F', 'Black'], navy: ['003254', 'Navy'] },
};

/** Baut aus den Rohdaten die produktspezifischen Overrides (Label = exakter
 *  Shop-Name, variantId = Hex, als `verified` markiert). */
export const TG_PRODUCT_COLOR_OVERRIDES: Readonly<Record<string, ProductVariantOverride>> = Object.fromEntries(
  Object.entries(HEX_BY_PRODUCT).map(([productId, colors]) => [
    productId,
    {
      colors: Object.fromEntries(
        Object.entries(colors).map(([colorId, [hex, label]]) => [colorId, verified(label, { variantId: hex })])
      ),
    },
  ])
);
