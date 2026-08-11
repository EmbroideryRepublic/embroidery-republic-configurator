/**
 * ═══════════════════════════════════════════════════════════════════════
 * KONFIGURATION DES DHL-ADAPTERS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach demselben Muster wie stripeKonfiguration.ts. DHL braucht VIER
 * Zugangsdaten statt eines einzelnen Schlüssels: einen Anwendungs-Schlüssel
 * (`dhl-api-key`-Header) UND ein Geschäftskonto-Login (HTTP-Basic) UND die
 * Abrechnungsnummer des Versandvertrags – alle vier gemeinsam identifizieren
 * "wer ruft auf" und "wessen Vertrag wird abgerechnet".
 */

export class DhlKonfigurationFehlt extends Error {
  constructor(nachricht: string) {
    super(nachricht);
    this.name = 'DhlKonfigurationFehlt';
  }
}

const VARIABLE_API_KEY = 'DHL_API_KEY';
const VARIABLE_USERNAME = 'DHL_USERNAME';
const VARIABLE_PASSWORD = 'DHL_PASSWORD';
const VARIABLE_BILLING_NUMBER = 'DHL_BILLING_NUMBER';
const VARIABLE_ENV = 'DHL_ENV';

function leseVariable(name: string): string | null {
  const wert = process.env[name]?.trim();
  return wert ? wert : null;
}

export function istProduktivUmgebung(): boolean {
  return leseVariable(VARIABLE_ENV) === 'production';
}

export function dhlBasisUrl(): string {
  return istProduktivUmgebung() ? 'https://api-eu.dhl.com/parcel/de/shipping/v2' : 'https://api-sandbox.dhl.com/parcel/de/shipping/v2';
}

export interface DhlZugangsdaten {
  apiKey: string;
  username: string;
  password: string;
  billingNumber: string;
}

/** Alle vier Zugangsdaten gemeinsam – ein Versandlabel lässt sich nur mit
 *  vollständigen Angaben erstellen, ein Teilzustand hilft niemandem. */
export function leseZugangsdaten(): DhlZugangsdaten {
  const apiKey = leseVariable(VARIABLE_API_KEY);
  const username = leseVariable(VARIABLE_USERNAME);
  const password = leseVariable(VARIABLE_PASSWORD);
  const billingNumber = leseVariable(VARIABLE_BILLING_NUMBER);
  const fehlend = [
    !apiKey && VARIABLE_API_KEY,
    !username && VARIABLE_USERNAME,
    !password && VARIABLE_PASSWORD,
    !billingNumber && VARIABLE_BILLING_NUMBER,
  ].filter(Boolean);
  if (fehlend.length > 0) {
    throw new DhlKonfigurationFehlt(
      `${fehlend.join(', ')} ${fehlend.length === 1 ? 'ist' : 'sind'} nicht gesetzt. Zugangsdaten aus dem ` +
        `DHL-Entwicklerportal (developer.dhl.com) und dem Geschäftskundenkonto – Sandbox-Zugang muss dort ` +
        `separat beantragt werden.`
    );
  }
  return { apiKey: apiKey!, username: username!, password: password!, billingNumber: billingNumber! };
}

export interface DhlKonfigurationsStand {
  versandMoeglich: boolean;
  produktivUmgebung: boolean;
  offeneSchritte: string[];
}

export function dhlKonfigurationsStand(): DhlKonfigurationsStand {
  try {
    leseZugangsdaten();
    return { versandMoeglich: true, produktivUmgebung: istProduktivUmgebung(), offeneSchritte: [] };
  } catch (err) {
    return {
      versandMoeglich: false,
      produktivUmgebung: istProduktivUmgebung(),
      offeneSchritte: [err instanceof Error ? err.message : String(err)],
    };
  }
}

/** Warnt, wenn DHL_ENV=production außerhalb des Produktivbetriebs gesetzt
 *  ist – dieselbe Überlegung wie bei Stripe/PayPal. */
export function warneBeiProduktivUmgebung(): void {
  if (istProduktivUmgebung() && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[dhl] ACHTUNG: ${VARIABLE_ENV}=production ist gesetzt, die Anwendung läuft aber nicht im ` +
        `Produktivbetrieb. Versandlabel wären ECHT (kostenpflichtig). Für Tests ${VARIABLE_ENV}=sandbox verwenden.`
    );
  }
}
