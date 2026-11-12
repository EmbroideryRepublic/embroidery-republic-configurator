/**
 * Logik der DTF-Landingpages (Marken und weitere Produktarten).
 *
 * Die TEXTE stehen in `config/seo/dtfSeiten.ts`. Hier wird daraus die Seite gebaut:
 * Katalogfakten einsetzen, Preisbeispiele rechnen. Nichts davon wird von Hand
 * eingetragen, damit es nicht veraltet.
 *
 * Fail-fast wie bei den Kategorieseiten: Ein unbekannter Platzhalter, ein nicht
 * berechenbares Beispiel oder eine Seite ohne Produkte bricht den Build ab – lieber
 * ein roter Build als eine veröffentlichte Seite mit falschem oder leerem Inhalt.
 */
import { PRODUCTS } from '@/config/products';
import type { ProductConfig } from '@/config/products/types';
import { PRODUCT_TYPE_ORDER, produktTypLabel, produktTypLabelPlural } from '@/config/products/types';
import { PRODUKTIONSTAGE, VERSANDTAGE } from '@/config/company';
import type { ProductType } from '@/types';
import { DTF_SEITEN, type DtfSeite } from '@/config/seo/dtfSeiten';
import type { KategorieBeispiel } from '@/config/seo/kategorieSeiten';
import { merkmaleVon, passt, sortiere } from '@/lib/catalog/filter';
import { LEERE_KRITERIEN, slug as filterSlug } from '@/lib/catalog/kriterien';
import { formatiereGeld } from '@/lib/format';

export { alleDtfSlugs, dtfSeiteVon, markenSeiteVon, dtfArtSeiteVon, alleMarkenSeiten } from './dtfAdresse';

// ── Produkte und Katalogfakten ──────────────────────────────────────────

/** Die lieferbaren Produkte der Seite in der Standard-Sortierung des Katalogs. */
export function dtfProdukte(seite: DtfSeite): ProductConfig[] {
  const kriterien = seite.marke
    ? { ...LEERE_KRITERIEN, marke: [filterSlug(seite.marke)] }
    : { ...LEERE_KRITERIEN, kategorie: [seite.art as ProductType] };
  const treffer = PRODUCTS.filter((p) => passt(merkmaleVon(p), kriterien));
  return sortiere(treffer, LEERE_KRITERIEN.sortierung, {});
}

export interface DtfFakten {
  produkte: ProductConfig[];
  anzahl: number;
  /** Nach Modellanzahl absteigend, dann alphabetisch. */
  marken: string[];
  /** Produktarten der Seite in der Katalogreihenfolge. */
  arten: ProductType[];
  gewichtMin?: number;
  gewichtMax?: number;
  abPreis: number;
}

