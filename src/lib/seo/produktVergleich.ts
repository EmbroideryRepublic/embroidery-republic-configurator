/**
 * „Im Vergleich“ und „Druckfläche je Größe“ einer Produktseite – vollständig aus den Katalogdaten berechnet.
 *
 * Warum: Search Console (26.11.2026): Google hat 8 Produktseiten gelesen und nicht aufgenommen; der Median der Produktseiten hat nur
 * rund 22 % Text, der auf keiner anderen Seite steht. „Auf einen Blick“ (produktFakten.ts) liefert die Eckdaten des Modells. Dieser
 * Baustein ergänzt, was Besucher bei der Auswahl wirklich brauchen und was nur diese Seite hat: Worin unterscheidet sich das Modell von
 * seinen nächsten Alternativen, und wie groß darf das Motiv auf welcher Größe sein?
 *
 * Nur belegte Aussagen: Jede Zahl stammt aus Produktdaten (Gewicht, Farben, Größen, Zertifikate, Grundpreis „ab“) oder den erzeugten
 * Druckflächendaten; verglichen wird ausschließlich mit dem eigenen Sortiment. Keine Wertungen („besser“, „beliebt“), keine Marktaussagen.
 * Preise sind die Textil-Grundpreise, die auch auf der Produktseite stehen – diese Datei ändert keine Preislogik.
 *
 * Reine Funktion, kein Netz, keine Datenbank. Stickerei kommt nicht vor.
 */
import { PRODUCTS } from '@/config/products';
import type { ProductConfig } from '@/config/products/types';
import { produktTypLabel } from '@/config/products/types';
import type { ProductType } from '@/types';
import { flacheBreiteCm, rundeMassCm } from '@/config/abwicklung';
import { PRINT_AREA_DATA_DTF } from '@/config/printAreaData';
import { formatiereGeld } from '@/lib/format';

/** Wie viele Alternativen die Tabelle zeigt. */
export const ANZAHL_ALTERNATIVEN = 3;

export interface VergleichsModell {
  id: string;
  name: string;
  marke: string;
  gewichtGsm: number | null;
  /** Material ohne die Ausnahmen je Farbgruppe („100 % Baumwolle“). */
  material: string;
  farben: number;
  /** Zertifikate laut Katalog, leer = keine Angabe. */
  zertifikate: string[];
  /** „S–5XL“ */
  groessen: string;
  /** Grundpreis „ab“ (Textil, ohne Veredelung) – derselbe Wert wie auf der Produktseite. */
  abPreis: number;
}

export interface VergleichsAussage {
  id: string;
  name: string;
  marke: string;
  /** Ein Satz, der nur die tatsächlichen Unterschiede nennt. */
  satz: string;
}

export interface DruckflaechenZeile {
  groesse: string;
  /** Flache Breite des Kleidungsstücks laut Größentabelle (cm). */
  kleidungBreiteCm: number | null;
  vorne: { breiteCm: number; hoeheCm: number } | null;
  hinten: { breiteCm: number; hoeheCm: number } | null;
  /** Anteil der größten Frontfläche an der Kleidungsbreite in Prozent (gerundet), sofern beides bekannt ist. */
  anteilBreiteProzent: number | null;
}

export interface ProduktVergleich {
  /** Erste Zeile = dieses Modell, danach die Alternativen. */
  modelle: VergleichsModell[];
  aussagen: VergleichsAussage[];
  druckflaechen: DruckflaechenZeile[];
}

function materialKurz(p: ProductConfig): string {
  return (p.material.split('(')[0] ?? p.material).trim().replace(/\s*,\s*$/, '');
}

function groessenSpanne(sizes: string[]): string {
  const erste = sizes[0];
  const letzte = sizes[sizes.length - 1];
  if (!erste) return '';
  return erste === letzte ? erste : `${erste}–${letzte}`;
}

export function alsVergleichsModell(p: ProductConfig): VergleichsModell {
  return {
    id: p.id,
    name: p.name,
    marke: p.brand,
    gewichtGsm: typeof p.weightGsm === 'number' && p.weightGsm > 0 ? p.weightGsm : null,
    material: materialKurz(p),
    farben: p.colors.length,
    zertifikate: [...p.certifications],
    groessen: groessenSpanne(p.sizes),
    abPreis: p.basePrice,
  };
}

