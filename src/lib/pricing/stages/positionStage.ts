import type { ConfigElement, PricingRule } from '@/types';
import { calculatePrice } from '../calculatePrice';
import { buildStageResult, makeLine, roundCents, sumLines, type PriceLine, type StageResult } from '../priceLine';

/**
 * STUFE 1 – POSITIONSEBENE.
 *
 * Verantwortlich für alles, was AUSSCHLIESSLICH eine einzelne
 * Produktkonfiguration betrifft: Produktgrundpreis, Veredelung (Stickerei/
 * Transfer), Motivgröße, Positionen, Material- und Größenzuschläge,
 * Einrichtungskosten.
 *
 * Diese Stufe kennt bewusst NICHT: andere Positionen, den Warenkorb,
 * Gutscheine, Versand, Lieferland, Zahlart oder Steuern. Sie liefert ein
 * standardisiertes `StageResult`, das die nächste Stufe weiterverarbeitet.
 *
 * Der eigentliche Rechenkern bleibt `calculatePrice` (Regel-Engine,
 * Mengenstaffel). Diese Stufe übersetzt dessen Ergebnis in PREISPOSTEN mit
 * Bezeichnung, Kategorie und Herkunft, damit Warenkorb, Rechnung und
 * Auswertung dieselben Daten nutzen können.
 */

export interface PositionInput {
  /** Kennung der Warenkorbposition – landet in der Herkunft jedes Postens. */
  itemId: string;
  productName: string;
  basePrice: number;
  quantity: number;
  elements: ConfigElement[];
  pricingRules: PricingRule[];
}

export interface PositionResult extends StageResult {
  itemId: string;
  quantity: number;
  /** Effektiver Stückpreis inklusive anteiliger Einmalkosten. */
  unitPrice: number;
}

