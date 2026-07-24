/**
 * ═══════════════════════════════════════════════════════════════════════
 * KONFIGURATION DES STRIPE-ADAPTERS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Liest und prüft die Zugangsdaten. Bewusst eine eigene Datei: Sie lässt
 * sich vollständig testen, bevor das Stripe-SDK überhaupt eingebunden ist,
 * und der spätere Adapter bleibt frei von Konfigurationsakrobatik.
 *
 * ── Keine stillen Ausweichwege ────────────────────────────────────────
 * Es gibt keinen Standardwert, keine Notlösung und kein „läuft schon
 * irgendwie". Fehlt ein Schlüssel, wird das mit einer Meldung gemeldet, die
 * sagt, WAS fehlt und WO es herkommt. Ein Zahlungsadapter, der bei fehlender
 * Konfiguration stillschweigend weitermacht, ist die gefährlichste Variante
 * überhaupt: Im besten Fall scheitert eine Zahlung unverständlich, im
 * schlimmsten gilt eine unbezahlte Bestellung als bezahlt.
 *
 * ── Gestaffelt, nicht alles auf einmal ────────────────────────────────
 * Die beiden Schlüssel entstehen zu VERSCHIEDENEN Zeitpunkten:
 *
 *   1. `STRIPE_SECRET_KEY` – sofort nach Anlegen des Stripe-Kontos.
 *   2. `STRIPE_WEBHOOK_SECRET` – erst NACHDEM der Webhook-Endpunkt in
 *      Stripe eingerichtet wurde. Vorher existiert er schlicht nicht.
 *
 * Deshalb prüft jede Fähigkeit nur, was SIE braucht: Zahlungen lassen sich
 * bereits eröffnen, während die Ereignisverarbeitung noch nicht
 * einsatzbereit ist. Eine Rundum-Prüfung beim Start würde die Einrichtung
 * unnötig blockieren.
 *
 * ── Schlüssel tauchen NIEMALS im Protokoll auf ────────────────────────
 * Keine Fehlermeldung dieser Datei enthält einen Schlüsselwert – auch nicht
 * gekürzt. Protokolle landen in Dateien, in Fehlerdiensten und in
 * Kopien davon.
 */

/** Fehlt oder ist unbrauchbar – mit Hinweis, was zu tun ist. */
export class StripeKonfigurationFehlt extends Error {
  constructor(nachricht: string) {
    super(nachricht);
    this.name = 'StripeKonfigurationFehlt';
  }
}

const VARIABLE_GEHEIM = 'STRIPE_SECRET_KEY';
const VARIABLE_WEBHOOK = 'STRIPE_WEBHOOK_SECRET';

function leseVariable(name: string): string | null {
  const wert = process.env[name]?.trim();
  return wert ? wert : null;
}

/**
 * Geheimer Schlüssel für Aufrufe an Stripe (`eroeffne`, `verwerfe`).
 *
 * Wirft, wenn er fehlt oder offensichtlich falsch ist. Der Aufrufer ist der
 * Adapter; die Registry übersetzt die Ausnahme in „Anbieter nicht
 * eingerichtet".
 */
export function leseGeheimenSchluessel(): string {
  const wert = leseVariable(VARIABLE_GEHEIM);
  if (!wert) {
    throw new StripeKonfigurationFehlt(
      `${VARIABLE_GEHEIM} ist nicht gesetzt. Der Schlüssel steht im Stripe-Dashboard ` +
        `unter „Entwickler → API-Schlüssel" und beginnt mit „sk_test_" (Testmodus) ` +
        `bzw. „sk_live_" (Produktivbetrieb).`
    );
  }
  if (!wert.startsWith('sk_')) {
    // Häufigste Verwechslung: der veröffentlichbare Schlüssel (pk_) wurde
    // eingetragen. Damit schlägt JEDER Aufruf fehl – besser sofort und mit
    // klarer Ansage als später mit einer Stripe-Fehlermeldung.
    throw new StripeKonfigurationFehlt(
      `${VARIABLE_GEHEIM} sieht nicht wie ein geheimer Stripe-Schlüssel aus (erwartet wird ein Wert, der mit „sk_" beginnt). ` +
        `Wurde versehentlich der veröffentlichbare Schlüssel („pk_…") eingetragen?`
    );
  }
  return wert;
}