/** Nächstverwandte Arten – nur Lückenfüller, wenn eine Art zu wenige eigene Modelle hat (z. B. nur zwei Sweater im Sortiment). */
const VERWANDTE_ARTEN: Partial<Record<ProductType, ProductType[]>> = {
  sweater: ['hoodie'],
  hoodie: ['sweater', 'zip-hoodie'],
  'zip-hoodie': ['hoodie', 'jacket'],
};

/** Schnitt: „Damen“ gilt als eigene Gruppe, damit ein Herren-Polo nicht mit einem Damen-Polo verglichen wird. */
function schnitt(p: ProductConfig): 'damen' | 'kinder' | 'andere' {
  const g = (p.detailedDescription?.gender ?? '').toLowerCase();
  if (g.includes('damen')) return 'damen';
  if (g.includes('kind')) return 'kinder';
  return 'andere';
}

/**
 * Die nächsten Alternativen: gleiche Art, gleicher Schnitt, nach Gewichtsnähe (ohne Gewicht: nach Preisnähe). Zuerst je eine Marke, damit
 * die Tabelle nicht dreimal dieselbe Marke zeigt; fehlen Marken, wird mit den nächsten Modellen aufgefüllt.
 */
export function waehleAlternativen(produkt: ProductConfig, alle: ProductConfig[] = PRODUCTS, anzahl = ANZAHL_ALTERNATIVEN): ProductConfig[] {
  const eigenesGewicht = typeof produkt.weightGsm === 'number' && produkt.weightGsm > 0 ? produkt.weightGsm : null;
  const bewertet = (p: ProductConfig) => {
    const gewicht = typeof p.weightGsm === 'number' && p.weightGsm > 0 ? p.weightGsm : null;
    const abstand = eigenesGewicht !== null && gewicht !== null ? Math.abs(gewicht - eigenesGewicht) : 1000 + Math.abs(p.basePrice - produkt.basePrice) * 10;
    return { p, abstand };
  };
  const sortiere = (a: { p: ProductConfig; abstand: number }, b: { p: ProductConfig; abstand: number }) =>
    a.abstand - b.abstand || a.p.name.localeCompare(b.p.name, 'de') || a.p.id.localeCompare(b.p.id);

  const gleicheArt = alle.filter((p) => p.id !== produkt.id && p.productType === produkt.productType);
  // Zuerst Modelle mit gleichem Schnitt (Damen mit Damen); nur wenn es davon zu wenige gibt, folgen die übrigen – der Satz nennt den Unterschied dann.
  const gleicherSchnitt = gleicheArt.filter((p) => schnitt(p) === schnitt(produkt)).map(bewertet).sort(sortiere);
  const uebrige = gleicheArt.filter((p) => schnitt(p) !== schnitt(produkt)).map(bewertet).sort(sortiere);
  const ersteWahl = [...gleicherSchnitt, ...(gleicherSchnitt.length >= anzahl ? [] : uebrige)];
  const verwandt = ersteWahl.length >= anzahl
    ? []
    : alle
        .filter((p) => p.id !== produkt.id && (VERWANDTE_ARTEN[produkt.productType] ?? []).includes(p.productType))
        .map(bewertet)
        .sort(sortiere);
  const kandidaten = [...ersteWahl, ...verwandt];

  const gewaehlt: ProductConfig[] = [];
  const marken = new Set<string>();
  for (const { p } of kandidaten) {
    if (gewaehlt.length >= anzahl) break;
    if (marken.has(p.brand)) continue;
    marken.add(p.brand);
    gewaehlt.push(p);
  }
  for (const { p } of kandidaten) {
    if (gewaehlt.length >= anzahl) break;
    if (!gewaehlt.includes(p)) gewaehlt.push(p);
  }
  return gewaehlt;
}

function istPique(p: ProductConfig): boolean {
  return /piqu[eé]/i.test(p.material);
}

