import { buildStageResult, makeLine, type PriceLine, type StageResult } from '../priceLine';
import type { PositionResult } from './positionStage';
import { formatiereGeld } from '@/lib/format';

/**
 * STUFE 2 – WARENKORBEBENE.
 *
 * Verantwortlich für alles, was MEHRERE Positionen gemeinsam betrifft:
 * Gutscheine, Aktionscodes, kundenspezifische Rabatte, warenkorbweite
 * Mengenrabatte, Mindestwarenwert.
 *
 * Diese Stufe kennt bewusst NICHT: die innere Zusammensetzung einer Position
 * (Stiche, Flächen, Motive) und nichts aus dem Checkout (Lieferland, Zahlart,
 * Steuern). Sie sieht nur die fertigen Positionsergebnisse und ihren
 * Warenwert.
 *
 * ── Erweiterung ohne Umbau ────────────────────────────────────────────
 * Neue warenkorbweite Bausteine werden als `CartComponent` in
 * `CART_COMPONENTS` registriert. Die Stufe selbst bleibt unverändert.
 */

export interface CartContext {
  /** Ergebnisse der Positionsstufe. */
  positions: PositionResult[];
  /** Warenwert aus Stufe 1. */
  subtotal: number;
  /** Gesamtstückzahl über alle Positionen. */
  totalQuantity: number;

  // ── Optionale Eingaben für Bausteine ───────────────────────────────
  /** Eingelöster Gutschein-/Aktionscode. */
  voucherCode?: string;
  /** z.B. 'verein', 'geschaeftskunde', 'privat'. */
  customerGroup?: string;
  /** Zeitpunkt der Berechnung (für befristete Aktionen). */
  now?: Date;
}

/**
 * Ein warenkorbweiter Preisbaustein.
 *
 * `apply` liefert Posten ODER eine Beanstandung. Eine Beanstandung
 * (z.B. Mindestwarenwert unterschritten) blockiert die Stufe – es entsteht
 * bewusst KEIN Preis, statt still einen unzulässigen zu liefern.
 */
export interface CartComponent {
  id: string;
  apply: (ctx: CartContext) => { lines?: PriceLine[]; issues?: string[] };
}

/** Konfiguration der warenkorbweiten Bausteine. Beträge = Geschäftsentscheidung. */
export interface CartConfig {
  /** Mindestwarenwert in EUR. 0 = keiner. */
  minimumOrderValue: number;
  /** Warenkorbweite Rabatte je Kundengruppe, in Prozent. */
  customerGroupDiscountPercent: Record<string, number>;
  /** Gutscheine: Code → Nachlass. */
  vouchers: Record<string, { label: string; percent?: number; absolute?: number }>;
}

/**
 * Standard: alles AUS. Genau wie bei den Rüstkosten ist die Höhe eine
 * kaufmännische Entscheidung und gehört nicht in den Code.
 */
export const DEFAULT_CART_CONFIG: CartConfig = {
  minimumOrderValue: 0,
  customerGroupDiscountPercent: {},
  vouchers: {},
};

/**
 * Registrierte Bausteine der Warenkorbstufe.
 * **Einzige Stelle, die beim Hinzufügen eines neuen Bausteins wächst.**
 */
export function buildCartComponents(config: CartConfig): CartComponent[] {
  return [
    // ── Mindestwarenwert ──────────────────────────────────────────────
    {
      id: 'mindestwarenwert',
      apply: (ctx) => {
        if (config.minimumOrderValue <= 0) return {};
        if (ctx.subtotal >= config.minimumOrderValue) return {};
        return {
          issues: [
            `Mindestwarenwert von ${formatiereGeld(config.minimumOrderValue)} nicht erreicht ` +
              `(aktuell ${formatiereGeld(ctx.subtotal)}).`,
          ],
        };
      },
    },

    // ── Kundengruppenrabatt ───────────────────────────────────────────
    {
      id: 'kundengruppenrabatt',
      apply: (ctx) => {
        const prozent = ctx.customerGroup ? config.customerGroupDiscountPercent[ctx.customerGroup] : undefined;
        if (!prozent) return {};
        return {
          lines: [
            makeLine({
              id: `cart:kundengruppe:${ctx.customerGroup}`,
              label: `Rabatt ${ctx.customerGroup}`,
              category: 'rabatt',
              description: `${prozent} % auf den Warenwert`,
              origin: {
                stage: 'cart',
                ruleId: `kundengruppe:${ctx.customerGroup}`,
                reason: `Rabatt für die Kundengruppe „${ctx.customerGroup}" auf den gesamten Warenwert`,
                basis: { warenwert: ctx.subtotal, prozent: prozent },
              },
              amount: -(ctx.subtotal * prozent) / 100,
              quantity: 1,
            }),
          ],
        };
      },
    },

    // ── Gutschein / Aktionscode ───────────────────────────────────────
    {
      id: 'gutschein',
      apply: (ctx) => {
        if (!ctx.voucherCode) return {};
        const gutschein = config.vouchers[ctx.voucherCode.toUpperCase()];
        if (!gutschein) {
          return { issues: [`Gutscheincode „${ctx.voucherCode}" ist unbekannt oder nicht mehr gültig.`] };
        }
        const abzug = gutschein.percent
          ? (ctx.subtotal * gutschein.percent) / 100
          : (gutschein.absolute ?? 0);
        if (abzug <= 0) return {};
        return {
          lines: [
            makeLine({
              id: `cart:gutschein:${ctx.voucherCode}`,
              label: gutschein.label,
              category: 'rabatt',
              description: `Gutscheincode ${ctx.voucherCode.toUpperCase()}`,
              origin: {
                stage: 'cart',
                ruleId: `gutschein:${ctx.voucherCode}`,
                reason: `Eingelöster Gutschein „${ctx.voucherCode.toUpperCase()}"`,
                basis: gutschein.percent
                  ? { warenwert: ctx.subtotal, prozent: gutschein.percent }
                  : { abzug: gutschein.absolute ?? 0 },
              },
              // Nie mehr als den Warenwert abziehen.
              amount: -Math.min(abzug, ctx.subtotal),
              quantity: 1,
            }),
          ],
        };
      },
    },
  ];
}

export interface CartResult extends StageResult {
  subtotal: number;
  totalQuantity: number;
}

export function calculateCartStage(ctx: CartContext, config: CartConfig = DEFAULT_CART_CONFIG): CartResult {
  const lines: PriceLine[] = [];
  const issues: string[] = [];

  // Beanstandungen aus der Positionsstufe durchreichen – ein blockierter
  // Posten darf nicht durch spätere Stufen „verschwinden".
  for (const position of ctx.positions) {
    for (const problem of position.issues) issues.push(`Position ${position.itemId}: ${problem}`);
  }

  for (const baustein of buildCartComponents(config)) {
    const ergebnis = baustein.apply(ctx);
    if (ergebnis.lines) lines.push(...ergebnis.lines);
    if (ergebnis.issues) issues.push(...ergebnis.issues);
  }

  const ergebnis = buildStageResult('cart', lines, ctx.subtotal, issues);
  return { ...ergebnis, subtotal: ctx.subtotal, totalQuantity: ctx.totalQuantity };
}