/**
 * Signaturschlüssel für eingehende Webhooks (`leseEreignis`).
 *
 * Entsteht ERST, wenn der Endpunkt in Stripe angelegt wurde. Bis dahin ist
 * sein Fehlen kein Konfigurationsfehler, sondern ein normaler
 * Zwischenzustand – die Meldung sagt das auch so.
 */
export function leseWebhookSchluessel(): string {
  const wert = leseVariable(VARIABLE_WEBHOOK);
  if (!wert) {
    throw new StripeKonfigurationFehlt(
      `${VARIABLE_WEBHOOK} ist nicht gesetzt. Dieser Schlüssel entsteht erst, wenn der ` +
        `Webhook-Endpunkt in Stripe angelegt wurde („Entwickler → Webhooks → Endpunkt hinzufügen"). ` +
        `Er beginnt mit „whsec_". Ohne ihn lassen sich eingehende Ereignisse nicht auf Echtheit prüfen – ` +
        `sie werden deshalb sämtlich abgewiesen.`
    );
  }
  if (!wert.startsWith('whsec_')) {
    throw new StripeKonfigurationFehlt(
      `${VARIABLE_WEBHOOK} sieht nicht wie ein Stripe-Signaturschlüssel aus (erwartet wird ein Wert, der mit „whsec_" beginnt).`
    );
  }
  return wert;
}

export interface StripeKonfigurationsStand {
  /** Zahlungen können eröffnet und verworfen werden. */
  zahlungenMoeglich: boolean;
  /** Eingehende Ereignisse können auf Echtheit geprüft werden. */
  ereignisseMoeglich: boolean;
  /** true = Schlüssel des Produktivbetriebs (`sk_live_`). */
  produktivSchluessel: boolean;
  /** Was noch fehlt, in der Reihenfolge der Einrichtung. */
  offeneSchritte: string[];
}

/**
 * Aktueller Stand der Einrichtung – für Diagnose und Startprotokoll.
 *
 * Wirft NICHT. Sie beantwortet die Frage „wie weit sind wir?", nicht „darf
 * ich jetzt etwas tun?". Letzteres beantworten die beiden Lesefunktionen,
 * und zwar jeweils erst dann, wenn es tatsächlich gebraucht wird.
 */
export function stripeKonfigurationsStand(): StripeKonfigurationsStand {
  const geheim = leseVariable(VARIABLE_GEHEIM);
  const webhook = leseVariable(VARIABLE_WEBHOOK);
  const geheimGueltig = Boolean(geheim?.startsWith('sk_'));
  const webhookGueltig = Boolean(webhook?.startsWith('whsec_'));

  const offeneSchritte: string[] = [];
  if (!geheim) offeneSchritte.push(`${VARIABLE_GEHEIM} eintragen (Stripe → Entwickler → API-Schlüssel)`);
  else if (!geheimGueltig) offeneSchritte.push(`${VARIABLE_GEHEIM} prüfen – beginnt nicht mit „sk_"`);
  if (!webhook) offeneSchritte.push(`Webhook-Endpunkt in Stripe anlegen, dann ${VARIABLE_WEBHOOK} eintragen`);
  else if (!webhookGueltig) offeneSchritte.push(`${VARIABLE_WEBHOOK} prüfen – beginnt nicht mit „whsec_"`);

  return {
    zahlungenMoeglich: geheimGueltig,
    ereignisseMoeglich: webhookGueltig,
    produktivSchluessel: Boolean(geheim?.startsWith('sk_live_')),
    offeneSchritte,
  };
}

/**
 * Warnt, wenn ein PRODUKTIVER Schlüssel außerhalb des Produktivbetriebs
 * verwendet wird.
 *
 * Ein `sk_live_` in der Entwicklungsumgebung bedeutet: echte Zahlungen mit
 * echtem Geld, ausgelöst durch Testläufe. Das ist der teuerste denkbare
 * Konfigurationsfehler, und er sieht bis zur Kontoabrechnung völlig normal
 * aus.
 */
export function warneBeiProduktivSchluessel(): void {
  const stand = stripeKonfigurationsStand();
  if (stand.produktivSchluessel && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[stripe] ACHTUNG: Es ist ein PRODUKTIVER Schlüssel (sk_live_) hinterlegt, ` +
        `die Anwendung läuft aber nicht im Produktivbetrieb. Zahlungen wären ECHT. ` +
        `Für Tests den Schlüssel aus dem Stripe-Testmodus verwenden (sk_test_…).`
    );
  }
}
