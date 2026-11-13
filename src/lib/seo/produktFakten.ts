/**
 * „Auf einen Blick“ und häufige Fragen je Produktseite – vollständig aus den Katalogdaten berechnet.
 *
 * Warum: Die Produktseiten bestanden bisher aus Herstellertext und Datenzeilen. Search Console (2026-11-12): 139 von 166 Seiten
 * „gefunden – zurzeit nicht indexiert“. Google bevorzugt Seiten mit eigenem Mehrwert; hier entsteht er aus Fakten, die nur dieses
 * Modell hat (Material, Gewicht im Vergleich zum Sortiment, Größen, Farben, Druckflächen) – nichts davon wird von Hand geschrieben,
 * nichts erfunden.
 *
 * Nur belegte Aussagen: Alle Zahlen stammen aus Produktdaten und Konfiguration; die Gewichtseinordnung vergleicht ausschließlich
 * mit dem eigenen Sortiment („gehört zu den schwereren Hoodies im Sortiment“), nicht mit dem Markt. Die Antworten zu Menge und Dauer
 * sind wortgleich die freigegebenen Bausteine der Anlassseiten.
 *
 * Reine Funktion, kein Netz, keine Datenbank. Stickerei erscheint nur, wenn sie angeboten wird (Betriebsschalter).
 */
import { PRODUCTS } from '@/config/products';
import type { ProductConfig } from '@/config/products/types';
import { produktTypLabelPlural } from '@/config/products/types';
import { A_DAUER, A_EINZELSTUECK } from '@/config/seo/anlassSeiten';
import { cm } from '@/lib/format';

export interface ProduktFrage {
  q: string;
  a: string;
}

export interface ProduktFakten {
  absaetze: string[];
  fragen: ProduktFrage[];
}

export interface Veredelungsflaeche {
  ansicht: string;
  breiteCm: number;
  hoeheCm: number;
}

/** Wo das Gewicht dieses Modells unter allen Modellen derselben Art liegt (nur Modelle mit Gewichtsangabe). */
export type GewichtsLage = 'leichter' | 'mittel' | 'schwerer';

export interface GewichtsEinordnung {
  lage: GewichtsLage;
  /** Anzahl der verglichenen Modelle derselben Art (mit Gewichtsangabe). */
  anzahl: number;
  min: number;
  max: number;
}

/** Mindestens so viele Vergleichsmodelle, sonst sagt „leichter/schwerer“ nichts. */
const MIN_VERGLEICH = 6;

export function gewichtsEinordnung(produkt: ProductConfig, alle: ProductConfig[] = PRODUCTS): GewichtsEinordnung | null {
  const gm = produkt.weightGsm;
  if (typeof gm !== 'number' || gm <= 0) return null;
  const gewichte = alle
    .filter((p) => p.productType === produkt.productType && typeof p.weightGsm === 'number' && p.weightGsm > 0)
    .map((p) => p.weightGsm as number)
    .sort((a, b) => a - b);
  if (gewichte.length < MIN_VERGLEICH) return null;
  // Anteil der Modelle, die leichter sind als dieses: unteres Drittel = leichter, oberes Drittel = schwerer.
  const leichter = gewichte.filter((g) => g < gm).length;
  const anteil = leichter / gewichte.length;
  const lage: GewichtsLage = anteil < 1 / 3 ? 'leichter' : anteil >= 2 / 3 ? 'schwerer' : 'mittel';
  return { lage, anzahl: gewichte.length, min: gewichte[0]!, max: gewichte[gewichte.length - 1]! };
}

/** „100% Baumwolle“ statt der vollen Aufschlüsselung mit Farbgruppen-Ausnahmen (steht auf der Seite in „Technische Daten“). */
function materialKurz(produkt: ProductConfig): string {
  return (produkt.material.split('(')[0] ?? produkt.material).trim();
}

function flaechenText(flaechen: Veredelungsflaeche[]): string {
  return flaechen.map((f) => `${f.ansicht} ${cm(f.breiteCm)} × ${cm(f.hoeheCm)}`).join(', ');
}

function groessenSpanne(sizes: string[]): string {
  const erste = sizes[0];
  const letzte = sizes[sizes.length - 1];
  if (!erste) return '';
  return erste === letzte ? erste : `${erste}–${letzte}`;
}

