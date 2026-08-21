import { calculateShipping, landCodeForCountry } from '@/config/shipping';
import { STANDARDLAND, steuersatzFuer } from '@/config/pricing/steuer';
import { IST_KLEINUNTERNEHMER, KLEINUNTERNEHMER_HINWEIS } from '@/config/company';
import { buildStageResult, makeLine, type PriceLine, type StageResult } from '../priceLine';

/**
 * STUFE 3 – BESTELLEBENE.
 *
 * Verantwortlich für alles, was erst beim CHECKOUT entsteht: Lieferland und
 * Versandart, Zahlungsartzuschläge, Rechnungsgebühren, Expressproduktion,
 * Steuern.
 *
 * Diese Stufe kennt bewusst NICHT: einzelne Positionen, Motive, Stiche oder
 * Gutscheinlogik. Sie bekommt den fertigen Warenkorbwert aus Stufe 2 und
 * ergänzt ausschließlich checkout-abhängige Posten.
 *
 * ── Warum der Versand hier liegt ──────────────────────────────────────
 * Versandkosten hängen am LIEFERLAND und damit an einer Checkout-Eingabe,
 * nicht am Warenkorbinhalt allein. Solange kein Land gewählt ist, entsteht
 * bewusst kein Versandposten (unverbindliche Anfrage).
 *
 * ── Erweiterung ohne Umbau ────────────────────────────────────────────
 * Neue Bausteine werden in `buildOrderComponents` registriert; die Stufe
 * selbst bleibt unverändert.
 */

export interface OrderContext {
  /** Ergebnis aus Stufe 2 – Warenwert nach Gutscheinen/Rabatten. */
  cartTotal: number;
  /** Lieferland. Ohne Angabe wird kein Versand berechnet. */
  shippingCountry?: string;
  /** Zahlart, z.B. 'rechnung', 'vorkasse', 'paypal'. */
  paymentMethod?: string;
  /** Expressproduktion gewünscht. */
  express?: boolean;
  now?: Date;
}

export interface OrderComponent {
  id: string;
  apply: (ctx: OrderContext) => { lines?: PriceLine[]; issues?: string[] };
}

/** Konfiguration der Bestellstufe. Alle Beträge = Geschäftsentscheidung. */
export interface OrderConfig {
  /** Zuschlag je Zahlart in EUR, z.B. { rechnung: 2.5 }. */
  paymentSurcharge: Record<string, number>;
  /** Aufschlag für Expressproduktion in EUR. */
  expressSurcharge: number;
  /**
   * true = die angezeigten Preise sind bereits Bruttopreise; die Steuer wird
   * nur ausgewiesen, nicht aufgeschlagen.
   *
   * Beschreibt, wie die Katalogpreise GEMEINT sind – keine Steuerhöhe. Den
   * Satz selbst kennt diese Stufe nicht und darf sie nicht kennen; er kommt
   * ausschließlich aus `config/pricing/steuer.ts`.
   */
  pricesIncludeTax: boolean;
  /**
   * Überschreibt `IST_KLEINUNTERNEHMER` (config/company.ts) NUR für diesen
   * Aufruf. Ausschließlich für Tests gedacht, die beide Zweige (mit/ohne
   * Kleinunternehmerregelung) prüfen wollen – im echten Bestellablauf wird
   * dieses Feld NIE gesetzt; dort gilt immer der tatsächliche, aktuelle
   * Betreiberstatus aus `company.ts`.
   */
  kleinunternehmer?: boolean;
}

export const DEFAULT_ORDER_CONFIG: OrderConfig = {
  paymentSurcharge: {},
  expressSurcharge: 0,
  pricesIncludeTax: true,
};

