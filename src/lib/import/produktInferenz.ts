/**
 * **Zentrale, lieferantenagnostische Import-Inferenz** (ADR 0004).
 *
 * Diese reinen Funktionen bilden verifizierte Rohdaten (`RohProdukt`) auf die
 * Katalog-Sachdaten ab: ID, Größen-Normalisierung, Produkttyp, Farbgruppe,
 * Materialgruppen, Geschlecht/Passform. Sie laufen **identisch für jeden
 * Lieferanten** – hier liegt bewusst KEINE lieferantenspezifische Sonderlogik.
 *
 * Reine Funktionen ohne Seiteneffekte: ausschließlich vom Build-Generator
 * (`scripts/importiereProdukte.mts`) konsumiert und im Test-Gate abgesichert
 * (`__tests__/produktInferenz.test.ts`); nichts im Runtime-Pfad importiert sie,
 * daher aus dem App-Bundle tree-geshakt.
 *
 * Grundsatz „kein Raten": Der **verifizierte Name** ist das primäre Signal, der
 * **verifizierte Swatch-Hex** der objektive Fallback. Es wird nichts erfunden.
 */
import type { Farbgruppe, MaterialGruppe, Passform } from '@/config/products/facetten';
import type { ProductType } from '@/types';

/** Die drei Basis-Geschlechter, die aus dem Namen ableitbar sind. */
export type Geschlecht3 = 'Damen' | 'Herren' | 'Unisex';

// ── ID / Slug ────────────────────────────────────────────────────────────
export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[äàáâ]/g, 'a')
    .replace(/[öòóô]/g, 'o')
    .replace(/[üùúû]/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Deterministische Produkt-ID aus der Quell-URL (Dateiname vor `.html`). */
export function idAusUrl(url: string): string {
  const m = url.match(/\/([^/]+)\.html/);
  return m && m[1] ? slug(m[1]) : slug(url);
}

// ── Größen-Notation normalisieren ──────────────────────────────────────────
// Einzelne Lieferanten schreiben „2XL" statt „XXL" o. Ä. – gleiche Größe,
// andere Schreibweise. Auf die Konfektionsreihenfolge (groessen.ts) bringen.
const SIZE_NORM: Record<string, string> = {
  '2XL': 'XXL',
  XXXL: '3XL',
  XXXXL: '4XL',
  XXXXXL: '5XL',
  XXXXXXL: '6XL',
};
export function normSize(s: string): string {
  return SIZE_NORM[s.toUpperCase()] ?? s;
}

// ── Farbe ──────────────────────────────────────────────────────────────────
export function hexToRgb(h: string): [number, number, number] {
  const x = h.replace('#', '');
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
}
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Tupel-Destrukturierung (nicht .map) bewahrt die exakten number-Typen unter
  // noUncheckedIndexedAccess.
  const [r255, g255, b255] = hexToRgb(hex);
  const r = r255 / 255,
    g = g255 / 255,
    b = b255 / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}
// Farbgruppe aus dem HSL des verifizierten Swatch-Hex (Fallback ohne Namens-
// Schlüsselwort). Achromatisch zuerst, dann nach Farbton.
export function farbgruppeAusHex(hex: string): Farbgruppe {
  const { h, s, l } = hexToHsl(hex);
  if (l >= 0.9 && s < 0.15) return 'weiss';
  if (l <= 0.13) return 'schwarz';
  if (s < 0.15) return 'grau';
  if (h >= 20 && h < 50 && (l < 0.45 || s < 0.55)) return 'braun';
  if (h >= 20 && h < 55 && l >= 0.7 && s < 0.6) return 'beige';
  if (h < 15 || h >= 345) return 'rot';
  if (h < 45) return 'orange';
  if (h < 70) return 'gelb';
  if (h < 160) return 'gruen';
  if (h < 200) return 'tuerkis';
  if (h < 255) return 'blau';
  if (h < 290) return 'lila';
  return 'rosa';
}
// Farbname-Schlüsselwörter → Grundfarbe (verifizierter Name als primäres,
// zuverlässigstes Signal). Chromatische Wörter VOR achromatischen prüfen,
// damit „Cherry Red (Heather)" rot bleibt und nicht grau.
const FARB_KEYWORDS: [RegExp, Farbgruppe][] = [
  [/turquoise|türkis|teal|aqua|cyan/, 'tuerkis'],
  [/navy|indigo|sapphire|cobalt|royal|denim|petrol|sky ?blue|powder ?blue|ocean|\bblue\b|\bblau\b|azure/, 'blau'],
  [/forest|kelly|bottle|olive|sage|lime|mint|emerald|military|hunter|\bgreen\b|\bgrün\b|\bgruen\b/, 'gruen'],
  [/orchid|violet|lilac|lavender|\bpurple\b|\blila\b|plum|aubergine|mauve/, 'lila'],
  [/heliconia|azalea|fuchsia|magenta|blush|sorbet|coral ?pink|rose|\bpink\b|\brosa\b|\brosé\b/, 'rosa'],
  [/burgundy|maroon|garnet|cranberry|wine|brick|cherry|scarlet|\bred\b|\brot\b/, 'rot'],
  [/chocolate|coffee|mocha|\bbrown\b|\bbraun\b|\bkhaki\b|walnut|hazel/, 'braun'],
  [/\bsand\b|natural|\bbeige\b|cream|ecru|stone|ivory|\btan\b|oat/, 'beige'],
  [/mustard|\bgold\b|sunflower|\byellow\b|\bgelb\b|lemon|\bmaize\b/, 'gelb'],
  [/\borange\b|apricot|peach|rust|terracotta/, 'orange'],
  [/\bwhite\b|\bweiß\b|\bweiss\b|arctic|snow/, 'weiss'],
  [/\bblack\b|\bschwarz\b|\bjet\b|onyx|\bcoal\b/, 'schwarz'],
  [/charcoal|graphite|\bash\b|heather|\bgrey\b|\bgray\b|\bgrau\b|steel|silver|slate|anthr/, 'grau'],
];
export function farbgruppeVon(name: string, hex: string): Farbgruppe {
  const n = name.toLowerCase();
  for (const [re, grp] of FARB_KEYWORDS) if (re.test(n)) return grp;
  return farbgruppeAusHex(hex);
}

