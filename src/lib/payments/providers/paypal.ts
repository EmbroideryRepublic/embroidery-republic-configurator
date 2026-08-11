/**
 * ═══════════════════════════════════════════════════════════════════════
 * PAYPAL-ANBIETER – Adapter für den Zahlungsport
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Die EINZIGE Datei, die die PayPal-API kennt. Erfüllt exakt den Port
 * (`eroeffne`, `leseEreignis`, `verwerfe`) und übersetzt zwischen PayPals
 * Begriffen und unseren – dieselbe Rolle wie stripe.ts für Stripe.
 *
 * ── Zwei strukturelle Unterschiede zu Stripe ───────────────────────────
 *
 * 1. CAPTURE IST EIN EIGENER SCHRITT. Eine angelegte PayPal-Order zieht das
 *    Geld nicht automatisch ein wie eine abgeschlossene Stripe-Session –
 *    ohne einen expliziten `POST .../capture`-Aufruf bleibt sie nur
 *    "genehmigt". Dieser Aufruf läuft HIER, ausgelöst vom Webhook-Ereignis
 *    `CHECKOUT.ORDER.APPROVED` – NICHT auf der Rückkehr-Seite (die bleibt
 *    lesend/zustandslos, wie im gesamten Bestellablauf). Der fachliche
 *    "bezahlt"-Übergang erfolgt weiterhin ausschließlich beim NACHFOLGENDEN
 *    Ereignis `PAYMENT.CAPTURE.COMPLETED`, das PayPal nach erfolgreicher
 *    Capture separat zustellt – `CHECKOUT.ORDER.APPROVED` selbst übersetzt
 *    sich deshalb absichtlich in `null` (keine Zustandsänderung).
 *
 * 2. DIE WEBHOOK-VERIFIZIERUNG IST EIN NETZWERK-AUFRUF. Stripe prüft lokal
 *    per HMAC (`stripe().webhooks.constructEvent`, kein Netz nötig). PayPal
 *    verlangt einen POST an seine eigene verify-webhook-signature-API mit
 *    mehreren Headern der eingehenden Anfrage – deshalb ist `leseEreignis`
 *    hier "echt" asynchron, nicht nur der Form nach.
 */
import {
  SignaturUngueltigFehler,
  type ZahlungsAnbieter,
  type ZahlungsEreignis,
  type Zahlungsauftrag,
  type Zahlungseroeffnung,
} from '../types';
import {
  leseClientZugangsdaten,
  leseWebhookId,
  paypalBasisUrl,
} from './paypalKonfiguration';

interface Token {
  wert: string;
  gueltigBis: number;
}

/** Zwischengespeicherter OAuth2-Token je Prozess – PayPal-Tokens sind
 *  mehrere Stunden gültig, ein Token je Aufruf zu holen wäre reine
 *  Verschwendung. 60 Sekunden Sicherheitsabstand vor Ablauf. */
let token: Token | null = null;

