/**
 * PREISPOSTEN – die gemeinsame Währung der Berechnungspipeline.
 *
 * ── Warum es diese Datei gibt ─────────────────────────────────────────
 * Die Preisberechnung ist kein reiner Zahlenrechner, sondern eine Pipeline
 * aus drei Stufen (Position → Warenkorb → Bestellung). Jede Stufe erzeugt
 * PREISPOSTEN und reicht ein standardisiertes Ergebnis an die nächste weiter.
 *
 * Ein Posten trägt bewusst nicht nur einen Betrag, sondern auch seine
 * BEDEUTUNG: Bezeichnung, Kategorie, Erklärung und Herkunft. Dadurch nutzen
 * Berechnung, Warenkorbanzeige, Rechnung und Auswertung DIESELBEN Daten –
 * niemand muss die Zusammensetzung eines Preises an zweiter Stelle
 * nachbauen (und dabei abweichen).
 *
 * ── Vorzeichenregel ───────────────────────────────────────────────────
 * `amount` ist vorzeichenbehaftet: Zuschläge positiv, Nachlässe NEGATIV.
 * Die Summe aller Posten ergibt damit immer den Endbetrag – ohne Sonderfälle
 * im aufrufenden Code.
 */
// Reine Darstellungsfunktion ohne eigene Importe – siehe lib/format.ts.
// `explainLine()` erzeugt die Preisauskunft für Support und Rechnung; sie
// muss dieselbe Schreibweise verwenden wie Shop, E-Mail und Produktionsblatt.
import { formatiereGeld } from '@/lib/format';

/** Stufe der Pipeline, in der ein Posten entsteht. */
export type PricingStage =
  /** Eine einzelne Produktkonfiguration. */
  | 'position'
  /** Über mehrere Positionen hinweg (Warenkorb). */
  | 'cart'
  /** Erst beim Checkout relevant (Lieferland, Zahlart, Steuern). */
  | 'order';

/**
 * Fachliche Kategorie eines Postens. Steuert Gruppierung und Reihenfolge in
 * Anzeige und Rechnung – NICHT die Berechnung.
 */
export type PriceCategory =
  | 'produkt'
  | 'veredelung'
  | 'einrichtung'
  | 'zuschlag'
  | 'rabatt'
  | 'versand'
  | 'gebuehr'
  | 'steuer';

/** Anzeigereihenfolge der Kategorien in Warenkorb und Rechnung. */
export const CATEGORY_ORDER: PriceCategory[] = [
  'produkt',
  'veredelung',
  'einrichtung',
  'zuschlag',
  'rabatt',
  'versand',
  'gebuehr',
  'steuer',
];

/**
 * Woher ein Posten stammt – für Nachvollziehbarkeit und Auswertung.
 *
 * Ziel: Jede Preisberechnung muss sich später vollständig erklären lassen –
 * intern, im Support und gegenüber dem Kunden. Dafür genügt der Betrag
 * nicht; es muss nachvollziehbar sein, WELCHE Regel in WELCHER Stufe ihn
 * ausgelöst hat und auf WELCHER Grundlage.
 */
export interface PriceOrigin {
  stage: PricingStage;
  /** ID der auslösenden Preisregel, falls es eine gibt. */
  ruleId?: string;
  /** Typ der auslösenden Preisregel. */
  ruleType?: string;
  /** Betroffene Position (Warenkorb-Item), falls zutreffend. */
  itemId?: string;
  /**
   * WARUM dieser Posten entstanden ist – in einem Satz, ohne Fachjargon.
   * Wird im Support und in der Preisauskunft direkt angezeigt.
   */
  reason?: string;
  /**
   * Die Rechengrundlage in nachvollziehbarer Form, z.B.
   * `{ stiche: 12000, satzJe1000: 1.4 }`. Ermöglicht es, eine Zeile
   * nachzurechnen, ohne den Code zu lesen.
   */
  basis?: Record<string, string | number>;
}