export function buildOrderComponents(config: OrderConfig): OrderComponent[] {
  return [
    // ── Versand ───────────────────────────────────────────────────────
    {
      id: 'versand',
      apply: (ctx) => {
        if (!ctx.shippingCountry) return {}; // unverbindliche Anfrage
        const versand = calculateShipping(ctx.shippingCountry, ctx.cartTotal);
        if (versand === null) {
          // Kein hinterlegter Tarif: lieber kein Angebot als ein geratener
          // Preis (siehe config/shipping.ts).
          return {
            issues: [`Für „${ctx.shippingCountry}" ist kein Versandtarif hinterlegt – Bestellung nicht möglich.`],
          };
        }
        if (versand.cost === 0) {
          return {
            lines: [
              makeLine({
                id: 'order:versand',
                label: 'Versand',
                category: 'versand',
                description: 'Versandkostenfrei ab erreichtem Warenwert',
                origin: {
                  stage: 'order',
                  ruleId: 'versand',
                  reason: 'Versandkostenfrei, weil der Warenwert die Freigrenze erreicht',
                  basis: { warenwert: ctx.cartTotal, lieferland: ctx.shippingCountry },
                },
                amount: 0,
                quantity: 1,
              }),
            ],
          };
        }
        return {
          lines: [
            makeLine({
              id: 'order:versand',
              label: 'Versand',
              category: 'versand',
              description: `Lieferung nach ${ctx.shippingCountry}`,
              origin: {
                stage: 'order',
                ruleId: 'versand',
                reason: `Versandkosten für das Lieferland „${ctx.shippingCountry}"`,
                basis: { warenwert: ctx.cartTotal, freiAb: versand.freeFrom },
              },
              amount: versand.cost,
              quantity: 1,
            }),
          ],
        };
      },
    },

    // ── Expressproduktion ─────────────────────────────────────────────
    {
      id: 'express',
      apply: (ctx) => {
        if (!ctx.express || config.expressSurcharge <= 0) return {};
        return {
          lines: [
            makeLine({
              id: 'order:express',
              label: 'Expressproduktion',
              category: 'zuschlag',
              description: 'Vorgezogene Fertigung',
              origin: {
                stage: 'order',
                ruleId: 'express',
                reason: 'Expressproduktion wurde ausgewählt – die Fertigung wird vorgezogen',
              },
              amount: config.expressSurcharge,
              quantity: 1,
            }),
          ],
        };
      },
    },

    // ── Zahlungsartzuschlag / Rechnungsgebühr ─────────────────────────
    {
      id: 'zahlart',
      apply: (ctx) => {
        const betrag = ctx.paymentMethod ? config.paymentSurcharge[ctx.paymentMethod] : undefined;
        if (!betrag) return {};
        return {
          lines: [
            makeLine({
              id: `order:zahlart:${ctx.paymentMethod}`,
              label: `Zuschlag ${ctx.paymentMethod}`,
              category: 'gebuehr',
              origin: {
                stage: 'order',
                ruleId: `zahlart:${ctx.paymentMethod}`,
                reason: `Zuschlag für die gewählte Zahlungsart „${ctx.paymentMethod}"`,
              },
              amount: betrag,
              quantity: 1,
            }),
          ],
        };
      },
    },
  ];
}

export interface OrderResult extends StageResult {
  /** Ausgewiesene Umsatzsteuer (0, wenn nicht konfiguriert). */
  taxAmount: number;
  /** Endbetrag – der Wert, der belastet bzw. in Rechnung gestellt wird. */
  grandTotal: number;
}