async function holeZugriffstoken(): Promise<string> {
  if (token && token.gueltigBis > Date.now()) return token.wert;

  const { clientId, clientSecret } = leseClientZugangsdaten();
  const antwort = await fetch(`${paypalBasisUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!antwort.ok) {
    throw new Error(`PayPal-OAuth-Token nicht erhalten (${antwort.status}).`);
  }
  const daten = (await antwort.json()) as { access_token: string; expires_in: number };
  token = { wert: daten.access_token, gueltigBis: Date.now() + (daten.expires_in - 60) * 1000 };
  return token.wert;
}

async function paypalFetch(pfad: string, init: RequestInit): Promise<Response> {
  const zugriffstoken = await holeZugriffstoken();
  return fetch(`${paypalBasisUrl()}${pfad}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${zugriffstoken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

interface PaypalOrderAntwort {
  id: string;
  links?: { rel: string; href: string }[];
}

export const paypalAnbieter: ZahlungsAnbieter = {
  id: 'paypal',

  async eroeffne(auftrag: Zahlungsauftrag): Promise<Zahlungseroeffnung> {
    const antwort = await paypalFetch('/v2/checkout/orders', {
      method: 'POST',
      // Verhindert, dass ein wiederholter Aufruf innerhalb desselben
      // Versuchs eine zweite Order anlegt – PayPals Pendant zu Stripes
      // idempotencyKey.
      headers: { 'PayPal-Request-Id': auftrag.idempotenzSchluessel },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            // Die Zuordnung zu unserer Bestellung. Wird von PayPal auf die
            // Capture kopiert und ist dort in leseEreignis wieder auslesbar –
            // GENAU wie Stripes metadata.bestellId auf der Session.
            custom_id: auftrag.bestellId,
            amount: {
              currency_code: auftrag.waehrung,
              value: (auftrag.betragCent / 100).toFixed(2),
            },
            description: auftrag.beschreibung,
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: auftrag.rueckkehrUrl,
              cancel_url: auftrag.abbruchUrl,
              user_action: 'PAY_NOW',
            },
          },
        },
      }),
    });

    if (!antwort.ok) {
      const fehlertext = await antwort.text().catch(() => '');
      throw new Error(`PayPal-Order nicht angelegt (${antwort.status}): ${fehlertext.slice(0, 500)}`);
    }
    const angelegt = (await antwort.json()) as PaypalOrderAntwort;
    const genehmigungsLink = angelegt.links?.find((l) => l.rel === 'approve')?.href;
    if (!genehmigungsLink) {
      throw new Error(`PayPal-Order ${angelegt.id} ohne Genehmigungs-Link ("approve").`);
    }
    return { referenz: angelegt.id, weiterleitungUrl: genehmigungsLink };
  },

  async leseEreignis(rohBody: string, headers: Headers): Promise<ZahlungsEreignis | null> {
    let ereignis: PaypalWebhookEreignis;
    try {
      ereignis = JSON.parse(rohBody) as PaypalWebhookEreignis;
    } catch {
      console.warn('[zahlung:paypal] Ereignis ist kein gültiges JSON.');
      throw new SignaturUngueltigFehler('Rohtext ist kein gültiges JSON.');
    }

    const echt = await istEchtesEreignis(rohBody, ereignis, headers);
    if (!echt) {
      console.warn('[zahlung:paypal] Signaturprüfung fehlgeschlagen – Ereignis verworfen.');
      throw new SignaturUngueltigFehler('PayPal-Signaturprüfung fehlgeschlagen.');
    }

    if (ereignis.event_type === 'CHECKOUT.ORDER.APPROVED') {
      // Genehmigt heißt noch nicht bezahlt – erst die (separat zugestellte)
      // Capture-Bestätigung bewegt unseren Zustand, siehe Kopfkommentar.
      await capture(ereignis.resource.id);
      return null;
    }

    if (ereignis.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      return ausCapture(ereignis, 'bestaetigt');
    }
    if (ereignis.event_type === 'PAYMENT.CAPTURE.DENIED') {
      return ausCapture(ereignis, 'fehlgeschlagen');
    }

    // Alles Übrige: nicht relevant.
    return null;
  },

  async verwerfe(referenz: string): Promise<void> {
    // PayPal bietet keinen direkten "Order stornieren"-Aufruf. Eine nicht
    // genehmigte/nicht gecapturte Order verfällt von selbst (~3 Stunden) –
    // Wirft NICHT, wie der Port es zusagt.
    console.info(`[zahlung:paypal] Vorgang ${referenz} nicht aktiv verworfen (verfällt selbstständig).`);
  },
};