export interface PriceLine {
  /** Stabile, technische Kennung – für Tests, Auswertung, Rechnungen. */
  id: string;
  /** Anzeigename, z.B. „Stickerei Brust" oder „Vereinsrabatt". */
  label: string;
  category: PriceCategory;
  /** Optionaler Erklärtext fürs Frontend („warum kostet das?"). */
  description?: string;
  origin: PriceOrigin;
  /**
   * Betrag EINER Einheit dieses Postens. Zuschläge positiv, Nachlässe
   * negativ.
   */
  amount: number;
  /** Wie oft `amount` zählt. 1 = einmalig (Versand, Einrichtung). */
  quantity: number;
  /** `amount * quantity`, gerundet. Das ist der zählende Betrag. */
  total: number;
}

/** Ergebnis EINER Stufe – identische Form für alle drei Stufen. */
export interface StageResult {
  stage: PricingStage;
  /** Alle in dieser Stufe entstandenen Posten. */
  lines: PriceLine[];
  /** Summe der Posten DIESER Stufe. */
  stageTotal: number;
  /** Übertrag aus der Vorstufe (0 in der ersten Stufe). */
  carriedTotal: number;
  /** `carriedTotal + stageTotal` – Übergabewert an die nächste Stufe. */
  runningTotal: number;
  /**
   * Nicht verarbeitbare Bausteine oder verletzte Bedingungen. Nicht leer =
   * das Ergebnis ist NICHT belastbar (siehe ruleEngine, „FAIL FAST").
   */
  issues: string[];
  /** true, wenn die Stufe kein gültiges Ergebnis liefern konnte. */
  blocked: boolean;
}

export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Erzeugt einen Posten und berechnet `total` konsistent. */
export function makeLine(input: Omit<PriceLine, 'total'> & { total?: number }): PriceLine {
  const quantity = input.quantity;
  return {
    ...input,
    quantity,
    total: roundCents(input.amount * quantity),
  };
}

export function sumLines(lines: PriceLine[]): number {
  return roundCents(lines.reduce((sum, l) => sum + l.total, 0));
}

/**
 * Erklärt einen Posten in einem Satz – für Support, Preisauskunft und
 * Rechnungsanhang. Nutzt ausschließlich die Metadaten des Postens, damit
 * Erklärung und Berechnung nicht auseinanderlaufen können.
 */
export function explainLine(line: PriceLine): string {
  const teile: string[] = [line.label];

  if (line.quantity > 1) {
    teile.push(`${line.quantity} × ${formatiereGeld(line.amount)}`);
  }
  teile.push(formatiereGeld(line.total));

  if (line.origin.reason) teile.push(`– ${line.origin.reason}`);

  if (line.origin.basis) {
    const basis = Object.entries(line.origin.basis)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    teile.push(`(${basis})`);
  }

  const quelle = line.origin.ruleId ? `Regel ${line.origin.ruleId}` : `Stufe ${line.origin.stage}`;
  teile.push(`[${quelle}]`);

  return teile.join(' · ');
}

/**
 * Fasst Posten für die ANZEIGE nach Kategorie zusammen (Warenkorb, Rechnung).
 * Die Berechnung nutzt weiterhin die Einzelposten – diese Funktion ist reine
 * Darstellung.
 */
export function groupByCategory(lines: PriceLine[]): { category: PriceCategory; lines: PriceLine[]; total: number }[] {
  return CATEGORY_ORDER.map((category) => {
    const zurKategorie = lines.filter((l) => l.category === category);
    return { category, lines: zurKategorie, total: sumLines(zurKategorie) };
  }).filter((gruppe) => gruppe.lines.length > 0);
}

/** Baut das Ergebnis einer Stufe aus ihren Posten. */
export function buildStageResult(
  stage: PricingStage,
  lines: PriceLine[],
  carriedTotal: number,
  issues: string[] = []
): StageResult {
  const stageTotal = sumLines(lines);
  return {
    stage,
    lines,
    stageTotal,
    carriedTotal: roundCents(carriedTotal),
    runningTotal: roundCents(carriedTotal + stageTotal),
    issues,
    blocked: issues.length > 0,
  };
}
