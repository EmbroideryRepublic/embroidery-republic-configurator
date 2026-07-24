import { groupByCategory, roundCents, type PriceLine } from './priceLine';
import { calculatePositionStage, type PositionInput, type PositionResult } from './stages/positionStage';
import {
  calculateCartStage,
  DEFAULT_CART_CONFIG,
  type CartConfig,
  type CartResult,
} from './stages/cartStage';
import {
  calculateOrderStage,
  DEFAULT_ORDER_CONFIG,
  type OrderConfig,
  type OrderResult,
} from './stages/orderStage';

/**
 * PREISPIPELINE – Orchestrierung der drei Berechnungsstufen.
 *
 *   Stufe 1  Position   → was eine einzelne Produktkonfiguration kostet
 *   Stufe 2  Warenkorb  → was mehrere Positionen gemeinsam betrifft
 *   Stufe 3  Bestellung → was erst im Checkout entsteht
 *
 * Jede Stufe kennt ausschließlich ihre eigene Ebene und übergibt ein
 * standardisiertes Ergebnis (`StageResult`) an die nächste. Diese Datei tut
 * nichts anderes, als sie in dieser Reihenfolge aufzurufen und die Posten
 * zusammenzuführen – sie enthält KEINE Preislogik.
 *
 * ── Warum getrennt statt eine große Engine ────────────────────────────
 * Eine einzelne Engine, die irgendwann alles rechnet, wird mit jedem neuen
 * Preisbestandteil unübersichtlicher und riskanter. Getrennte Stufen mit
 * klaren Zuständigkeiten lassen sich einzeln testen, einzeln erweitern und
 * einzeln verstehen. Ein neuer Bestandteil betrifft genau EINE Stufe.
 *
 * ── Transparenz ───────────────────────────────────────────────────────
 * Das Ergebnis enthält nicht nur den Endbetrag, sondern alle PREISPOSTEN mit
 * Bezeichnung, Kategorie, Beschreibung und Herkunft. Dieselben Daten tragen
 * Warenkorbanzeige, Rechnung und Auswertung.
 */

export interface PipelineInput {
  positions: PositionInput[];
  /** Warenkorbebene. */
  voucherCode?: string;
  customerGroup?: string;
  /** Bestellebene. */
  shippingCountry?: string;
  paymentMethod?: string;
  express?: boolean;
  now?: Date;
}

export interface PipelineConfig {
  cart?: CartConfig;
  order?: OrderConfig;
}

export interface PipelineResult {
  positions: PositionResult[];
  cart: CartResult;
  order: OrderResult;
  /** Alle Posten aller Stufen, in Berechnungsreihenfolge. */
  lines: PriceLine[];
  /** Nach Kategorie gruppiert – für Warenkorbanzeige und Rechnung. */
  grouped: ReturnType<typeof groupByCategory>;
  /** Warenwert nach Stufe 1. */
  subtotal: number;
  /** Endbetrag nach allen Stufen. */
  grandTotal: number;
  taxAmount: number;
  totalQuantity: number;
  /** Sämtliche Beanstandungen aller Stufen. */
  issues: string[];
  /**
   * true = das Ergebnis ist NICHT belastbar (unbekannter Preisbaustein,
   * fehlender Versandtarif, Mindestwarenwert unterschritten …). Der
   * aufrufende Code darf daraus weder Angebot noch Rechnung erzeugen.
   */
  blocked: boolean;
}

export function calculatePipeline(input: PipelineInput, config: PipelineConfig = {}): PipelineResult {
  // ── Stufe 1: jede Position für sich ─────────────────────────────────
  const positions = input.positions.map((p) => calculatePositionStage(p));
  const subtotal = roundCents(positions.reduce((sum, p) => sum + p.stageTotal, 0));
  const totalQuantity = positions.reduce((sum, p) => sum + p.quantity, 0);

  // ── Stufe 2: über alle Positionen hinweg ────────────────────────────
  const cart = calculateCartStage(
    {
      positions,
      subtotal,
      totalQuantity,
      voucherCode: input.voucherCode,
      customerGroup: input.customerGroup,
      now: input.now,
    },
    config.cart ?? DEFAULT_CART_CONFIG
  );

  // ── Stufe 3: Checkout ───────────────────────────────────────────────
  const order = calculateOrderStage(
    {
      cartTotal: cart.runningTotal,
      shippingCountry: input.shippingCountry,
      paymentMethod: input.paymentMethod,
      express: input.express,
      now: input.now,
    },
    config.order ?? DEFAULT_ORDER_CONFIG
  );

  const lines = [...positions.flatMap((p) => p.lines), ...cart.lines, ...order.lines];
  const issues = [...cart.issues, ...order.issues];

  return {
    positions,
    cart,
    order,
    lines,
    grouped: groupByCategory(lines),
    subtotal,
    grandTotal: order.grandTotal,
    taxAmount: order.taxAmount,
    totalQuantity,
    issues,
    blocked: issues.length > 0,
  };
}