// ── Material ────────────────────────────────────────────────────────────────
export function materialGruppenVon(mat: string): MaterialGruppe[] {
  const m = mat.toLowerCase();
  const g = new Set<MaterialGruppe>();
  const bio = /(bio|biologisch|organic)/.test(m);
  const recycelt = /(recycl|recycelt|recycled)/.test(m);
  const hatPoly = /polyester/.test(m);
  const hatBw = /baumwolle|cotton/.test(m);
  const baumwoll100 = /100\s*%\s*(baumwolle|cotton)|100\s*%\s*(bio|biologisch|organic)/.test(m);
  if (bio) g.add('bio-baumwolle');
  if (recycelt) g.add('recycelt');
  if (baumwoll100 && !recycelt) g.add('baumwolle-100');
  if (hatBw && hatPoly) g.add('mischgewebe');
  if (!hatBw && hatPoly) g.add('polyester');
  if (bio && hatBw && !g.has('baumwolle-100') && !g.has('mischgewebe')) g.add('baumwolle-100');
  if (g.size === 0) g.add(hatPoly ? 'polyester' : 'baumwolle-100');
  return [...g];
}

// ── Produkttyp / Geschlecht / Passform ──────────────────────────────────────
export function produktTyp(name: string, cat: string): ProductType {
  const n = name.toLowerCase();
  if (/(zip).*(hood)|(hood).*(zip)|half-?zip.*hood|quarter.*hood/.test(n)) return 'zip-hoodie';
  if (/hood/.test(n)) return 'hoodie';
  if (/long.?sleeve|longsleeve/.test(n) || cat === 'longsleeve') return 'longsleeve';
  if (/polo/.test(n) || cat === 'polo') return 'polo';
  if (/fleece|jacke|jacket/.test(n) || cat === 'fleece' || cat === 'jacket') return 'jacket';
  if (/sweat/.test(n) || cat === 'sweater') return 'sweater';
  return 'tshirt';
}
export function geschlechtVon(name: string): Geschlecht3 {
  const n = name.toLowerCase();
  if (/wom(e|a)n|ladies|damen|lady|femme/.test(n)) return 'Damen';
  if (/\bmen'?`?s?\b|herren|homme/.test(n)) return 'Herren';
  return 'Unisex';
}
/** Anzeige-Fit-Text aus dem Geschlecht. */
export function fitVon(g: Geschlecht3): string {
  return g === 'Damen' ? 'Damen, taillierter Schnitt mit Seitennähten' : 'Unisex, normale Passform';
}
/** Facetten-Passform aus dem Geschlecht (für das Facetten-Delta). */
export function passformVon(g: Geschlecht3): Passform {
  return g === 'Damen' ? 'tailliert' : 'regular';
}

// ── Markenname-Normalisierung ───────────────────────────────────────────────
// Lieferanten-Rohdaten weichen von der kanonischen Herstellerschreibweise ab
// (z. B. `SOL´S` mit Akzent-Apostroph statt `SOL'S`, `Stedman®` mit ®). Ohne
// Vereinheitlichung zersplittert dieselbe Marke in Facette/Navigation. Ein neuer
// Lieferant ergänzt hier bei Bedarf seine Schreibweise – rein additive Datentabelle.
const MARKE_NORM: Record<string, string> = {
  'SOL´S': "SOL'S",
  'Stedman®': 'Stedman',
};
export function markeNormalisieren(brand: string): string {
  return MARKE_NORM[brand] ?? brand;
}

// ── Geometrie-Klassenübernahme ──────────────────────────────────────────────
// Neues Produkt → Bestandsprodukt gleicher Klasse, dessen gemessene Druck-
// flächen übernommen werden, bis eine eigene Messung vorliegt (M4-Geometrie).
export const GEO_REP: Record<ProductType, string> = {
  tshirt: 'fotl-valueweight-t',
  longsleeve: 'fotl-original-longsleeve',
  polo: 'gildan-softstyle-polo',
  hoodie: 'justhoods-college-hoodie',
  'zip-hoodie': 'gildan-zip-hoodie',
  sweater: 'justhoods-awdis-sweat',
  jacket: 'sols-north-fleece',
  vest: 'sols-north-fleece',
};
export const TYP_LABEL: Record<ProductType, string> = {
  tshirt: 'T-Shirt',
  longsleeve: 'Longsleeve',
  polo: 'Poloshirt',
  hoodie: 'Hoodie',
  'zip-hoodie': 'Zip-Hoodie',
  sweater: 'Sweatshirt',
  vest: 'Weste',
  jacket: 'Jacke',
};
