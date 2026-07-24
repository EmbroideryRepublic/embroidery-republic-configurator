/**
 * ═══════════════════════════════════════════════════════════════════════
 * STRIPE-ANBIETER – Adapter für den Zahlungsport
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Die EINZIGE Datei, die das Stripe-SDK kennt. Sie erfüllt exakt den Port
 * (`eroeffne`, `leseEreignis`, `verwerfe`) und übersetzt zwischen Stripes
 * Begriffen und unseren. Alles darüber – Bestellzustand, Idempotenz,
 * Phase 2 – bleibt anbieterunabhängig (siehe docs/zahlungsarchitektur.md,
 * docs/stripe-adapter-plan.md).
 *
 * ── Gehostetes Checkout, keine Kartendaten bei uns ────────────────────
 * `eroeffne` legt eine Checkout Session an und gibt deren URL zurück; die
 * Kundschaft zahlt auf Stripes Seite. Kartendaten berühren uns nie – das
 * ist der Hauptgrund für Checkout statt Elements.
 *
 * ── Der Anbieter entscheidet nie fachlich ─────────────────────────────
 * `leseEreignis` prüft nur die Echtheit und übersetzt in eines von vier
 * Ergebnissen. OB eine Bestellung als bezahlt gilt, entscheidet
 * `paymentService.ts` – hier wird nichts geschrieben.
 */
import Stripe from 'stripe';
import type {
  ZahlungsAnbieter,
  ZahlungsEreignis,
  Zahlungsauftrag,
  Zahlungseroeffnung,
} from '../types';
import { leseGeheimenSchluessel, leseWebhookSchluessel } from './stripeKonfiguration';

/**
 * Ein einziger Client je Prozess.
 *
 * Lazy, damit der bloße Import dieser Datei ohne Schlüssel nicht wirft –
 * die Registry entscheidet über `stripeKonfiguration`, ob der Anbieter
 * überhaupt angeboten wird. `apiVersion` wird bewusst NICHT gepinnt: Das
 * SDK bringt seine geprüfte Standardversion mit; ein hier hartkodierter
 * Wert liefe ihr über die Zeit davon.
 */
let client: Stripe | null = null;
function stripe(): Stripe {
  if (!client) {
    client = new Stripe(leseGeheimenSchluessel());
  }
  return client;
}

/**
 * Ereignistypen, die unseren Zustand bewegen. Alle anderen – darunter
 * ausdrücklich `charge.refunded` und Disputes – werden als „nicht relevant"
 * (null) behandelt: Eine Erstattung darf eine bezahlte Bestellung nicht
 * still auf „fehlgeschlagen" kippen (Audit Z7). Erstattungen laufen bis auf
 * Weiteres manuell.
 */
type BestaetigungsTyp = 'checkout.session.completed' | 'checkout.session.async_payment_succeeded';
type FehlschlagTyp = 'checkout.session.async_payment_failed' | 'payment_intent.payment_failed';
type AblaufTyp = 'checkout.session.expired';

const BESTAETIGUNG: readonly string[] = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
];
const FEHLSCHLAG: readonly string[] = [
  'checkout.session.async_payment_failed',
  'payment_intent.payment_failed',
];
const ABLAUF: readonly string[] = ['checkout.session.expired'];

export const stripeAnbieter: ZahlungsAnbieter = {
  id: 'stripe',

  async eroeffne(auftrag: Zahlungsauftrag): Promise<Zahlungseroeffnung> {
    // EIN Posten mit dem Gesamtbetrag. Die Aufschlüsselung bleibt bei uns –
    // sie Stripe zu übergeben hieße zwei Quellen für dieselbe Zahl.
    const session = await stripe().checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: auftrag.waehrung.toLowerCase(),
              unit_amount: auftrag.betragCent, // ganze Cent, wie Stripe erwartet
              product_data: { name: `Bestellung ${auftrag.bestellnummer}` },
            },
          },
        ],
        success_url: auftrag.rueckkehrUrl,
        cancel_url: auftrag.abbruchUrl,
        // Die Zuordnung. metadata.bestellId ist maßgeblich – NICHT die
        // Referenz, die nach einer Wiederaufnahme auf einen neueren Vorgang
        // zeigt (siehe types.ts, ZahlungsEreignis.bestellId).
        metadata: { bestellId: auftrag.bestellId, bestellnummer: auftrag.bestellnummer },
        client_reference_id: auftrag.bestellId,
      },
      // Verhindert, dass ein wiederholter Aufruf innerhalb desselben
      // Versuchs eine zweite Session anlegt.
      { idempotencyKey: auftrag.idempotenzSchluessel }
    );

    if (!session.url) {
      // Ohne URL gäbe es nichts, wohin weitergeleitet werden könnte – ein
      // technischer Fehlschlag, der oben als solcher behandelt wird.
      throw new Error(`Stripe-Session ${session.id} ohne Weiterleitungs-URL.`);
    }
    return { referenz: session.id, weiterleitungUrl: session.url };
  },

  leseEreignis(rohBody: string, signatur: string | null): ZahlungsEreignis | null {
    if (!signatur) return null;

    // Der Webhook-Schlüssel kann fehlen (gestaffelte Konfiguration, bevor der
    // Endpunkt in Stripe angelegt ist). Ohne ihn ist keine Echtheitsprüfung
    // möglich – dann lieber gar kein Ereignis als ein ungeprüftes, das jede
    // Bestellung als bezahlt melden könnte.
    let webhookSecret: string;
    try {
      webhookSecret = leseWebhookSchluessel();
    } catch (err) {
      console.error(`[zahlung:stripe] Kein Webhook-Schlüssel – Ereignis verworfen: ${err instanceof Error ? err.message : err}`);
      return null;
    }

    let event: Stripe.Event;
    try {
      // Prüft die Signatur über den ROHTEXT. Jede Umformung machte sie
      // ungültig – deshalb bekommt diese Methode den Rohtext, nie geparstes
      // JSON (siehe Kopfkommentar der Webhook-Route).
      event = stripe().webhooks.constructEvent(rohBody, signatur, webhookSecret);
    } catch (err) {
      console.warn(`[zahlung:stripe] Signaturprüfung fehlgeschlagen: ${err instanceof Error ? err.message : err}`);
      return null;
    }

    return uebersetze(event);
  },

  async verwerfe(referenz: string): Promise<void> {
    // Erklärt eine offene Session für ungültig, damit nach einer
    // Wiederaufnahme nicht zwei Sessions zugleich bezahlbar sind.
    //
    // Wirft NICHT: Eine bereits abgelaufene oder abgeschlossene Session ist
    // der Normalfall, kein Fehler. Stripe meldet das als Fehler – wir fangen
    // ihn und behandeln ihn als „schon erledigt".
    try {
      await stripe().checkout.sessions.expire(referenz);
    } catch (err) {
      console.info(`[zahlung:stripe] Vorgang ${referenz} nicht verworfen (vermutlich bereits beendet): ${err instanceof Error ? err.message : err}`);
    }
  },
};