export function produktFakten(
  produkt: ProductConfig,
  artLabel: string,
  flaechen: Veredelungsflaeche[],
  stickereiVerfuegbar: boolean,
  alle: ProductConfig[] = PRODUCTS
): ProduktFakten {
  const gm = typeof produkt.weightGsm === 'number' && produkt.weightGsm > 0 ? produkt.weightGsm : null;
  const farben = produkt.colors.length;
  const groessen = groessenSpanne(produkt.sizes);
  const hatMasse = !!produkt.sizeGuide && produkt.sizeGuide.measurements.length > 0;
  const einordnung = gewichtsEinordnung(produkt, alle);
  const verfahren = stickereiVerfuegbar ? 'per DTF-Transferdruck oder Stickerei' : 'per DTF-Transferdruck';

  const absaetze: string[] = [];

  // 1) Material und Gewicht, im Vergleich zum eigenen Sortiment.
  let material = `${produkt.name} (${artLabel} von ${produkt.brand}) besteht aus ${materialKurz(produkt)}${gm ? ` und hat ein Flächengewicht von ${gm} g/m²` : ''}.`;
  if (einordnung) {
    const plural = produktTypLabelPlural(produkt.productType);
    const lage =
      einordnung.lage === 'schwerer'
        ? `gehört damit zu den schwereren ${plural} im Sortiment`
        : einordnung.lage === 'leichter'
          ? `gehört damit zu den leichteren ${plural} im Sortiment`
          : `liegt damit im mittleren Gewichtsbereich der ${plural} im Sortiment`;
    material += ` Das Modell ${lage} (Spanne im Sortiment: ${einordnung.min} bis ${einordnung.max} g/m²).`;
  }
  absaetze.push(material);

  // 2) Größen und Farben.
  if (groessen) {
    absaetze.push(
      `Erhältlich ist das Modell in ${farben} ${farben === 1 ? 'Farbe' : 'Farben'} und den Größen ${groessen}${
        hatMasse ? '; die Maße je Größe stehen in der Größentabelle weiter unten auf dieser Seite' : ''
      }.`
    );
  }

  // 3) Veredelung und Flächen.
  if (flaechen.length > 0) {
    absaetze.push(
      `Bedruckt wird das Modell ${verfahren}, ab 1 Stück. Die maximal nutzbare Fläche beträgt: ${flaechenText(flaechen)}. Welche Fläche Sie nutzen, legen Sie im Konfigurator fest – den Preis sehen Sie dort in Echtzeit.`
    );
  } else {
    absaetze.push(`Bedruckt wird das Modell ${verfahren}, ab 1 Stück. Im Konfigurator sehen Sie die nutzbaren Flächen und den Preis in Echtzeit.`);
  }

  const fragen: ProduktFrage[] = [
    { q: `Kann ich ${produkt.name} einzeln bedrucken lassen?`, a: A_EINZELSTUECK },
  ];
  if (groessen) {
    fragen.push({
      q: `Welche Größen und Farben gibt es bei ${produkt.name}?`,
      a: `${produkt.name} gibt es in den Größen ${produkt.sizes.join(', ')} und in ${farben} ${farben === 1 ? 'Farbe' : 'Farben'}.${
        hatMasse ? ' Die Maße je Größe stehen in der Größentabelle auf dieser Seite.' : ''
      }`,
    });
  }
  if (flaechen.length > 0) {
    fragen.push({
      q: `Wie groß darf das Motiv auf ${produkt.name} sein?`,
      a: `Die maximal nutzbare Fläche beträgt: ${flaechenText(flaechen)}. Nähte, Kragen und Saum sind dabei bereits abgezogen. Im Konfigurator sehen Sie jede Fläche samt Maßen in Zentimetern.`,
    });
  }
  const pflege = produkt.careInstructions?.trim();
  if (pflege) {
    fragen.push({
      q: `Wie pflege ich ${produkt.name} nach dem Bedrucken?`,
      a: `Der Hersteller gibt als Pflegehinweis an: ${pflege}${/[.!?]$/.test(pflege) ? '' : '.'} Allgemeine Tipps zur Pflege bedruckter Textilien stehen im Ratgeber.`,
    });
  }
  fragen.push({ q: 'Wie lange dauert es, bis die Bestellung ankommt?', a: A_DAUER });

  return { absaetze, fragen };
}
