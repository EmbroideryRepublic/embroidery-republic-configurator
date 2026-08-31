/**
 * ═══════════════════════════════════════════════════════════════════════
 * KONFIGURATION DES PAYPAL-ADAPTERS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach demselben Muster wie stripeKonfiguration.ts. Ein wichtiger
 * Unterschied: PayPal unterscheidet Sandbox/Live nicht über ein
 * Schlüsselpräfix, sondern über VOLLSTÄNDIG getrennte Zugangsdaten UND eine
 * andere Basis-URL – deshalb der explizite Schalter `PAYPAL_ENV` statt einer
 * Mustererkennung wie bei Stripes „sk_test_"/„sk_live_".
 */

export class PaypalKonfigurationFehlt extends Error {
  constructor(nachricht: string) {
    super(nachricht);
    this.name = 'PaypalKonfigurationFehlt';
  }
}

import { diagnostiziereFeld, type FeldDiagnose } from './feldDiagnose';

const VARIABLE_CLIENT_ID = 'PAYPAL_CLIENT_ID';
const VARIABLE_CLIENT_SECRET = 'PAYPAL_CLIENT_SECRET';
const VARIABLE_WEBHOOK_ID = 'PAYPAL_WEBHOOK_ID';
const VARIABLE_ENV = 'PAYPAL_ENV';

function leseVariable(name: string): string | null {
  const wert = process.env[name]?.trim();
  return wert ? wert : null;
}

/** `true` = PAYPAL_ENV=live (echtes Geld). Alles andere (inkl. fehlend) gilt
 *  als Sandbox – ein fehlerhafter/leerer Wert soll NIE versehentlich als
 *  "live" gelten. */
export function istProduktivUmgebung(): boolean {
  return leseVariable(VARIABLE_ENV) === 'live';
}

/** Client-ID + Secret für den OAuth2-Client-Credentials-Austausch. */
export function leseClientZugangsdaten(): { clientId: string; clientSecret: string } {
  const clientId = leseVariable(VARIABLE_CLIENT_ID);
  const clientSecret = leseVariable(VARIABLE_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    throw new PaypalKonfigurationFehlt(
      `${VARIABLE_CLIENT_ID} und/oder ${VARIABLE_CLIENT_SECRET} sind nicht gesetzt. Beide entstehen ` +
        `beim Anlegen einer App im PayPal Developer Dashboard (developer.paypal.com) – Sandbox- und ` +
        `Live-App haben JEWEILS eigene Werte.`
    );
  }
  return { clientId, clientSecret };
}

/** Webhook-ID für die serverseitige Signaturprüfung. Entsteht erst, wenn der
 *  Webhook-Endpunkt im PayPal Dashboard angelegt wurde. */
export function leseWebhookId(): string {
  const wert = leseVariable(VARIABLE_WEBHOOK_ID);
  if (!wert) {
    throw new PaypalKonfigurationFehlt(
      `${VARIABLE_WEBHOOK_ID} ist nicht gesetzt. Entsteht erst, wenn der Webhook-Endpunkt in PayPal ` +
        `angelegt wurde (Dashboard → Webhooks → Endpunkt hinzufügen). Ohne sie lassen sich eingehende ` +
        `Ereignisse nicht auf Echtheit prüfen – sie werden deshalb sämtlich abgewiesen.`
    );
  }
  return wert;
}

export function paypalBasisUrl(): string {
  return istProduktivUmgebung() ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

export interface PaypalKonfigurationsStand {
  zahlungenMoeglich: boolean;
  ereignisseMoeglich: boolean;
  produktivUmgebung: boolean;
  offeneSchritte: string[];
}

export function paypalKonfigurationsStand(): PaypalKonfigurationsStand {
  const clientId = leseVariable(VARIABLE_CLIENT_ID);
  const clientSecret = leseVariable(VARIABLE_CLIENT_SECRET);
  const webhookId = leseVariable(VARIABLE_WEBHOOK_ID);

  const offeneSchritte: string[] = [];
  if (!clientId || !clientSecret) offeneSchritte.push(`${VARIABLE_CLIENT_ID}/${VARIABLE_CLIENT_SECRET} eintragen (PayPal Developer Dashboard)`);
  if (!webhookId) offeneSchritte.push(`Webhook-Endpunkt in PayPal anlegen, dann ${VARIABLE_WEBHOOK_ID} eintragen`);

  return {
    zahlungenMoeglich: Boolean(clientId && clientSecret),
    ereignisseMoeglich: Boolean(webhookId),
    produktivUmgebung: istProduktivUmgebung(),
    offeneSchritte,
  };
}

/**
 * Strukturdiagnose aller vier PayPal-Variablen (vorhanden/Länge/
 * Anführungszeichen/Leerzeichen) – NIEMALS die Werte selbst. PAYPAL_ENV hat
 * bewusst kein Präfix-Muster in `beginntMitErwartetemPraefix` (der einzig
 * gültige Wert ist "live", kein Präfix-Schema wie bei Stripes sk_/whsec_) –
 * ob er exakt "live" ergibt, steht bereits in produktivUmgebung/
 * paypalKonfigurationsStand(). Siehe feldDiagnose.ts für die Begründung und
 * lib/payments/registry.ts::zahlungsDiagnose() für die Verwendung.
 */
export function paypalFelderDiagnose(): Record<string, FeldDiagnose> {
  return {
    [VARIABLE_CLIENT_ID]: diagnostiziereFeld(VARIABLE_CLIENT_ID),
    [VARIABLE_CLIENT_SECRET]: diagnostiziereFeld(VARIABLE_CLIENT_SECRET),
    [VARIABLE_WEBHOOK_ID]: diagnostiziereFeld(VARIABLE_WEBHOOK_ID),
    [VARIABLE_ENV]: diagnostiziereFeld(VARIABLE_ENV),
  };
}

/** Warnt, wenn PAYPAL_ENV=live außerhalb des Produktivbetriebs gesetzt ist –
 *  dieselbe Überlegung wie warneBeiProduktivSchluessel() bei Stripe. */
export function warneBeiProduktivUmgebung(): void {
  if (istProduktivUmgebung() && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[paypal] ACHTUNG: ${VARIABLE_ENV}=live ist gesetzt, die Anwendung läuft aber nicht im ` +
        `Produktivbetrieb. Zahlungen wären ECHT. Für Tests ${VARIABLE_ENV}=sandbox verwenden.`
    );
  }
}