export function calculateOrderStage(ctx: OrderContext, config: OrderConfig = DEFAULT_ORDER_CONFIG): OrderResult {
  const lines: PriceLine[] = [];
  const issues: string[] = [];

  for (const baustein of buildOrderComponents(config)) {
    const ergebnis = baustein.apply(ctx);
    if (ergebnis.lines) lines.push(...ergebnis.lines);
    if (ergebnis.issues) issues.push(...ergebnis.issues);
  }

  // ── Steuer ──────────────────────────────────────────────────────────
  // Zuletzt, weil sie auf allem Vorherigen aufsetzt. Bei Bruttopreisen wird
  // sie nur AUSGEWIESEN (herausgerechnet), nicht aufgeschlagen.
  const basis = ctx.cartTotal + lines.reduce((s, l) => s + l.total, 0);

  // Der Satz kommt AUSSCHLIESSLICH aus config/pricing/steuer.ts. Diese Stufe
  // kennt keinen Prozentwert – ein Wächter-Test sichert das ab.
  //
  // Länderauflösung statt hartem STANDARDLAND (Entscheidung 2026-08-06): Das
  // Lieferland kommt – wenn vorhanden – aus shipping.ts' `landCodeForCountry`,
  // demselben Bindeglied, das auch die Versandzone auflöst. Ohne gewähltes
  // Land (unverbindliche Anfrage) oder für ein (noch) nicht geführtes Land
  // bleibt STANDARDLAND ('DE') die Schätzgrundlage – unschädlich, weil
  // `SHIPPING_COUNTRIES` ohnehin nur Länder mit verifiziertem Satz listet und
  // der Versand-Baustein oben jede andere Eingabe bereits ablehnt (`issues`).
  // Sobald ein weiteres Land samt Satz hinzukommt, greift diese Auflösung
  // automatisch – siehe docs/steuerarchitektur.md „Offener Punkt: EU-Lieferungen".
  const landCode = landCodeForCountry(ctx.shippingCountry) ?? STANDARDLAND;
  const steuersatzRegulaer = steuersatzFuer(landCode);
  let taxAmount = 0;

  // Kleinunternehmer nach § 19 UStG (config/company.ts): KEIN Steuerausweis,
  // unabhängig vom Regelsteuersatz des Lieferlands. Der Bruttoendpreis
  // (grandTotal unten) bleibt dabei UNVERÄNDERT – dieser Zweig ändert nur,
  // was als Steueranteil ausgewiesen und gespeichert wird (tax_amount,
  // und über serverPricing.ts auch tax_rate), niemals den Verkaufspreis
  // selbst. Dieselbe Fallunterscheidung wie bereits auf der Rechnung
  // (orderCompletion.ts, erzeugeRechnung: `IST_KLEINUNTERNEHMER ? 0 : ...`) –
  // hier zusätzlich schon bei der Bestellung selbst angewendet, statt erst
  // beim Rechnungsversand, damit Checkout, Bestellbestätigung und Admin-
  // Ansicht von Anfang an denselben (korrekten) Stand zeigen wie die Rechnung.
  const kleinunternehmer = config.kleinunternehmer ?? IST_KLEINUNTERNEHMER;
  if (kleinunternehmer) {
    lines.push(
      makeLine({
        id: 'order:steuer',
        label: KLEINUNTERNEHMER_HINWEIS,
        category: 'steuer',
        description: 'Kein Steuerausweis (§ 19 UStG)',
        origin: {
          stage: 'order',
          ruleId: 'steuer',
          reason: 'Kleinunternehmerregelung nach § 19 UStG (config/company.ts, IST_KLEINUNTERNEHMER) – keine Umsatzsteuer wird berechnet oder ausgewiesen.',
          basis: { satzProzent: 0, bemessungsgrundlage: Math.round(basis * 100) / 100 },
        },
        amount: 0,
        quantity: 1,
      })
    );
  } else if (steuersatzRegulaer.satz > 0) {
    // Bei Bruttopreisen wird die enthaltene Steuer HERAUSgerechnet, sonst
    // aufgeschlagen.
    taxAmount = config.pricesIncludeTax
      ? basis - basis / (1 + steuersatzRegulaer.satz / 100)
      : (basis * steuersatzRegulaer.satz) / 100;

    lines.push(
      makeLine({
        id: 'order:steuer',
        label: steuersatzRegulaer.bezeichnung,
        category: 'steuer',
        description: config.pricesIncludeTax ? 'in den Preisen enthalten' : 'zzgl. auf den Nettobetrag',
        origin: {
          stage: 'order',
          ruleId: 'steuer',
          reason: config.pricesIncludeTax
            ? 'Die angezeigten Preise sind Bruttopreise – die Umsatzsteuer ist bereits enthalten und wird hier nur ausgewiesen'
            : 'Umsatzsteuer wird auf den Nettobetrag aufgeschlagen',
          basis: { satzProzent: steuersatzRegulaer.satz, bemessungsgrundlage: Math.round(basis * 100) / 100 },
        },
        // Enthaltene Steuer verändert die Summe NICHT – sie wird nur
        // ausgewiesen. Aufgeschlagene Steuer erhöht sie.
        amount: config.pricesIncludeTax ? 0 : taxAmount,
        quantity: 1,
      })
    );
  }

  const ergebnis = buildStageResult('order', lines, ctx.cartTotal, issues);
  return {
    ...ergebnis,
    taxAmount: Math.round(taxAmount * 100) / 100,
    grandTotal: ergebnis.runningTotal,
  };
}
