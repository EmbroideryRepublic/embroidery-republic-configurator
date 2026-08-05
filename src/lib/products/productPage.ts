/**
 * Aufbereitung eines Katalogprodukts für die öffentliche Produktseite.
 *
 * Die Produktseite ist eine reine LESEANSICHT: Sie holt sich alles aus den
 * bestehenden Produktdaten und ergänzt nichts, was dort nicht steht. Damit
 * kann ein neues Produkt seine Seite ohne zusätzliche Pflege bekommen —
 * sobald es im Katalog registriert ist, existiert auch die Seite.
 *
 * Der Slug ist bewusst die Produkt-ID: Sie ist bereits eindeutig, stabil,
 * URL-tauglich und wird an vielen Stellen als Schlüssel verwendet
 * (Bestellpositionen, Lieferantenzuordnung, Druckflächen). Ein zweiter,
 * separat gepflegter Slug wäre eine weitere Quelle für Abweichungen.
 */
import { PRODUCTS, getProduct, produkteVomTyp } from '@/config/products';
import { produktTypLabel, PRODUCT_TYPES } from '@/config/products/types';
import { QUALITY_TIER_LABELS } from '@/config/qualityTiers';
import { PRINT_AREA_DATA } from '@/config/printAreaData';
import { positionLabel } from '@/config/decorationPositions';
import type { ProductConfig } from '@/config/products/types';

// Komplementäre Produktarten für „Passt dazu" liegen jetzt zentral im
// PRODUCT_TYPES-Register (Feld `komplement`) – bewusste, nachvollziehbare
// Zuordnung statt geratener Ähnlichkeit; gezeigt wird nur, was der Katalog führt.

export interface ProduktseitenDaten {
  produkt: ProductConfig;
  /** Anzeigename der Produktart, z.B. „Poloshirt". */
  artLabel: string;
  /** Anzeigename der Qualitätsstufe, z.B. „Classic". */
  stufeLabel: string;
  /** Veredelungsflächen in cm je Ansicht – aus dem hybriden Flächenmodell. */
  veredelungsflaechen: { ansicht: string; breiteCm: number; hoeheCm: number }[];
  /** Weitere Produkte derselben Art, für die Querverlinkung. */
  aehnliche: ProductConfig[];
  /** Komplementäre Produkte anderer Art („Passt dazu") für Cross-Selling. */
  empfehlungen: ProductConfig[];
}

/** Alle Slugs – Grundlage für generateStaticParams und die Sitemap. */
export function alleProduktSlugs(): string[] {
  return PRODUCTS.map((p) => p.id);
}

export function ladeProduktseite(slug: string): ProduktseitenDaten | null {
  const produkt = getProduct(slug);
  if (!produkt) return null;

  const flaechen = PRINT_AREA_DATA[produkt.id] ?? {};
  const veredelungsflaechen = Object.entries(flaechen).map(([ansicht, a]) => ({
    ansicht: positionLabel(ansicht),
    breiteCm: a!.maxWidthCm,
    hoeheCm: a!.maxHeightCm,
  }));

  const aehnliche = produkteVomTyp(produkt.productType)
    .filter((p) => p.id !== produkt.id)
    .slice(0, 4);

  // „Passt dazu": je komplementärer Produktart ein Vorschlag (günstigster
  // Vertreter), maximal vier – so bleibt die Reihe vielfältig statt viermal
  // dieselbe Art.
  const empfehlungen: ProductConfig[] = [];
  for (const typ of PRODUCT_TYPES[produkt.productType]?.komplement ?? []) {
    const kandidaten = produkteVomTyp(typ).filter((p) => p.id !== produkt.id);
    const guenstigster = kandidaten.sort((a, b) => a.basePrice - b.basePrice)[0];
    if (guenstigster) empfehlungen.push(guenstigster);
  }

  return {
    produkt,
    artLabel: produktTypLabel(produkt.productType),
    stufeLabel: QUALITY_TIER_LABELS[produkt.qualityTier],
    veredelungsflaechen,
    aehnliche,
    empfehlungen: empfehlungen.slice(0, 4),
  };
}
