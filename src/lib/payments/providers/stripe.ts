/**
 * ═══════════════════════════════════════════════════════════════════════
 * STRIPE-ANBIETER – Adapter für den Zahlungsport
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Die EINZIGE Datei, die das Stripe-SDK kennt. Sie erfüllt exakt den Port
 * (`eroeffne`, `leseEreignis`, `verwerfe`, `erstatte`) und übersetzt zwischen
 * Stripes Begriffen und unseren. Alles darüber – Bestellzustand, Idempotenz,
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
import {
  SignaturUngueltigFehler,
  type Erstattungsauftrag,
  type Erstattungsergebnis,
  type ZahlungsAnbieter,
  type ZahlungsEreignis,
  type Zahlungsauftrag,
  type Zahlungseroeffnung,
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
 * Ereignistypen, die unseren Zustand bewegen. Disputes bleiben weiterhin
 * „nicht relevant" (null) – dafür gibt es keinen Ablauf.
 *
 * `charge.refunded` bewegte früher NICHTS (Audit Z7: „Eine Erstattung darf
 * eine bezahlte Bestellung nicht still auf ‚fehlgeschlagen' kippen" –
 * Erstattungen liefen bis dahin ausschließlich manuell). Das gilt
 * UNVERÄNDERT fort: `uebersetze()` übersetzt dieses Ereignis in `art:
 * 'erstattet'`, das laut eigenem Vertrag (siehe ZahlungsEreignisArt in
 * types.ts) `payment_status` NIE berühren darf – nur `refund_status`, und
 * nur bestätigend für eine Bestellung, die WIR bereits zur Erstattung
 * vorgemerkt haben. Die eigentliche Erstattung läuft über unseren eigenen
 * `erstatte()`-Aufruf; dieses Ereignis ist eine zweite, unabhängige
 * Bestätigung, kein Auslöser.
 */
type BestaetigungsTyp = 'checkout.session.completed' | 'checkout.session.async_payment_succeeded';
type FehlschlagTyp = 'checkout.session.async_payment_failed' | 'payment_intent.payment_failed';
type AblaufTyp = 'checkout.session.expired';
type ErstattungsTyp = 'charge.refunded';

