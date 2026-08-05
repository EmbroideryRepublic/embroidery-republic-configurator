/**
 * Der **einzige Vertrag**, den ein Lieferanten-Import-Adapter erfüllen muss
 * (ADR 0004, „gemeinsame Import-Pipeline").
 *
 * Ein Adapter übersetzt das **beliebige** Quellformat eines Lieferanten – DOM-
 * Extraktion, CSV, Excel, JSON-API, PIM-Export – in `RohProdukt[]`. Das ist die
 * gesamte lieferantenspezifische Arbeit. **Alles danach** – Normalisierung,
 * Inferenz (Produkttyp/Farbgruppe/Material/Geschlecht), Facetten-Delta,
 * Geometrie-Übernahme, spätere Asset-Erzeugung/Versionierung/Manifest und die
 * Emission der Katalogdateien – läuft **zentral und identisch für ALLE**
 * Lieferanten (siehe `produktInferenz.ts` + `scripts/importiereProdukte.mts`).
 *
 * Grundsatz „kein Raten": Ein Adapter liefert **nur verifizierte** Quelldaten.
 * Er interpretiert nichts (keine Farbgruppen, keine Produkttypen) – das ist
 * Sache der zentralen Inferenz, damit die Regeln für jeden Lieferanten gleich
 * sind.
 */
import type { QualityTier } from '@/types';

/** Eine Farbe, wie der Lieferant sie führt: Anzeigename + verifizierter Swatch-Hex. */
export interface RohFarbe {
  name: string;
  /** Verifizierter Swatch-Hex (`#RRGGBB` oder `RRGGBB`), die Grundlage der
   *  objektiven Farbgruppen-Bestimmung. */
  hex: string;
}

/** Ein Größen-Maß aus der Lieferanten-Größentabelle (nur verifizierte Werte). */
export interface RohGroessenmass {
  size: string;
  breiteCm?: number;
  hoeheCm?: number;
  aermelCm?: number;
}

/** Ein Produkt, wie ein Adapter es aus seiner Quelle liefert – reine, nicht
 *  interpretierte Sachdaten. */
export interface RohProdukt {
  /** Quell-URL (dient zugleich der deterministischen ID-Ableitung). */
  url: string;
  /** Roh-Kategorie der Quelle (Hinweis für die Produkttyp-Inferenz). */
  sourceCategory: string;
  brand: string;
  name: string;
  artNr: string;
  material: string;
  weight: number | null;
  country?: string;
  sizes: string[];
  /** Netto-Einkaufspreis (Ab-Preis-Basis). */
  basePriceNet: number;
  colors: RohFarbe[];
  sizeGuide?: RohGroessenmass[];
  qualityTier?: QualityTier;
}

/**
 * Eine **Importquelle**: der Output eines Adapters plus seine Provenienz.
 *
 * Ein neuer Lieferant fügt der Pipeline ausschließlich einen `ImportQuelle`-
 * Eintrag hinzu (sein Adapter liefert `produkte`, `quelle` ist das Provenienz-
 * Label, das zentral – **nicht** hartkodiert – in die Produktbeschreibung
 * einfließt). Keine bestehende Datei der Pipeline wird geändert.
 */
export interface ImportQuelle {
  /** Provenienz-Label für die Beschreibung, z. B. `'textil-grosshandel.eu'`. */
  quelle: string;
  produkte: RohProdukt[];
}
