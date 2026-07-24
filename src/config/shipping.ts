/**
 * Versandkosten – einzige Quelle der Wahrheit.
 *
 * Die Sätze stammen aus den verbindlichen Geschäftsbedingungen von Embroidery
 * Republic Germany (Juli 2026). Sie werden sowohl im Checkout angezeigt als
 * auch serverseitig in die Bestellsumme eingerechnet (siehe serverPricing.ts) –
 * es gibt bewusst keinen zweiten Ort, an dem Versandkosten definiert sind.
 *
 * WICHTIG: Für Länder ohne definierten Tarif (z.B. Schweiz – kein EU-Mitglied)
 * gibt es KEINEN Fallback. `calculateShipping` liefert dann `null`; solche
 * Länder sind im Checkout gar nicht erst auswählbar. Lieber kein Angebot als
 * ein geratener Preis.
 */

export type ShippingZone = 'DE' | 'EU';

export interface ShippingRate {
  /** Versandkosten in EUR, solange der Warenwert unter `freeFrom` liegt. */
  cost: number;
  /** Ab diesem Warenwert (EUR) ist der Versand kostenfrei. */
  freeFrom: number;
}

export const SHIPPING_RATES: Record<ShippingZone, ShippingRate> = {
  // 6,90 € auf Festlegung des Betreibers vom 2026-07-22 (zuvor 7,99 €).
  // Unsere echten Kosten: 5,50 € DHL + 0,50 € Karton = 6,00 €. Unterhalb der
  // Freigrenze trägt sich der Versand damit knapp; oberhalb tragen wir ihn
  // vollständig – als Deckungslücke erfasst in pricing/selbstkosten.ts.
  DE: { cost: 6.9, freeFrom: 75 },
  EU: { cost: 11.99, freeFrom: 100 },
};

/**
 * Auswählbare Lieferländer mit ihrer Versandzone. Bewusst ausschließlich
 * Länder, für die ein Tarif definiert ist (Deutschland + EU-Mitgliedstaaten).
 */
export const SHIPPING_COUNTRIES: { name: string; zone: ShippingZone }[] = [
  { name: 'Deutschland', zone: 'DE' },
  { name: 'Belgien', zone: 'EU' },
  { name: 'Bulgarien', zone: 'EU' },
  { name: 'Dänemark', zone: 'EU' },
  { name: 'Estland', zone: 'EU' },
  { name: 'Finnland', zone: 'EU' },
  { name: 'Frankreich', zone: 'EU' },
  { name: 'Griechenland', zone: 'EU' },
  { name: 'Irland', zone: 'EU' },
  { name: 'Italien', zone: 'EU' },
  { name: 'Kroatien', zone: 'EU' },
  { name: 'Lettland', zone: 'EU' },
  { name: 'Litauen', zone: 'EU' },
  { name: 'Luxemburg', zone: 'EU' },
  { name: 'Malta', zone: 'EU' },
  { name: 'Niederlande', zone: 'EU' },
  { name: 'Österreich', zone: 'EU' },
  { name: 'Polen', zone: 'EU' },
  { name: 'Portugal', zone: 'EU' },
  { name: 'Rumänien', zone: 'EU' },
  { name: 'Schweden', zone: 'EU' },
  { name: 'Slowakei', zone: 'EU' },
  { name: 'Slowenien', zone: 'EU' },
  { name: 'Spanien', zone: 'EU' },
  { name: 'Tschechien', zone: 'EU' },
  { name: 'Ungarn', zone: 'EU' },
  { name: 'Zypern', zone: 'EU' },
];

/** Versandzone eines Lieferlandes; `null`, wenn kein Tarif definiert ist. */
export function shippingZoneForCountry(country: string | undefined | null): ShippingZone | null {
  if (!country) return null;
  const match = SHIPPING_COUNTRIES.find((c) => c.name.toLowerCase() === country.trim().toLowerCase());
  return match ? match.zone : null;
}

export interface ShippingResult {
  zone: ShippingZone;
  /** Tatsächlich zu zahlender Versand (0, wenn Freigrenze erreicht). */
  cost: number;
  /** Regulärer Satz der Zone, unabhängig vom Warenwert. */
  baseCost: number;
  freeFrom: number;
  isFree: boolean;
  /** Fehlbetrag bis zur Versandkostenfreiheit (0, wenn bereits erreicht). */
  amountUntilFree: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Berechnet die Versandkosten aus Lieferland und Warenwert (Zwischensumme
 * ohne Versand). Gibt `null` zurück, wenn für das Land kein Tarif hinterlegt
 * ist – Aufrufer dürfen daraus NIEMALS 0 € ableiten.
 */
export function calculateShipping(country: string | undefined | null, subtotal: number): ShippingResult | null {
  const zone = shippingZoneForCountry(country);
  if (!zone) return null;

  const rate = SHIPPING_RATES[zone];
  const value = Number.isFinite(subtotal) && subtotal > 0 ? subtotal : 0;
  const isFree = value >= rate.freeFrom;

  return {
    zone,
    cost: isFree ? 0 : rate.cost,
    baseCost: rate.cost,
    freeFrom: rate.freeFrom,
    isFree,
    amountUntilFree: isFree ? 0 : round2(rate.freeFrom - value),
  };
}
