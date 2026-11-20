/**
 * Direktlinks zum Einkauf: Aus einem bestellten Produkt wird der Link zum Artikel beim Lieferanten.
 *
 * Der Betreiber bestellt die Rohware nach Kundeneingang von Hand – beim Textil-Großhandel oder im L-Shop, je nachdem, wo es
 * günstiger ist (siehe docs/kalkulationsmodell.md). Dafür muss er zu jeder Position SOFORT sehen, welches Produkt (Artikelnummer),
 * in welcher Farbe und Größe zu bestellen ist, und mit einem Klick dort landen. Die Daten stehen in
 * bezugsquellen.generated.ts; hier wird nur daraus gebaut. Rein (kein Netz, keine Datenbank) und deshalb voll testbar.
 *
 * Die L-Shop-Links führen auf die Suche nach der Artikelnummer; der L-Shop zeigt Preise und Bestellung nur im angemeldeten
 * Konto des Betreibers (im eigenen Browser) – hier wird keine Anmeldung benötigt und keine gespeichert.
 */
import { BEZUGSQUELLEN } from './bezugsquellen.generated';

export interface BestellLink {
  quelle: 'textil-grosshandel' | 'l-shop' | 'andere';
  /** Beschriftung des Links, z. B. „Textil-Großhandel“. */
  label: string;
  url: string;
}

export interface Bestellhilfe {
  /** Artikelnummer beim Lieferanten (null = Produkt unbekannt). */
  artikelnummer: string | null;
  links: BestellLink[];
  /** Erklärung, wenn es keinen direkten Link gibt oder etwas zu beachten ist. */
  hinweis?: string;
}

const TG_SUCHE = 'https://www.textil-grosshandel.eu/search?q=';
const LSHOP_SUCHE = 'https://shop.l-shop-team.de/index.php?cl=search&searchparam=';

export function lshopSuchUrl(artikelnummer: string): string {
  return LSHOP_SUCHE + encodeURIComponent(artikelnummer);
}

export function textilGrosshandelSuchUrl(artikelnummer: string): string {
  return TG_SUCHE + encodeURIComponent(artikelnummer);
}

/** Alle Links und Hinweise zum Einkauf EINES Katalogprodukts. */
export function bestellhilfe(productId: string): Bestellhilfe {
  const quelle = BEZUGSQUELLEN[productId];
  if (!quelle) {
    return {
      artikelnummer: null,
      links: [],
      hinweis: 'Für dieses Produkt ist noch keine Bezugsquelle hinterlegt (lib/suppliers/bezugsquellen.generated.ts).',
    };
  }

  const links: BestellLink[] = [];
  if (quelle.tg) links.push({ quelle: 'textil-grosshandel', label: 'Textil-Großhandel', url: quelle.tg });
  if (quelle.lshop) links.push({ quelle: 'l-shop', label: 'L-Shop', url: lshopSuchUrl(quelle.art) });
  if (quelle.andere) links.push({ quelle: 'andere', label: quelle.andere.label, url: quelle.andere.url });

  let hinweis: string | undefined;
  if (!quelle.tg && !quelle.andere) {
    if (quelle.lshop) {
      hinweis = 'Beim Textil-Großhandel zurzeit nicht gelistet – nur im L-Shop zu finden.';
    } else {
      hinweis = 'Bei Textil-Großhandel und L-Shop zurzeit nicht gelistet – bitte Bezugsquelle klären.';
      links.push({ quelle: 'textil-grosshandel', label: 'Textil-Großhandel: Suche', url: textilGrosshandelSuchUrl(quelle.art) });
    }
  }
  return { artikelnummer: quelle.art, links, ...(hinweis ? { hinweis } : {}) };
}

/** „M×2, L×3“ – nur Größen mit Stückzahl, in der Reihenfolge der Eingabe. */
export function groessenText(sizeQuantities: Record<string, number>): string {
  return Object.entries(sizeQuantities)
    .filter(([, menge]) => menge > 0)
    .map(([groesse, menge]) => `${groesse}×${menge}`)
    .join(', ');
}