/** Unterschiede zwischen dem Modell der Seite (`basis`) und einer Alternative – nur messbare Dinge, nach Wichtigkeit, höchstens vier. */
export function unterschiede(basis: ProductConfig, alt: ProductConfig): string[] {
  const saetze: string[] = [];

  if (alt.productType !== basis.productType) saetze.push(`Art: ${produktTypLabel(alt.productType)}`);

  const g0 = typeof basis.weightGsm === 'number' && basis.weightGsm > 0 ? basis.weightGsm : null;
  const g1 = typeof alt.weightGsm === 'number' && alt.weightGsm > 0 ? alt.weightGsm : null;
  if (g0 !== null && g1 !== null && Math.abs(g1 - g0) >= 10) {
    saetze.push(`${Math.abs(g1 - g0)} g/m² ${g1 > g0 ? 'schwerer' : 'leichter'}`);
  }

  const preisDiff = Math.round((alt.basePrice - basis.basePrice) * 100) / 100;
  if (Math.abs(preisDiff) >= 1) {
    saetze.push(`Textilpreis ab ${formatiereGeld(alt.basePrice)} (${formatiereGeld(Math.abs(preisDiff))} ${preisDiff > 0 ? 'mehr' : 'weniger'})`);
  }

  if (schnitt(alt) !== schnitt(basis)) {
    const label = alt.detailedDescription?.gender?.trim();
    if (label) saetze.push(`Schnitt: ${label}`);
  }

  // Nur positive Aussagen: Ein fehlender Katalogeintrag beweist nicht, dass ein Zertifikat oder ein Gewebe fehlt.
  const zertBasis = new Set(basis.certifications);
  const zusaetzlich = alt.certifications.filter((z) => !zertBasis.has(z));
  if (zusaetzlich.length > 0) saetze.push(`mit ${zusaetzlich.join(' und ')}`);

  if (istPique(alt) && !istPique(basis)) saetze.push('aus Piqué-Gewebe');

  const farbDiff = alt.colors.length - basis.colors.length;
  if (Math.abs(farbDiff) >= 5) {
    saetze.push(`${Math.abs(farbDiff)} Farben ${farbDiff > 0 ? 'mehr' : 'weniger'} (insgesamt ${alt.colors.length})`);
  }

  const letzteBasis = basis.sizes[basis.sizes.length - 1];
  const letzteAlt = alt.sizes[alt.sizes.length - 1];
  if (letzteBasis && letzteAlt && letzteBasis !== letzteAlt && alt.sizes.length !== basis.sizes.length) {
    saetze.push(`Größen ${groessenSpanne(alt.sizes)}`);
  }

  return saetze.slice(0, 4);
}

function aussageZu(basis: ProductConfig, alt: ProductConfig): VergleichsAussage {
  const teile = unterschiede(basis, alt);
  const satz = teile.length > 0 ? `${teile.join(', ')}.` : 'In Gewicht, Farbauswahl und Preis sehr ähnlich.';
  return { id: alt.id, name: alt.name, marke: alt.brand, satz };
}

function groesse(box: { boxWidthCm: number; radiusCm: number; mitteCm: number; maxHeightCm: number }): { breiteCm: number; hoeheCm: number } {
  return {
    breiteCm: rundeMassCm(flacheBreiteCm(0, box.boxWidthCm, { radiusCm: box.radiusCm, mitteCm: box.mitteCm })),
    hoeheCm: box.maxHeightCm,
  };
}

/** Größtmögliche DTF-Fläche je Größe (vorne/hinten) neben der Breite des Kleidungsstücks. Leer, wenn für das Modell keine Größenflächen vorliegen. */
export function druckflaechenJeGroesse(produkt: ProductConfig): DruckflaechenZeile[] {
  const daten = PRINT_AREA_DATA_DTF[produkt.id];
  const vorneJe = daten?.front?.bySize;
  const hintenJe = daten?.back?.bySize;
  if (!vorneJe && !hintenJe) return [];
  const massJe = new Map((produkt.sizeGuide?.measurements ?? []).map((m) => [m.size, m.breiteCm]));
  const zeilen: DruckflaechenZeile[] = [];
  for (const g of produkt.sizes) {
    const v = vorneJe?.[g];
    const h = hintenJe?.[g];
    if (!v && !h) continue;
    const vorne = v ? groesse(v) : null;
    const breite = massJe.get(g) ?? null;
    zeilen.push({
      groesse: g,
      kleidungBreiteCm: breite,
      vorne,
      hinten: h ? groesse(h) : null,
      anteilBreiteProzent: vorne && breite && breite > 0 ? Math.round((vorne.breiteCm / breite) * 100) : null,
    });
  }
  return zeilen;
}

export function produktVergleich(produkt: ProductConfig, alle: ProductConfig[] = PRODUCTS): ProduktVergleich {
  const alternativen = waehleAlternativen(produkt, alle);
  return {
    modelle: [alsVergleichsModell(produkt), ...alternativen.map(alsVergleichsModell)],
    aussagen: alternativen.map((a) => aussageZu(produkt, a)),
    druckflaechen: druckflaechenJeGroesse(produkt),
  };
}