interface PaypalWebhookEreignis {
  id: string;
  event_type: string;
  resource: {
    id: string;
    custom_id?: string;
    amount?: { value: string; currency_code: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}

/**
 * Ruft PayPals eigene Verifizierungs-API auf – ein Netzwerk-Aufruf, anders
 * als Stripes lokale HMAC-Prüfung (siehe Kopfkommentar).
 *
 * Gibt `false` NUR zurück, wenn die Echtheit NACHWEISLICH nicht gegeben ist
 * (Header fehlen, Konfiguration fehlt, oder PayPal antwortet regulär mit
 * `verification_status !== 'SUCCESS'`) – all das bildet `leseEreignis` auf
 * `SignaturUngueltigFehler`/HTTP 400 ab (keine Wiederholung sinnvoll).
 *
 * Ein TECHNISCHER Fehlschlag beim Verifizierungsaufruf SELBST (unser
 * Netzwerk zu PayPal down, PayPals Verify-Endpoint antwortet mit einem
 * eigenen Serverfehler, die Antwort ist kein gültiges JSON) ist dagegen
 * UNSER Problem, keine Aussage über die Echtheit des ursprünglichen
 * Ereignisses – deshalb wird hier bewusst NICHT abgefangen und `false`
 * zurückgegeben (das würde in der Route als "ungültige Signatur" mit 400
 * enden und PayPal von einer eigentlich gewünschten Wiederholung abhalten).
 * Stattdessen wird ein gewöhnlicher `Error` geworfen, der unverändert bis
 * zur Webhook-Route durchreicht und dort – weil er KEIN
 * `SignaturUngueltigFehler` ist – zu HTTP 500 führt (siehe route.ts).
 */
async function istEchtesEreignis(rohBody: string, ereignis: PaypalWebhookEreignis, headers: Headers): Promise<boolean> {
  let webhookId: string;
  try {
    webhookId = leseWebhookId();
  } catch (err) {
    console.error(`[zahlung:paypal] Keine Webhook-ID – Ereignis verworfen: ${err instanceof Error ? err.message : err}`);
    return false;
  }

  const transmissionId = headers.get('paypal-transmission-id');
  const transmissionTime = headers.get('paypal-transmission-time');
  const certUrl = headers.get('paypal-cert-url');
  const authAlgo = headers.get('paypal-auth-algo');
  const transmissionSig = headers.get('paypal-transmission-sig');
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    console.warn('[zahlung:paypal] Verifizierungs-Header fehlen – Ereignis verworfen.');
    return false;
  }

  // KEIN try/catch um den Netzwerkaufruf: siehe Funktionskommentar. Ein
  // Fehlschlag hier (fetch wirft, PayPal antwortet nicht ok, ungültiges
  // JSON) ist technisch, nicht fachlich – er propagiert unverändert nach
  // oben bis zur Webhook-Route (HTTP 500, PayPal stellt erneut zu).
  const antwort = await paypalFetch('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: JSON.parse(rohBody),
    }),
  });
  if (!antwort.ok) {
    // PayPals Verify-Endpoint dokumentiert eine reguläre, erfolgreiche
    // Antwort (200) mit `verification_status` als Ausdruck einer FACHLICHEN
    // Ablehnung – ein Nicht-2xx-Status hier bedeutet, dass der Aufruf selbst
    // technisch scheiterte (Auth-/Ratenlimit-/Serverfehler bei PayPal), nicht
    // dass die ursprüngliche Signatur ungültig wäre.
    throw new Error(`PayPal-Verifizierungsaufruf technisch fehlgeschlagen (${antwort.status}).`);
  }
  const ergebnis = (await antwort.json()) as { verification_status?: string };
  return ergebnis.verification_status === 'SUCCESS';
}

/** Löst den Geldeinzug für eine genehmigte Order aus. Nicht-fatal: schlägt
 *  der Aufruf fehl (z.B. bereits gecaptured durch eine gleichzeitige
 *  Zustellung desselben Ereignisses), stellt PayPal ohnehin keine
 *  CAPTURE.COMPLETED-Meldung zu – unser Zustand bleibt dann korrekt
 *  unverändert, kein Sonderfall nötig. */
async function capture(orderId: string): Promise<void> {
  try {
    const antwort = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, { method: 'POST', body: '' });
    if (!antwort.ok) {
      const fehlertext = await antwort.text().catch(() => '');
      console.warn(`[zahlung:paypal] Capture für Order ${orderId} fehlgeschlagen (${antwort.status}): ${fehlertext.slice(0, 300)}`);
    }
  } catch (err) {
    console.error(`[zahlung:paypal] Capture für Order ${orderId} technisch fehlgeschlagen:`, err);
  }
}

/** Baut ein ZahlungsEreignis aus einem Capture-Webhook-Ereignis. */
function ausCapture(ereignis: PaypalWebhookEreignis, art: ZahlungsEreignis['art']): ZahlungsEreignis | null {
  // custom_id wurde beim Anlegen der Order gesetzt (purchase_units[0].custom_id)
  // und von PayPal auf die Capture kopiert – dieselbe Zuordnung wie Stripes
  // metadata.bestellId auf der Session.
  const bestellId = ereignis.resource.custom_id ?? '';
  if (!bestellId) {
    console.warn(`[zahlung:paypal] Ereignis ${ereignis.id} ohne custom_id (bestellId) – ignoriert.`);
    return null;
  }
  const orderId = ereignis.resource.supplementary_data?.related_ids?.order_id ?? ereignis.resource.id;
  const betragEuro = Number(ereignis.resource.amount?.value ?? '0');

  return {
    ereignisId: ereignis.id,
    bestellId,
    referenz: orderId,
    art,
    betragCent: Math.round(betragEuro * 100),
    waehrung: (ereignis.resource.amount?.currency_code ?? 'EUR').toUpperCase(),
    transaktionId: ereignis.resource.id,
    grund: `PayPal-Ereignis: ${ereignis.event_type}.`,
  };
}