export function dtfFakten(seite: DtfSeite): DtfFakten {
  const produkte = dtfProdukte(seite);
  if (produkte.length === 0) {
    throw new Error(`DTF-Seite "${seite.slug}": im Katalog gibt es keine passenden Produkte.`);
  }
  const zaehler = new Map<string, number>();
  for (const p of produkte) zaehler.set(p.brand, (zaehler.get(p.brand) ?? 0) + 1);
  const marken = [...zaehler.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
    .map(([marke]) => marke);
  const vorhandeneArten = new Set(produkte.map((p) => p.productType));
  const arten = PRODUCT_TYPE_ORDER.filter((a) => vorhandeneArten.has(a));
  const gewichte = produkte.map((p) => p.weightGsm).filter((g): g is number => typeof g === 'number');
  return {
    produkte,
    anzahl: produkte.length,
    marken,
    arten,
    gewichtMin: gewichte.length ? Math.min(...gewichte) : undefined,
    gewichtMax: gewichte.length ? Math.max(...gewichte) : undefined,
    abPreis: Math.min(...produkte.map((p) => p.basePrice)),
  };
}

/** „A, B und C" aus einer Liste. */
function listeMitUnd(eintraege: string[]): string {
  if (eintraege.length <= 1) return eintraege[0] ?? '';
  return `${eintraege.slice(0, -1).join(', ')} und ${eintraege[eintraege.length - 1]}`;
}

/** Setzt {platzhalter} ein. Unbekannte Platzhalter oder fehlende Fakten werfen. */
export function fuelleDtf(text: string, seite: DtfSeite, f: DtfFakten): string {
  const werte: Record<string, () => string> = {
    marke: () => {
      if (!seite.marke) throw new Error(`{marke} in "${seite.slug}" verwendet, die Seite hat keine Marke.`);
      return seite.marke;
    },
    artPlural: () => {
      if (!seite.art) throw new Error(`{artPlural} in "${seite.slug}" verwendet, die Seite hat keine Produktart.`);
      return produktTypLabelPlural(seite.art);
    },
    anzahl: () => String(f.anzahl),
    markenAnzahl: () => String(f.marken.length),
    marken: () => listeMitUnd(f.marken),
    marken3: () => f.marken.slice(0, 3).join(', '),
    arten: () => listeMitUnd(f.arten.map((a) => produktTypLabelPlural(a))),
    // Mit angehängtem Leerzeichen, damit der Satz entfällt, wenn kein Produkt ein Gewicht führt.
    gewichtSatz: () => {
      if (f.gewichtMin === undefined || f.gewichtMax === undefined) return '';
      return f.gewichtMin === f.gewichtMax
        ? `Das Stoffgewicht beträgt ${f.gewichtMin} g/m². `
        : `Die Stoffgewichte reichen von ${f.gewichtMin} bis ${f.gewichtMax} g/m². `;
    },
    abPreis: () => formatiereGeld(f.abPreis),
    produktion: () => `${PRODUKTIONSTAGE.von} bis ${PRODUKTIONSTAGE.bis} Werktagen`,
    versand: () => `${VERSANDTAGE.von} bis ${VERSANDTAGE.bis} Werktagen`,
  };
  return text.replace(/\{(\w+)\}/g, (treffer, name: string) => {
    const wert = werte[name];
    if (!wert) throw new Error(`Unbekannter Platzhalter ${treffer} in DTF-Text: "${text.slice(0, 60)}…"`);
    return wert();
  });
}

// ── Preisbeispiele ──────────────────────────────────────────────────────

/** Bevorzugte Art für das Preisbeispiel – das T-Shirt ist das gebräuchlichste Vergleichsteil. */
const BEISPIEL_ARTEN: ProductType[] = ['tshirt', 'polo', 'hoodie', 'longsleeve', 'zip-hoodie', 'sweater', 'jacket'];

export interface DtfBeispielWahl {
  produkt: ProductConfig;
  beispiele: KategorieBeispiel[];
}

/**
 * Wählt das günstigste Produkt der bevorzugten Art und baut zwei Beispiele:
 * ein Einzelstück und zehn Stück mit je einem Brustmotiv (ca. 10 × 10 cm) – dieselben
 * Eckdaten wie auf den Kategorieseiten, damit die Preise vergleichbar sind.
 */
/** Mehrzahl der Kleidungsarten von Kinderware (detailedDescription.productType), für die Beschriftung der Preisbeispiele. */
const KINDER_KLEIDUNG_PLURAL: Record<string, string> = {
  'T-Shirt': 'T-Shirts', Hoodie: 'Hoodies', Sweatshirt: 'Sweatshirts', 'Zip-Hoodie': 'Zip-Hoodies', Longsleeve: 'Longsleeves',
};

export function dtfBeispiele(seite: DtfSeite, f: DtfFakten): DtfBeispielWahl {
  // Die Kinderseite zeigt Kinderware; sonst die bevorzugte Erwachsenen-Art (BEISPIEL_ARTEN).
  const art = seite.art === 'kids' ? 'kids' : BEISPIEL_ARTEN.find((a) => f.arten.includes(a));
  if (!art) throw new Error(`DTF-Seite "${seite.slug}": keine Art für ein Preisbeispiel.`);
  const produkt = [...f.produkte.filter((p) => p.productType === art)].sort((a, b) => a.basePrice - b.basePrice)[0];
  if (!produkt) throw new Error(`DTF-Seite "${seite.slug}": kein Beispielprodukt.`);

  const gewuenscht = ['M', 'L', 'XL'];
  const verfuegbar = gewuenscht.filter((g) => produkt.sizes.includes(g));
  const groessen = (verfuegbar.length === 3 ? verfuegbar : produkt.sizes.slice(0, 3)) as [string, string, string];
  const [g1, g2, g3] = groessen;
  // Kinderware: „Kinderbekleidung“ ist kein zählbares Wort – die Beispiele nennen das Kleidungsstück („1 Kinder-T-Shirt“).
  const kleidung = produkt.detailedDescription?.productType ?? '';
  const teil = art === 'kids' && kleidung ? `Kinder-${kleidung}` : produktTypLabel(art);
  const teile = art === 'kids' && kleidung ? `Kinder-${KINDER_KLEIDUNG_PLURAL[kleidung] ?? kleidung}` : produktTypLabelPlural(art);
  const flaechen = [{ ansicht: 'front' as const, breiteCm: 10, hoeheCm: 10 }];
  return {
    produkt,
    beispiele: [
      {
        beschriftung: `1 ${teil} · DTF-Transferdruck, Brustmotiv (ca. 10 × 10 cm)`,
        produktId: produkt.id,
        methode: 'dtf',
        groessen: { [g1]: 1 },
        flaechen,
      },
      {
        beschriftung: `10 ${teile} · DTF-Transferdruck, Brustmotiv (ca. 10 × 10 cm)`,
        produktId: produkt.id,
        methode: 'dtf',
        groessen: { [g1]: 4, [g2]: 4, [g3]: 2 },
        flaechen,
      },
    ],
  };
}

/** Alle Seiten mit ihren Fakten – für Tests und Sitemap-Prüfungen. */
export function alleDtfSeitenMitFakten(): { seite: DtfSeite; fakten: DtfFakten }[] {
  return DTF_SEITEN.map((seite) => ({ seite, fakten: dtfFakten(seite) }));
}
