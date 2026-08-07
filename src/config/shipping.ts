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
 *
 * ── Entscheidung 2026-08-06: Lieferländer vorerst auf Deutschland begrenzt ──
 * Bis 2026-08-06 waren hier zusätzlich 26 EU-Staaten auswählbar, obwohl die
 * Steuerberechnung (config/pricing/steuer.ts) ausnahmslos den deutschen Satz
 * anwandte – unterhalb der Lieferschwelle korrekt, oberhalb hätte das
 * Bestimmungslandprinzip (One-Stop-Shop/OSS) gegolten. Dafür fehlten sowohl
 * verlässlich verifizierte Steuersätze je Land als auch die tatsächliche
 * OSS-Registrierung beim Finanzamt – beides keine Code-Fragen, sondern reale
 * steuerrechtliche Voraussetzungen, die nur der Betreiber schaffen kann.
 * Eine falsch berechnete Steuer ist ein Steuerdelikt, kein Rundungsfehler
 * (s.o.) – deshalb wurde die sichere Seite gewählt: nur Länder anbieten, für
 * die die Steuer nachweislich korrekt ist. Das entspricht der eigenen
 * Empfehlung aus docs/audit-produktionsreife.md (M7) und
 * docs/steuerarchitektur.md.
 *
 * Wiedereröffnung eines Landes ist strukturell weiterhin „ein Eintrag":
 * Zeile hier ergänzen (mit ISO-Code) UND den passenden Satz in
 * config/pricing/steuer.ts eintragen UND die OSS-Registrierung tatsächlich
 * vorliegen haben. Die EU-Versandzone/-Rate bleibt unten bewusst definiert,
 * genau damit dieser Schritt später keine Struktur ändert, nur Daten ergänzt.
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
  // EU-Satz bleibt definiert (nicht gelöscht), obwohl aktuell kein
  // EU-Land auswählbar ist – siehe Entscheidung oben. Sobald ein Land mit
  // verifiziertem Steuersatz + OSS-Registrierung hinzukommt, greift dieser
  // Wert ohne weitere Änderung.
  EU: { cost: 11.99, freeFrom: 100 },
};

/**
 * Auswählbare Lieferländer mit ihrer Versandzone UND ihrem ISO-3166-1-
 * alpha-2-Code (Bindeglied zu den Steuersätzen in config/pricing/steuer.ts,
 * die pro Land unter genau diesem Code hinterlegt sind).
 *
 * Bewusst ausschließlich Länder, für die sowohl ein Versandtarif ALS AUCH
 * ein verifizierter, anwendbarer Steuersatz definiert sind (siehe
 * Entscheidung 2026-08-06 oben) – aktuell nur Deutschland.
 */
export const SHIPPING_COUNTRIES: { name: string; zone: ShippingZone; code: string }[] = [
  { name: 'Deutschland', zone: 'DE', code: 'DE' },
];

/** Versandzone eines Lieferlandes; `null`, wenn kein Tarif definiert ist. */
export function shippingZoneForCountry(country: string | undefined | null): ShippingZone | null {
  if (!country) return null;
  const match = SHIPPING_COUNTRIES.find((c) => c.name.toLowerCase() === country.trim().toLowerCase());
  return match ? match.zone : null;
}

/**
 * ISO-Ländercode des Lieferlandes (z.B. „Deutschland" → „DE"); `null`, wenn
 * das Land nicht in `SHIPPING_COUNTRIES` geführt wird.
 *
 * Bindeglied zwischen dem im Checkout gewählten Klartext-Ländernamen und
 * `steuersatzFuer()` (config/pricing/steuer.ts), das ausschließlich
 * ISO-Codes kennt. Ohne dieses Bindeglied müsste die Steuerstufe den
 * Ländernamen selbst kennen – genau die Doppellogik, die das Projekt
 * durchgehend vermeidet.
 */
export function landCodeForCountry(country: string | undefined | null): string | null {
  if (!country) return null;
  const match = SHIPPING_COUNTRIES.find((c) => c.name.toLowerCase() === country.trim().toLowerCase());
  return match ? match.code : null;
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
