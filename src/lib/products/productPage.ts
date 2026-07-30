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
import { PRODUCTS, getProduct } from '@/config/products';
import { PRODUCT_TYPE_LABELS } from '@/config/products/types';
import { QUALITY_TIER_LABELS } from '@/config/qualityTiers';
import { PRINT_AREA_DATA } from '@/config/printAreaData.generated';
import type { ProductConfig } from '@/config/products/types';
import type { ProductType } from '@/types';

/**
 * Komplementäre Produktarten für die Cross-Selling-Empfehlung „Passt dazu".
 *
 * Bewusst eine feste, nachvollziehbare Zuordnung statt einer geratenen
 * „Ähnlichkeit": Wer ein T-Shirt veredeln lässt, braucht oft denselben Print
 * auf einem Hoodie oder Polo (Team-/Firmenausstattung). Es wird nichts
 * erfunden – gezeigt wird nur, was der Katalog tatsächlich führt.
 */
const KOMPLEMENT: Partial<Record<ProductType, ProductType[]>> = {
  tshirt: ['hoodie', 'polo', 'sweater'],
  polo: ['tshirt', 'sweater', 'jacket'],
  hoodie: ['tshirt', 'zip-hoodie', 'sweater'],
  'zip-hoodie': ['hoodie', 'tshirt', 'jacket'],
  sweater: ['tshirt', 'hoodie', 'longsleeve'],
  longsleeve: ['tshirt', 'hoodie', 'sweater'],
  jacket: ['hoodie', 'sweater', 'vest'],
  vest: ['tshirt', 'jacket', 'hoodie'],
};

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

const ANSICHT_LABELS: Record<string, string> = {
  front: 'Vorderseite',
  back: 'Rückseite',
  sleeve_left: 'Ärmel links',
  sleeve_right: 'Ärmel rechts',
};

/** Alle Slugs – Grundlage für generateStaticParams und die Sitemap. */
export function alleProduktSlugs(): string[] {
  return PRODUCTS.map((p) => p.id);
}

export function ladeProduktseite(slug: string): ProduktseitenDaten | null {
  const produkt = getProduct(slug);
  if (!produkt) return null;

  const flaechen = PRINT_AREA_DATA[produkt.id] ?? {};
  const veredelungsflaechen = Object.entries(flaechen).map(([ansicht, a]) => ({
    ansicht: ANSICHT_LABELS[ansicht] ?? ansicht,
    breiteCm: a!.maxWidthCm,
    hoeheCm: a!.maxHeightCm,
  }));

  const aehnliche = PRODUCTS.filter(
    (p) => p.id !== produkt.id && p.productType === produkt.productType
  ).slice(0, 4);

  // „Passt dazu": je komplementärer Produktart ein Vorschlag (günstigster
  // Vertreter), maximal vier – so bleibt die Reihe vielfältig statt viermal
  // dieselbe Art.
  const empfehlungen: ProductConfig[] = [];
  for (const typ of KOMPLEMENT[produkt.productType] ?? []) {
    const kandidaten = PRODUCTS.filter((p) => p.productType === typ && p.id !== produkt.id);
    const guenstigster = kandidaten.sort((a, b) => a.basePrice - b.basePrice)[0];
    if (guenstigster) empfehlungen.push(guenstigster);
  }

  return {
    produkt,
    artLabel: PRODUCT_TYPE_LABELS[produkt.productType],
    stufeLabel: QUALITY_TIER_LABELS[produkt.qualityTier],
    veredelungsflaechen,
    aehnliche,
    empfehlungen: empfehlungen.slice(0, 4),
  };
}