const BESTAETIGUNG: readonly string[] = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
];
const FEHLSCHLAG: readonly string[] = [
  'checkout.session.async_payment_failed',
  'payment_intent.payment_failed',
];
const ABLAUF: readonly string[] = ['checkout.session.expired'];
const ERSTATTUNG: readonly string[] = ['charge.refunded'];

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
        // DIESELBEN Metadaten zusätzlich auf den entstehenden PaymentIntent
        // (und damit auf jede daraus entstehende Charge) kopieren – Checkout-
        // Session-Metadaten propagieren NICHT automatisch dorthin. Ohne dies
        // trüge ein späteres `charge.refunded`-Ereignis keine bestellId und
        // wäre nicht zuordenbar (siehe uebersetze() unten, ERSTATTUNG-Zweig).
        payment_intent_data: {
          metadata: { bestellId: auftrag.bestellId, bestellnummer: auftrag.bestellnummer },
        },
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

  async leseEreignis(rohBody: string, headers: Headers): Promise<ZahlungsEreignis | null> {
    const signatur = headers.get('stripe-signature');
    if (!signatur) {
      throw new SignaturUngueltigFehler('Kein stripe-signature-Header vorhanden.');
    }

    // Der Webhook-Schlüssel kann fehlen (gestaffelte Konfiguration, bevor der
    // Endpunkt in Stripe angelegt ist). Ohne ihn ist keine Echtheitsprüfung
    // möglich – dann lieber gar kein Ereignis als ein ungeprüftes, das jede
    // Bestellung als bezahlt melden könnte.
    let webhookSecret: string;
    try {
      webhookSecret = leseWebhookSchluessel();
    } catch (err) {
      console.error(`[zahlung:stripe] Kein Webhook-Schlüssel – Ereignis verworfen: ${err instanceof Error ? err.message : err}`);
      throw new SignaturUngueltigFehler('Kein Webhook-Schlüssel konfiguriert – Echtheit nicht prüfbar.');
    }

    let event: Stripe.Event;
    try {
      // Prüft die Signatur über den ROHTEXT. Jede Umformung machte sie
      // ungültig – deshalb bekommt diese Methode den Rohtext, nie geparstes
      // JSON (siehe Kopfkommentar der Webhook-Route).
      event = stripe().webhooks.constructEvent(rohBody, signatur, webhookSecret);
    } catch (err) {
      console.warn(`[zahlung:stripe] Signaturprüfung fehlgeschlagen: ${err instanceof Error ? err.message : err}`);
      throw new SignaturUngueltigFehler(
        `Signaturprüfung fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`
      );
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

  /**
   * `payment_intent` statt `charge`: `transaktionId` ist die PaymentIntent-ID,
   * die bereits bei der Zahlungsbestätigung gespeichert wird (siehe
   * `paymentService.ts`) – Stripe löst daraus selbst die zugehörige Charge
   * auf, ein zweiter gespeicherter Bezeichner ist nicht nötig.
   *
   * `idempotencyKey` ist hier – anders als bei `eroeffne()` – bei jedem
   * Aufruf für dieselbe Bestellung IDENTISCH (siehe `Erstattungsauftrag` in
   * types.ts): Stripe liefert bei einem wiederholten Aufruf mit demselben
   * Schlüssel innerhalb des von Stripe vorgehaltenen Zeitfensters (rund 24h)
   * das ursprüngliche Refund-Objekt zurück; die Sicherheit danach trägt eine
   * zweite Ebene (siehe Kopfkommentar von Erstattungsauftrag in types.ts).
   */
  async erstatte(auftrag: Erstattungsauftrag): Promise<Erstattungsergebnis> {
    const refund = await stripe().refunds.create(
      { payment_intent: auftrag.transaktionId, amount: auftrag.betragCent },
      { idempotencyKey: auftrag.idempotenzSchluessel }
    );
    return { erstattungsId: refund.id };
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

  if (ERSTATTUNG.includes(event.type)) {
    return ausCharge(event, event.data.object as Stripe.Charge);
  }

  // Alles Übrige (u.a. Disputes): nicht relevant.
  return null;
}

/**
 * Baut ein ZahlungsEreignis (`art: 'erstattet'`) aus einer Charge.
 *
 * `bestellId` kommt aus `charge.metadata` – NICHT aus einer Datenbankabfrage
 * (dieser Adapter kennt keine Datenbank, siehe Kopfkommentar der Datei). Ohne
 * die `payment_intent_data.metadata`-Ergänzung in `eroeffne()` oben trüge
 * eine Charge diese Metadaten nicht; Bestellungen, die VOR dieser Ergänzung
 * bezahlt wurden, liefern hier deshalb `null` – ein technisch unvermeidbarer,
 * bewusst hingenommener Rand (siehe Rückgabe unten, exakt dieselbe Behandlung
 * wie eine Session ohne bestellId in `ausSession()`).
 */
function ausCharge(event: Stripe.Event, charge: Stripe.Charge): ZahlungsEreignis | null {
  const bestellId = charge.metadata?.bestellId ?? '';
  if (!bestellId) {
    console.warn(`[zahlung:stripe] Erstattungsereignis ${event.id} ohne bestellId – ignoriert.`);
    return null;
  }
  const paymentIntent = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  // Die tatsächliche Erstattungs-ID (re_...) steht in charge.refunds.data –
  // dieses Feld liefert Stripe ohne gesonderten expand-Parameter auf jeder
  // Charge mit. Bei uns entsteht je Bestellung höchstens EINE Erstattung
  // (kein Teilrefund, siehe Migration 0029), deshalb genügt der neueste
  // Eintrag (Stripe listet absteigend). Fehlt das Feld ausnahmsweise (z.B.
  // ein API-Antwortformat ohne dieses Unterobjekt), fällt referenz auf die
  // Charge-ID zurück – schlechter als die Refund-ID, aber immer noch eine
  // beim Anbieter nachvollziehbare Referenz, kein Datenverlust.
  const erstattungsId = charge.refunds?.data?.[0]?.id ?? charge.id;

  return {
    ereignisId: event.id,
    bestellId,
    referenz: erstattungsId,
    art: 'erstattet',
    // Der AKTUELLE Gesamterstattungsbetrag der Charge – rein informativ für
    // die Historie. Maßgeblich für unseren eigenen Datensatz bleibt, was
    // WIR selbst bei `erstatte()` erhalten haben (siehe refundService.ts);
    // dieses Feld wird hier NICHT gegengeprüft.
    betragCent: charge.amount_refunded ?? 0,
    waehrung: (charge.currency ?? 'eur').toUpperCase(),
    transaktionId: paymentIntent,
    grund: `Stripe-Ereignis: ${event.type}.`,
  };
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
export type StripeRelevanteTypen = BestaetigungsTyp | FehlschlagTyp | AblaufTyp | ErstattungsTyp;