/**
 * Übersetzt ein echtes Stripe-Ereignis in unsere vier Ausgänge.
 *
 * Gibt `null` für alles, was unseren Zustand nicht bewegt – das ist der
 * Regelfall (Stripe sendet dutzende Ereignistypen). Ein unbekannter Typ ist
 * kein Fehler, sondern schlicht nicht relevant.
 */
function uebersetze(event: Stripe.Event): ZahlungsEreignis | null {
  if (BESTAETIGUNG.includes(event.type)) {
    const session = event.data.object as Stripe.Checkout.Session;
    // `completed` heißt NICHT automatisch bezahlt: Bei verzögerten Verfahren
    // (z.B. Lastschrift) kann die Session abgeschlossen, aber noch `unpaid`
    // sein. Nur `paid` gilt als Zahlung.
    if (event.type === 'checkout.session.completed' && session.payment_status !== 'paid') {
      return null;
    }
    return ausSession(event, session, 'bestaetigt');
  }

  if (FEHLSCHLAG.includes(event.type)) {
    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const bestellId = pi.metadata?.bestellId ?? '';
      if (!bestellId) return null;
      return {
        ereignisId: event.id,
        bestellId,
        referenz: typeof pi.id === 'string' ? pi.id : '',
        art: 'fehlgeschlagen',
        betragCent: pi.amount ?? 0,
        waehrung: (pi.currency ?? 'eur').toUpperCase(),
        transaktionId: typeof pi.id === 'string' ? pi.id : undefined,
        grund: pi.last_payment_error?.message ?? 'Zahlung fehlgeschlagen.',
      };
    }
    return ausSession(event, event.data.object as Stripe.Checkout.Session, 'fehlgeschlagen');
  }

  if (ABLAUF.includes(event.type)) {
    return ausSession(event, event.data.object as Stripe.Checkout.Session, 'abgelaufen');
  }

  // Alles Übrige (inkl. charge.refunded, Disputes): nicht relevant.
  return null;
}

/** Baut ein ZahlungsEreignis aus einer Checkout Session. */
function ausSession(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  art: ZahlungsEreignis['art']
): ZahlungsEreignis | null {
  const bestellId = session.metadata?.bestellId ?? session.client_reference_id ?? '';
  if (!bestellId) {
    // Ohne Zuordnung ist das Ereignis für uns wertlos. Kein Fehler – es
    // gehört vermutlich zu einer Session, die nicht von uns stammt.
    console.warn(`[zahlung:stripe] Ereignis ${event.id} ohne bestellId – ignoriert.`);
    return null;
  }
  const paymentIntent =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

  return {
    ereignisId: event.id,
    bestellId,
    referenz: session.id,
    art,
    // amount_total ist der tatsächlich autorisierte Betrag – genau der wird
    // oben gegen unseren gespeicherten Betrag geprüft.
    betragCent: session.amount_total ?? 0,
    waehrung: (session.currency ?? 'eur').toUpperCase(),
    transaktionId: paymentIntent,
    grund: `Stripe-Ereignis: ${event.type}.`,
  };
}

// Nur damit die Typaliase nicht als ungenutzt gelten – sie dokumentieren die
// abgedeckten Ereignistypen an einer Stelle.
export type StripeRelevanteTypen = BestaetigungsTyp | FehlschlagTyp | AblaufTyp;
