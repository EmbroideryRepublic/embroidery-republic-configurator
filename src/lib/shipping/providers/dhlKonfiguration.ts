/**
 * ═══════════════════════════════════════════════════════════════════════
 * KONFIGURATION DES DHL-ADAPTERS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach demselben Muster wie stripeKonfiguration.ts. DHL braucht FÜNF
 * Zugangsdaten: einen App-Schlüssel + App-Geheimnis (`client_id`/
 * `client_secret` der DHL-API-Developer-Portal-App) UND ein
 * Geschäftskundenportal-Login (Systembenutzer) UND die Abrechnungsnummer
 * des Versandvertrags – gemeinsam identifizieren sie "welche App ruft auf",
 * "in wessen Namen" und "wessen Vertrag wird abgerechnet".
 *
 * ── OAuth2 (Password-Grant/ROPC) statt Legacy-Basic-Auth ────────────────
 * DHL bietet für Parcel DE Shipping v2 zwei Wege an, hat Basic Auth aber
 * ausdrücklich als auslaufend markiert ("we will no longer offer Basic
 * Auth in future API versions", developer.dhl.com, Stand Aug 2026). Diese
 * Datei liest deshalb `DHL_API_SECRET` zusätzlich zu den bisherigen vier
 * Variablen – der eigentliche Token-Austausch (POST .../auth/ropc/v1/token
 * mit grant_type=password) lebt in dhl.ts, hier nur die Zugangsdaten und
 * die Basis-URLs für Token- und Sendungs-Endpunkt, sauber nach
 * Sandbox/Production getrennt wie schon zuvor.
 */

export class DhlKonfigurationFehlt extends Error {
  constructor(nachricht: string) {
    super(nachricht);
    this.name = 'DhlKonfigurationFehlt';
  }
}

const VARIABLE_API_KEY = 'DHL_API_KEY';
const VARIABLE_API_SECRET = 'DHL_API_SECRET';
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

/** Sendungs-/Label-Endpunkt (POST .../orders) – unverändert zur bisherigen
 *  Basis-URL, nur der Name macht jetzt explizit, dass es NICHT der
 *  Auth-Endpunkt ist. */
export function dhlBasisUrl(): string {
  return istProduktivUmgebung() ? 'https://api-eu.dhl.com/parcel/de/shipping/v2' : 'https://api-sandbox.dhl.com/parcel/de/shipping/v2';
}

/** Token-Endpunkt der DHL Authentication API (Post & Parcel Germany,
 *  ROPC-Flow) – unterscheidet sich von dhlBasisUrl() nur im Pfad, nicht in
 *  der Domain (beide auf api-eu.dhl.com bzw. api-sandbox.dhl.com), aber als
 *  eigene Funktion, damit ein künftiger Domain-Unterschied nicht beide
 *  Endpunkte gleichzeitig träfe. */
export function dhlAuthUrl(): string {
  return istProduktivUmgebung()
    ? 'https://api-eu.dhl.com/parcel/de/account/auth/ropc/v1/token'
    : 'https://api-sandbox.dhl.com/parcel/de/account/auth/ropc/v1/token';
}

export interface DhlZugangsdaten {
  apiKey: string;
  apiSecret: string;
  username: string;
  password: string;
  billingNumber: string;
}

/** Alle fünf Zugangsdaten gemeinsam – ein Versandlabel lässt sich nur mit
 *  vollständigen Angaben erstellen, ein Teilzustand hilft niemandem. */
export function leseZugangsdaten(): DhlZugangsdaten {
  const apiKey = leseVariable(VARIABLE_API_KEY);
  const apiSecret = leseVariable(VARIABLE_API_SECRET);
  const username = leseVariable(VARIABLE_USERNAME);
  const password = leseVariable(VARIABLE_PASSWORD);
  const billingNumber = leseVariable(VARIABLE_BILLING_NUMBER);
  const fehlend = [
    !apiKey && VARIABLE_API_KEY,
    !apiSecret && VARIABLE_API_SECRET,
    !username && VARIABLE_USERNAME,
    !password && VARIABLE_PASSWORD,
    !billingNumber && VARIABLE_BILLING_NUMBER,
  ].filter(Boolean);
  if (fehlend.length > 0) {
    throw new DhlKonfigurationFehlt(
      `${fehlend.join(', ')} ${fehlend.length === 1 ? 'ist' : 'sind'} nicht gesetzt. App-Schlüssel/-Geheimnis aus dem ` +
        `DHL-API-Developer-Portal (developer.dhl.com), Benutzername/Passwort aus dem Post & DHL ` +
        `Geschäftskundenportal (Systembenutzer) – Sandbox-Zugang muss dort ggf. separat beantragt werden.`
    );
  }
  return { apiKey: apiKey!, apiSecret: apiSecret!, username: username!, password: password!, billingNumber: billingNumber! };
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