export function calculatePositionStage(input: PositionInput): PositionResult {
  const { itemId, productName, basePrice, quantity, elements, pricingRules } = input;

  const berechnet = calculatePrice({ basePrice, quantity, elements, pricingRules });
  const b = berechnet.breakdown;
  const lines: PriceLine[] = [];

  const herkunft = (
    ruleType?: string,
    reason?: string,
    basis?: Record<string, string | number>
  ) => ({ stage: 'position' as const, itemId, ruleType, reason, basis });

  // ── Produkt ─────────────────────────────────────────────────────────
  lines.push(
    makeLine({
      id: `${itemId}:produkt`,
      label: productName,
      category: 'produkt',
      description: 'Blankoware inklusive Mengenrabatt',
      origin: herkunft(
        undefined,
        b.baseDiscountPercent > 0
          ? `Grundpreis abzüglich ${b.baseDiscountPercent} % Mengenrabatt ab ${quantity} Stück`
          : 'Grundpreis der Blankoware',
        { menge: quantity, mengenrabattProzent: b.baseDiscountPercent }
      ),
      amount: b.basePrice,
      quantity,
    })
  );

  // ── Veredelung je Position ──────────────────────────────────────────
  // Nach Ansicht getrennt, damit im Warenkorb sichtbar ist, wofür gezahlt
  // wird („Brust", „Rücken" …) statt nur einer Sammelzeile.
  const ansichtLabel: Record<string, string> = {
    front: 'Vorderseite',
    back: 'Rückseite',
    sleeve_left: 'Ärmel links',
    sleeve_right: 'Ärmel rechts',
  };
  for (const [view, betrag] of Object.entries(b.areaPriceByView)) {
    if (betrag === 0) continue;
    lines.push(
      makeLine({
        id: `${itemId}:veredelung:${view}`,
        label: `Veredelung ${ansichtLabel[view] ?? view}`,
        category: 'veredelung',
        description: b.isStitchBased
          ? `Stickerei nach Stichzahl (${b.totalEstimatedStitches.toLocaleString('de-DE')} Stiche gesamt)`
          : 'Transferdruck nach bedruckter Fläche',
        origin: herkunft(
          b.isStitchBased ? 'per_1000_stitches' : 'per_cm2',
          b.isStitchBased
            ? `Stickerei auf der Ansicht „${ansichtLabel[view] ?? view}", abgerechnet nach Stichzahl`
            : `Transferdruck auf der Ansicht „${ansichtLabel[view] ?? view}", abgerechnet nach bedruckter Fläche`,
          b.isStitchBased
            ? { stiche: b.totalEstimatedStitches, satzJe1000Stiche: b.pricePer1000Stitches,
                veredelungsrabattProzent: b.veredelungDiscountPercent }
            : { satzJeCm2: b.areaPricePerCm2, veredelungsrabattProzent: b.veredelungDiscountPercent }
        ),
        amount: betrag,
        quantity,
      })
    );
  }

  // Grundgebühren je Motiv und Positionsaufschläge, sofern konfiguriert.
  if (b.elementBaseFeeTotal > 0) {
    lines.push(
      makeLine({
        id: `${itemId}:motivgrundgebuehr`,
        label: 'Motiv-Grundgebühr',
        category: 'veredelung',
        origin: herkunft('per_logo'),
        amount: b.elementBaseFeeTotal,
        quantity,
      })
    );
  }
  if (b.positionFeeTotal > 0) {
    lines.push(
      makeLine({
        id: `${itemId}:positionsaufschlag`,
        label: 'Zusätzliche Veredelungsposition',
        category: 'zuschlag',
        description: 'Fällt an, wenn mehrere Ansichten veredelt werden',
        origin: herkunft(
          'per_position',
          'Es werden mehrere Ansichten veredelt – jede zusätzliche Fläche verursacht eigenen Rüstaufwand'
        ),
        amount: b.positionFeeTotal,
        quantity,
      })
    );
  }

  // ── Zuschläge je Stück (Premiumgarn, Spezialfolie …) ────────────────
  if (b.surchargePerUnit > 0) {
    lines.push(
      makeLine({
        id: `${itemId}:zuschlag`,
        label: 'Materialzuschlag',
        category: 'zuschlag',
        origin: herkunft('surcharge_per_unit', 'Materialzuschlag laut Preisregel'),
        amount: b.surchargePerUnit,
        quantity,
      })
    );
  }

  // ── Nachlässe (Verein, Geschäftskunde, Aktion, Gutschein) ───────────
  // NEGATIVER Betrag – die Summe aller Posten ergibt dadurch immer den
  // Endpreis, ohne Sonderbehandlung im aufrufenden Code.
  if (b.discountPerUnit > 0) {
    lines.push(
      makeLine({
        id: `${itemId}:nachlass`,
        label: 'Nachlass',
        category: 'rabatt',
        origin: herkunft('discount_percent', 'Nachlass laut Preisregel (Rabatt, Aktion oder Gutschein)'),
        amount: -b.discountPerUnit,
        quantity,
      })
    );
  }

  // ── Einmalige Einrichtungskosten ────────────────────────────────────
  if (b.setupTotal > 0) {
    lines.push(
      makeLine({
        id: `${itemId}:einrichtung`,
        label: 'Einrichtung',
        category: 'einrichtung',
        description: 'Einmalig je Auftrag – verteilt sich auf die Stückzahl',
        origin: herkunft(
          'setup_fee',
          `Einmaliger Rüstaufwand – fällt unabhängig von der Stückzahl an und verteilt sich auf ${quantity} Stück`,
          { jeStueck: b.setupPerUnit, menge: quantity }
        ),
        amount: b.setupTotal,
        quantity: 1,
      })
    );
  }

  // ── Abgleich mit dem autoritativen Gesamtpreis ──────────────────────
  //
  // `calculatePrice` rundet den STÜCKPREIS einmal und multipliziert ihn;
  // die Posten hier sind einzeln gerundet. Beide Wege dürfen um wenige Cent
  // auseinanderlaufen – gemessen bis zu 4 Cent bei zehn Stück.
  //
  // Autoritativ ist und bleibt `calculatePrice`, denn dieser Betrag wird dem
  // Kunden angezeigt und berechnet. Eine verbleibende Differenz wird deshalb
  // als eigener, sichtbarer Posten ausgewiesen statt still in einer anderen
  // Zeile zu verschwinden. Damit gilt ausnahmslos:
  //   Summe aller Posten === berechneter Gesamtpreis.
  const differenz = roundCents(berechnet.totalPrice - sumLines(lines));
  if (differenz !== 0) {
    lines.push(
      makeLine({
        id: `${itemId}:rundung`,
        label: 'Rundung',
        category: 'produkt',
        description: 'Rundungsausgleich zwischen Stückpreis und Einzelposten',
        origin: herkunft(
          undefined,
          'Ausgleich, weil der Stückpreis einmal gerundet wird, die Einzelposten aber jeweils für sich'
        ),
        amount: differenz,
        quantity: 1,
      })
    );
  }

  const issues = berechnet.issues.map((i) => i.message);
  const ergebnis = buildStageResult('position', lines, 0, issues);

  return {
    ...ergebnis,
    itemId,
    quantity,
    unitPrice: berechnet.unitPrice,
  };
}
