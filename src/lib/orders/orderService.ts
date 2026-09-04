/**
 * ═══════════════════════════════════════════════════════════════════════
 * ZENTRALE Geschäftslogik einer Bestellung nach dem Bestelleingang.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * JEDE Zustandsänderung an einer Bestellung läuft über dieses Modul – es
 * gibt keinen zweiten Ort, an dem storniert oder freigegeben wird. Damit
 * bleibt die Regel „was darf wann passieren" an einer Stelle prüfbar,
 * statt sich über Server Actions, Seiten und Jobs zu verteilen.
 *
 * Hier gehören künftig hinein:
 *  - Freigabe der Lagerreservierung beim Stornieren, sobald es eine
 *    Bestandsführung gibt.
 *
 * (Kulanzstornierung durch den Betreiber, cancellation_source 'admin', sowie
 * die übrigen Statusübergänge sind bereits vollständig umgesetzt – siehe
 * setzeBestellstatus() unten und AdminCancelControl.tsx für den UI-Zugang.)
 *
 * ── Führende Quelle ist IMMER die Datenbank ────────────────────────────
 * Externe Dienste (Resend) sind reine Versandmechanismen. Schlägt dort
 * etwas fehl, wird das protokolliert – der Bestellstatus und der
 * Bearbeitungsablauf bleiben davon vollständig unberührt.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { removeProductionFiles } from '@/lib/supabase/storage';
import { stornofristLaeuftNoch } from '@/config/orderProcess';
import { formatiereZeitpunkt } from '@/lib/format';
import { widerrufeGeplanteEmail } from '@/lib/email/scheduledEmails';
import { sendOrderCancellationEmail } from '@/lib/email/orderEmails';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import type { OrderStatus } from '@/lib/actions/orderTypes';
import { istUebergangErlaubt } from '@/config/orderStatus';
import { produktionsfreigabeErlaubt } from '@/lib/orders/orderVisibility';
import { erzeugeBestellToken } from '@/lib/orders/orderAccessToken';
import { basisUrl } from '@/lib/seo/basisUrl';
import {
  sendOrderShippedEmail,
  sendOrderInProductionEmail,
  sendOrderCompletedEmail,
  sendOrderProofRequestEmail,
  sendProofFeedbackEmail,
  type EmailVersandErgebnis,
} from '@/lib/email/orderEmails';
import type { OrderItemsTableItem } from '@/lib/email/templates/EmailLayout';
import { meldeEreignis } from '@/lib/observability/ereignis';

export type StornoErgebnis =
  | {
      ok: true;
      bereitsStorniert: boolean;
      /**
       * Wird `true` genau bei einer FRISCHEN Stornierung einer bezahlten
       * Bestellung – der Aufrufer (Server Action) soll in diesem Fall direkt
       * im Anschluss `stelleErstattungSicher()` aus `refundService.ts`
       * anstoßen. Bewusst NICHT von hier aus aufgerufen: `refundService.ts`
       * importiert seinerseits aus dieser Datei (`protokolliereBestellereignis`)
       * – ein Aufruf in umgekehrter Richtung wäre ein Zirkelimport. Dieselbe
       * Schichtung wie zwischen orderService.ts und paymentService.ts.
       */
      erstattungAusstehend: boolean;
    }
  | { ok: false; grund: 'nicht-gefunden' | 'frist-abgelaufen' | 'keine-bestellung' | 'nicht-stornierbar' | 'fehler' };

export type StatusErgebnis =
  | {
      ok: true;
      von: OrderStatus;
      nach: OrderStatus;
      bereitsErreicht: boolean;
      /** Siehe StornoErgebnis.erstattungAusstehend – hier für die
       *  Kulanzstornierung durch den Betreiber. */
      erstattungAusstehend: boolean;
    }
  | {
      ok: false;
      grund: 'nicht-gefunden' | 'uebergang-unzulaessig' | 'noch-nicht-freigegeben' | 'freigabe-fehlt' | 'fehler';
      aktuell?: OrderStatus;
    };

/** Zeitstempelspalte, die beim jeweiligen Übergang gefüllt wird. */
const ZEITSTEMPEL_SPALTE: Partial<Record<OrderStatus, string>> = {
  in_production: 'production_started_at',
  shipped: 'shipped_at',
  completed: 'completed_at',
};

/**
 * Führt einen Statuswechsel durch — die EINZIGE Stelle dafür.
 *
 * Die Zulässigkeit prüft `istUebergangErlaubt` gegen die Zustandsmaschine in
 * `config/orderStatus.ts`. Damit ist ausgeschlossen, dass eine stornierte
 * Bestellung wieder in Produktion geht oder eine neue Bestellung den
 * Produktionsschritt überspringt.
 *
 * Der Übergang wird über eine Bedingung auf den Ausgangsstatus geschrieben
 * (`.eq('status', von)`). Zwei gleichzeitige Klicks im Adminbereich können
 * dadurch nicht beide gewinnen — genauso abgesichert wie die Stornierung.
 */
export async function setzeBestellstatus(
  orderId: string,
  nach: OrderStatus,
  optionen: { trackingNummer?: string; grund?: string; jetzt?: Date } = {}
): Promise<StatusErgebnis> {
  const jetzt = optionen.jetzt ?? new Date();
  const db = createAdminClient();

  const { data: bestellung, error } = await db
    .from('orders')
    .select(
      'id, email, status, order_type, created_at, payment_status, accounting_ready_at, tracking_number, carrier, freigabe_erteilt_am, order_number'
    )
    .eq('id', orderId)
    .maybeSingle<{
      id: string;
      email: string | null;
      status: OrderStatus;
      order_type: string;
      created_at: string;
      payment_status: string | null;
      accounting_ready_at: string | null;
      tracking_number: string | null;
      carrier: string | null;
      freigabe_erteilt_am: string | null;
      order_number: string | null;
    }>();

  if (error || !bestellung) return { ok: false, grund: 'nicht-gefunden' };

  const von = bestellung.status;

  // Erneuter Klick auf denselben Zielstatus ist kein Fehler. Eine bereits
  // storniert gewesene Bestellung hat ihren Erstattungsanstoß beim ERSTEN
  // Übergang schon bekommen (siehe unten) – kein zweiter hier nötig, ein
  // hängengebliebener Versuch hat im Admin-Bereich seinen eigenen Retry.
  if (von === nach) return { ok: true, von, nach, bereitsErreicht: true, erstattungAusstehend: false };

  if (!istUebergangErlaubt(von, nach)) {
    return { ok: false, grund: 'uebergang-unzulaessig', aktuell: von };
  }

  // Dieselbe Regel wie die Produktionsfreigabe im Adminbereich
  // (orderVisibility.ts::produktionsfreigabeErlaubt): Vor Ablauf der
  // Stornofrist darf noch nicht bearbeitet werden – sonst könnte Ware
  // beschafft werden, die der Kunde Sekunden später doch noch storniert.
  // Die Admin-UI verbirgt den Button dafür zwar, aber die Server Action
  // selbst muss dieselbe Grenze durchsetzen, sonst schützt sie nur vor der
  // eigenen Oberfläche, nicht vor einem direkten Aufruf. Seit der Trennung
  // von Sichtbarkeit und Produktionsfreigabe (2026-08-25) ist DIESE Prüfung
  // hier die einzige verbliebene Bedeutung der früheren „Sichtbarkeitsregel"
  // – die Admin-Seiten selbst filtern nichts mehr.
  // Ausnahme: eine Stornierung ist immer erlaubt, das widerspricht der Regel
  // nicht – im Gegenteil, sie ist genau das, wovor die Regel schützen will.
  if (nach !== 'cancelled') {
    const freigegeben = produktionsfreigabeErlaubt(
      {
        createdAt: bestellung.created_at,
        status: von,
        orderType: bestellung.order_type,
        paymentStatus: bestellung.payment_status ?? 'not_required',
        // `von` ist hier NIE 'cancelled' (dieser Zweig läuft nur, wenn
        // `nach !== 'cancelled'`, und `istUebergangErlaubt('cancelled', …)`
        // ist für JEDEN Zielstatus false – ein Endzustand hat keine
        // ausgehenden Übergänge, siehe config/orderStatus.ts). Der Wert
        // fließt deshalb nie in eine Entscheidung ein.
        refundStatus: 'not_applicable',
      },
      jetzt
    );
    if (!freigegeben) {
      return { ok: false, grund: 'noch-nicht-freigegeben', aktuell: von };
    }
  }

  // Zusätzliche, von produktionsfreigabeErlaubt() UNABHÄNGIGE Bedingung: die
  // Kundschaft muss die Druckvorschau ausdrücklich freigegeben haben, bevor
  // die Produktion tatsächlich beginnt (FAQ/Über-uns versprechen genau das).
  // Bewusst NICHT in produktionsfreigabeErlaubt() integriert – diese Funktion
  // gated auch die Lieferanten-/Textilbestellung (admin/data.ts), und der
  // Rohstoffeinkauf soll unabhängig vom Motiv-Freigabestatus weiterlaufen
  // können. Nur der Übergang NACH 'in_production' braucht die Prüfung – die
  // Zustandsmaschine erlaubt ausschließlich new→in_production→shipped→
  // completed, ein späterer Übergang kann diesen Schritt nie überspringen.
  if (nach === 'in_production' && !bestellung.freigabe_erteilt_am) {
    return { ok: false, grund: 'freigabe-fehlt', aktuell: von };
  }

  const feld = ZEITSTEMPEL_SPALTE[nach];
  const patch: Record<string, unknown> = { status: nach };
  if (feld) patch[feld] = jetzt.toISOString();
  if (optionen.trackingNummer?.trim()) patch.tracking_number = optionen.trackingNummer.trim();
  // Kulanzstornierung einer BEREITS bezahlten Bestellung: eine Rückerstattung
  // wird fällig. Siehe supabase/migrations/0029_rueckerstattung.sql und
  // refundService.ts – tatsächlich ausgelöst wird sie vom Aufrufer dieser
  // Funktion (StornoErgebnis.erstattungAusstehend, siehe oben).
  const erstattungAusstehend = nach === 'cancelled' && bestellung.payment_status === 'paid';
  if (erstattungAusstehend) patch.refund_status = 'required';
  if (nach === 'cancelled') {
    // Bislang setzte NUR die Kunden-Selbststornierung (storniereBestellungDurchKunden)
    // cancelled_at/cancellation_source – die Admin-Kulanzstornierung hier tat
    // das nie (siehe ZEITSTEMPEL_SPALTE oben, kein Eintrag für 'cancelled').
    // Ohne diese Ergänzung hätte die Accounting-Sync-Schnittstelle (siehe
    // AccountingOrderDto.cancelledAt) für jede Admin-Stornierung fälschlich
    // `cancelledAt: null` gemeldet, obwohl status bereits 'cancelled' ist.
    patch.cancelled_at = jetzt.toISOString();
    patch.cancellation_source = 'admin';
    // Redelivery-Signal für die Buchhaltungs-Synchronisierung: Der Sync-
    // Cursor ist (accounting_ready_at, id) aufsteigend – ein erneutes Setzen
    // liefert eine bereits einmal ausgelieferte Bestellung im nächsten
    // Sync-Lauf automatisch erneut aus, diesmal mit gesetztem cancelledAt.
    // Nur relevant, wenn die Bestellung überhaupt schon buchhaltungsbereit
    // war (sonst bliebe sie ohnehin wegen invoice_number IS NOT NULL
    // ausgeschlossen) – ein unbeteiligtes NULL bleibt bewusst NULL.
    if (bestellung.accounting_ready_at) patch.accounting_ready_at = jetzt.toISOString();
  }

  const { data: geaendert, error: updateFehler } = await db
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .eq('status', von) // Schutz gegen gleichzeitige Statuswechsel
    .select('id');

  if (updateFehler) {
    console.error(`[orders] Statuswechsel ${orderId} ${von}->${nach} fehlgeschlagen:`, updateFehler);
    return { ok: false, grund: 'fehler', aktuell: von };
  }
  if ((geaendert?.length ?? 0) === 0) {
    // Jemand war schneller. Der aktuelle Zustand ist maßgeblich.
    return { ok: false, grund: 'uebergang-unzulaessig', aktuell: von };
  }

  await protokolliereBestellereignis(
    {
      orderId,
      eventType: 'status_changed',
      fromStatus: von,
      toStatus: nach,
      reason: optionen.grund ?? `Statuswechsel im Adminbereich: ${von} → ${nach}.`,
      // Bei einer Stornierung wird `quelle: 'admin'` gespiegelt – dasselbe
      // Muster wie beim 'cancelled'-Ereignis der Kunden-Selbststornierung
      // (storniereBestellungDurchKunden, detail: { quelle: 'customer', ... }).
      // Ohne dies stünde `cancellation_source='admin'` zwar auf der Bestellung,
      // aber nicht in der order_events-Historie.
      detail:
        nach === 'cancelled'
          ? { quelle: 'admin', trackingNummer: optionen.trackingNummer }
          : optionen.trackingNummer
            ? { trackingNummer: optionen.trackingNummer }
            : undefined,
    },
    db
  );

  // Status-E-Mails. Nicht-fatal in allen drei Fällen: Der Status gilt
  // unabhängig davon, ob der Versand gelingt (dieselbe Haltung wie beim
  // Bestellabschluss selbst – E-Mail ist nachgelagert, nie steuernd).
  if (nach === 'shipped' && bestellung.email) {
    // Fällt auf die bereits gespeicherte Sendungsnummer zurück (z.B. durch
    // die DHL-Label-Erstellung, siehe shippingService.ts), wenn beim
    // Statuswechsel selbst keine manuell eingegeben wurde – sonst müsste
    // der Admin eine bereits bekannte Nummer ein zweites Mal abtippen.
    // Eine explizit übergebene Nummer hat weiterhin Vorrang (bewusste
    // Überschreibung, z.B. bei einem abweichenden Versandweg).
    const trackingNummer = optionen.trackingNummer?.trim() || bestellung.tracking_number || null;
    await sendeShippedMail(orderId, bestellung.email, trackingNummer, bestellung.carrier, bestellung.order_number);
  }

  if (nach === 'in_production' && bestellung.email) {
    await sendeInProductionMail(orderId, bestellung.email, bestellung.order_number);
  }

  if (nach === 'completed' && bestellung.email) {
    await sendeCompletedMail(orderId, bestellung.email, bestellung.order_number);
  }

  // Kulanzstornierung durch den Betreiber: dieselbe Storno-Bestätigung wie
  // bei der Selbststornierung durch den Kunden (storniereBestellungDurchKunden
  // oben) – der Kunde soll unabhängig davon, WER storniert hat, denselben
  // belastbaren Nachweis bekommen, dass keine Kosten entstehen.
  if (nach === 'cancelled' && bestellung.email) {
    try {
      const versand = await sendOrderCancellationEmail({
        orderId,
        orderNumber: bestellung.order_number ?? buildOrderNumber(orderId),
        empfaenger: bestellung.email,
        storniertAm: formatiereZeitpunkt(jetzt, { dateStyle: 'long', timeStyle: 'short' }),
        erstattungFaellig: erstattungAusstehend,
      });
      await protokolliereVersand(orderId, 'order_cancelled', { status: 'fulfilled', value: versand }, undefined, {
        quelle: 'admin',
      });
    } catch (err) {
      await protokolliereVersand(orderId, 'order_cancelled', { status: 'rejected', reason: err }, undefined, {
        quelle: 'admin',
      });
    }
  }

  return { ok: true, von, nach, bereitsErreicht: false, erstattungAusstehend };
}

// ── Status-E-Mail-Versand: drei kleine, wiederverwendete Helfer ─────────
// Von setzeBestellstatus() (unmittelbar beim Übergang) UND von
// sendeStatusmailErneut() (manueller Admin-Retry, siehe unten) genutzt –
// exakt dieselbe Versand-/Protokollierlogik, kein zweiter Pfad.

async function sendeShippedMail(
  orderId: string,
  email: string,
  trackingNummer: string | null,
  carrier: string | null,
  // Vom Aufrufer aus der ohnehin geladenen Zeile durchgereicht (Migration
  // 0036, Bestellnummer-Jahreswechsel-Fix) – buildOrderNumber(orderId) nur
  // noch als Rückfall für den theoretischen Fall einer Zeile ohne Wert.
  orderNumber?: string | null
): Promise<void> {
  try {
    const versand = await sendOrderShippedEmail({
      orderId,
      orderNumber: orderNumber ?? buildOrderNumber(orderId),
      empfaenger: email,
      trackingNummer,
      carrier,
    });
    await protokolliereVersand(orderId, 'order_shipped', { status: 'fulfilled', value: versand });
  } catch (err) {
    await protokolliereVersand(orderId, 'order_shipped', { status: 'rejected', reason: err });
  }
}

/** Positionen für die "In Produktion"-Mail: dieselbe schlanke order_items +
 *  configuration_elements-Query wie in orderView.ts (Kundenfreigabe) für die
 *  Motiv-Anzahl je Position – bewusst NICHT über orderCompletion.ts geladen
 *  (Zirkelimport-Vermeidung, siehe Kommentar bei sendeVorschauFreigabeAnfrage
 *  oben: orderCompletion.ts importiert bereits von hier). */
async function ladePositionenFuerInProductionMail(
  orderId: string,
  db: ReturnType<typeof createAdminClient>
): Promise<OrderItemsTableItem[]> {
  const { data: items } = await db
    .from('order_items')
    .select('id, product_name, color_name, size_quantities, total_price')
    .eq('order_id', orderId);
  const zeilen = items ?? [];
  const itemIds = zeilen.map((row) => row.id as string);
  const { data: elemente } = itemIds.length
    ? await db.from('configuration_elements').select('order_item_id').in('order_item_id', itemIds)
    : { data: [] as { order_item_id: string }[] };
  const anzahlJeItem = new Map<string, number>();
  for (const el of elemente ?? []) {
    anzahlJeItem.set(el.order_item_id as string, (anzahlJeItem.get(el.order_item_id as string) ?? 0) + 1);
  }
  return zeilen.map((row) => ({
    productName: row.product_name as string,
    colorName: row.color_name as string,
    sizeQuantities: (row.size_quantities ?? {}) as Record<string, number>,
    totalPrice: Number(row.total_price ?? 0),
    elements: Array.from({ length: anzahlJeItem.get(row.id as string) ?? 0 }),
  }));
}

async function sendeInProductionMail(orderId: string, email: string, orderNumber?: string | null): Promise<void> {
  try {
    const db = createAdminClient();
    const items = await ladePositionenFuerInProductionMail(orderId, db);
    // Derselbe signierte Link wie bei sendeVorschauFreigabeAnfrage oben – aus
    // demselben Zirkelimport-Grund lokal nachgebaut statt aus orderIntake.ts
    // importiert.
    const token = erzeugeBestellToken(orderId);
    const versand = await sendOrderInProductionEmail({
      orderId,
      orderNumber: orderNumber ?? buildOrderNumber(orderId),
      items,
      empfaenger: email,
      bestellansichtUrl: token ? `${basisUrl()}/bestellung/${token}` : null,
    });
    await protokolliereVersand(orderId, 'order_in_production', { status: 'fulfilled', value: versand });
  } catch (err) {
    await protokolliereVersand(orderId, 'order_in_production', { status: 'rejected', reason: err });
  }
}

async function sendeCompletedMail(orderId: string, email: string, orderNumber?: string | null): Promise<void> {
  try {
    const versand = await sendOrderCompletedEmail({
      orderId,
      orderNumber: orderNumber ?? buildOrderNumber(orderId),
      empfaenger: email,
    });
    await protokolliereVersand(orderId, 'order_completed', { status: 'fulfilled', value: versand });
  } catch (err) {
    await protokolliereVersand(orderId, 'order_completed', { status: 'rejected', reason: err });
  }
}

export type VorschauFreigabeAnfrageErgebnis =
  | { ok: true }
  | { ok: false; grund: 'nicht-gefunden' | 'keine-email' | 'kein-link' };

/**
 * Löst den Kundenfreigabe-Schritt aus: verschickt die Bitte um Freigabe der
 * bereits in Phase 2 gerenderten Druckvorschau (siehe orderCompletion.ts)
 * und merkt den Anfragezeitpunkt vor (`orders.freigabe_angefragt_am`).
 *
 * Admin-ausgelöst (RequestProofApprovalButton → proofRequestActions.ts),
 * NICHT bei einem Statusübergang – die Bestellung steht zu diesem Zeitpunkt
 * noch auf 'new'. Erst die anschließende Freigabe durch die Kundschaft
 * (freigebeVorschauDurchKunden unten) schaltet den Übergang nach
 * 'in_production' frei, siehe die freigabe-fehlt-Prüfung in
 * setzeBestellstatus() oben.
 *
 * Bewusst OHNE eigenen Claim: derselbe Grund wie bei sendeStatusmailErneut()
 * unten – ein Doppelklick verschickt zweimal dieselbe Bitte, das ist die
 * einzige denkbare Auswirkung und liegt in der Natur einer bewusst vom Admin
 * ausgelösten Aktion.
 */
export async function sendeVorschauFreigabeAnfrage(
  orderId: string,
  jetzt: Date = new Date()
): Promise<VorschauFreigabeAnfrageErgebnis> {
  const db = createAdminClient();
  const { data: bestellung, error } = await db
    .from('orders')
    .select('email, order_number')
    .eq('id', orderId)
    .maybeSingle<{ email: string | null; order_number: string | null }>();

  if (error || !bestellung) return { ok: false, grund: 'nicht-gefunden' };
  if (!bestellung.email) return { ok: false, grund: 'keine-email' };

  // Derselbe signierte Link wie in der Bestellbestätigung
  // (orderIntake.ts::bestellansichtUrl) – hier bewusst lokal nachgebaut statt
  // von dort importiert: orderIntake.ts importiert bereits protokolliereBestell-
  // ereignis/protokolliereVersand von HIER, ein Import in die Gegenrichtung
  // wäre ein Zirkelimport (siehe Kopfkommentar von protokolliereVersand oben).
  const token = erzeugeBestellToken(orderId);
  if (!token) {
    console.warn(
      `[orders] Freigabeanfrage ${orderId} nicht versendet: kein Bestellansicht-Link (ORDER_TOKEN_SECRET fehlt oder ist zu kurz).`
    );
    return { ok: false, grund: 'kein-link' };
  }

  await db.from('orders').update({ freigabe_angefragt_am: jetzt.toISOString() }).eq('id', orderId);
  await protokolliereBestellereignis(
    { orderId, eventType: 'proof_requested', reason: 'Vorschau zur Freigabe an die Kundschaft gesendet.' },
    db
  );

  try {
    const versand = await sendOrderProofRequestEmail({
      orderId,
      orderNumber: bestellung.order_number ?? buildOrderNumber(orderId),
      empfaenger: bestellung.email,
      bestellansichtUrl: `${basisUrl()}/bestellung/${token}`,
    });
    await protokolliereVersand(orderId, 'order_proof_request', { status: 'fulfilled', value: versand });
  } catch (err) {
    await protokolliereVersand(orderId, 'order_proof_request', { status: 'rejected', reason: err });
  }

  return { ok: true };
}

export type StatusmailErneutErgebnis =
  | { ok: true; anlass: string }
  | { ok: false; grund: 'nicht-gefunden' | 'keine-email' | 'kein-status-mit-mail' };

/**
 * Versendet die zum AKTUELLEN Status passende Kunden-Mail erneut – der
 * fehlende Baustein aus dem Produktionsreife-Audit vom 2026-08-26: Bislang
 * gab es für die drei Status-Mails (in_production/shipped/completed) exakt
 * einen Versandversuch beim Übergang selbst, ohne jeden Retry – weder
 * automatisch (kein Cron/Claim wie bei Rechnung/DHL-Label) noch manuell (ein
 * erneuter Klick auf denselben Zielstatus ist bewusst ein No-op, siehe
 * `von === nach`-Kurzschluss oben). Schlug der einzige Versuch fehl (siehe
 * `lastShippingError`-Vorbild für DHL), blieb die Kundschaft bislang ohne
 * jede Möglichkeit, das nachzuholen, außer einem direkten Datenbankeingriff.
 *
 * Bewusst OHNE eigenen Claim: Ein Doppelklick verschickt hier zweimal
 * dieselbe Mail – das ist die einzige denkbare "Duplikat"-Wirkung (keine
 * externe Zahlung, keine zweite Rechnung, kein zweites Label) und liegt in
 * der Natur einer "erneut senden"-Aktion, die der Admin BEWUSST auslöst.
 */
export async function sendeStatusmailErneut(orderId: string): Promise<StatusmailErneutErgebnis> {
  const db = createAdminClient();
  const { data: bestellung, error } = await db
    .from('orders')
    .select('email, status, tracking_number, carrier, order_number')
    .eq('id', orderId)
    .maybeSingle<{
      email: string | null;
      status: OrderStatus;
      tracking_number: string | null;
      carrier: string | null;
      order_number: string | null;
    }>();

  if (error || !bestellung) return { ok: false, grund: 'nicht-gefunden' };
  if (!bestellung.email) return { ok: false, grund: 'keine-email' };

  switch (bestellung.status) {
    case 'shipped':
      await sendeShippedMail(orderId, bestellung.email, bestellung.tracking_number, bestellung.carrier, bestellung.order_number);
      return { ok: true, anlass: 'order_shipped' };
    case 'in_production':
      await sendeInProductionMail(orderId, bestellung.email, bestellung.order_number);
      return { ok: true, anlass: 'order_in_production' };
    case 'completed':
      await sendeCompletedMail(orderId, bestellung.email, bestellung.order_number);
      return { ok: true, anlass: 'order_completed' };
    default:
      return { ok: false, grund: 'kein-status-mit-mail' };
  }
}

/**
 * Schreibt einen Eintrag in die Bestell-Historie (`order_events`).
 *
 * Generisch gehalten: Ein neues Ereignis – Lagerfreigabe, Rechnungsversand,
 * Versandinformation – braucht weder eine Migration noch eine Änderung an
 * dieser Funktion, sondern nur einen neuen `eventType`.
 *
 * Bewusst NICHT-FATAL und ohne Rückgabewert: Die Historie ist Nachweis,
 * nicht Steuerung. Scheitert das Schreiben, darf das den fachlichen Vorgang
 * niemals rückgängig machen oder blockieren – der maßgebliche Zustand steht
 * in `orders`.
 *
 * Ein Fehlschlag eskaliert seit dem Produktionsreife-Audit vom 2026-08-26
 * ZUSÄTZLICH nach `system_ereignisse` (meldeEreignis) – vorher landete er
 * ausschließlich in `console.warn`, einem flüchtigen Plattformprotokoll ohne
 * Nachweis-/Häufungsauswertung. Andere kritische Schreibvorgänge in diesem
 * Modul (Lexware-`invoice_id`, DHL-`tracking_number`) bekommen bereits
 * mehrere Wiederholungsversuche plus ein dauerhaftes `*_unklarer_zustand`-
 * Flag; für die Historie selbst (reiner Nachweis, keine Steuerung) wäre ein
 * Wiederholungsversuch unverhältnismäßig – die Sichtbarkeit im Monitoring
 * genügt, damit ein gehäuftes Auftreten (z.B. anhaltende DB-Störung) auffällt.
 */
export async function protokolliereBestellereignis(
  eintrag: {
    orderId: string;
    eventType: string;
    fromStatus?: string;
    toStatus?: string;
    reason?: string;
    detail?: Record<string, unknown>;
  },
  db: ReturnType<typeof createAdminClient> = createAdminClient()
): Promise<void> {
  try {
    const { error } = await db.from('order_events').insert({
      order_id: eintrag.orderId,
      event_type: eintrag.eventType,
      from_status: eintrag.fromStatus ?? null,
      to_status: eintrag.toStatus ?? null,
      reason: eintrag.reason ?? null,
      detail: eintrag.detail ?? null,
    });
    if (error) {
      console.warn(`[orders] Historie-Eintrag "${eintrag.eventType}" nicht geschrieben:`, error.message);
      await meldeEreignis({
        schwere: 'WARNING',
        kategorie: 'ORDER',
        ereignis: 'bestellereignis_nicht_gespeichert',
        meldung: error.message,
        felder: { bestellId: eintrag.orderId, eventType: eintrag.eventType },
      });
    }
  } catch (err) {
    console.warn(`[orders] Historie-Eintrag "${eintrag.eventType}" fehlgeschlagen:`, err);
    await meldeEreignis({
      schwere: 'WARNING',
      kategorie: 'ORDER',
      ereignis: 'bestellereignis_nicht_gespeichert',
      fehler: err,
      felder: { bestellId: eintrag.orderId, eventType: eintrag.eventType },
    }).catch(() => {});
  }
}

/**
 * Hält einen einzelnen Versandvorgang in der Bestell-Historie fest.
 *
 * Nimmt bewusst das rohe `PromiseSettledResult` entgegen: So gibt es genau
 * einen Ort, an dem „geplant / gesendet / fehlgeschlagen" unterschieden wird,
 * statt die Fallunterscheidung je Aufrufer zu wiederholen. Ein abgelehnter
 * Versand meldet sich NICHT immer über eine Ausnahme – sendEmail.ts gibt
 * Fehler auch als `success: false` zurück; ohne die Prüfung von
 * `ergebnis.value.success` stünde „versendet" in der Historie, obwohl nichts
 * rausging (Vorfall 2026-08-21, Bestellbestätigung).
 *
 * Lebt bewusst HIER (nicht in orderIntake.ts, wo diese Funktion ursprünglich
 * stand) statt dort: orderIntake.ts importiert bereits protokolliereBestell-
 * ereignis von hier, ein Import in die Gegenrichtung wäre ein Zirkelimport.
 * orderIntake.ts und orderCompletion.ts importieren protokolliereVersand
 * seitdem von hier.
 *
 * Nicht-fatal wie die Historie insgesamt – `protokolliereBestellereignis`
 * schluckt seine eigenen Fehler.
 */
export async function protokolliereVersand(
  orderId: string,
  anlass: string,
  ergebnis: PromiseSettledResult<EmailVersandErgebnis>,
  geplantFuer?: string,
  // Zusätzliche Detail-Felder, die in ALLE drei Zweige (fehlgeschlagen,
  // abgelehnt, versendet) einfließen – z.B. `quelle: 'admin'`, um eine
  // Kulanzstornierung durch den Betreiber vom selben `anlass` einer
  // Selbststornierung durch den Kunden im Audit-Verlauf zu unterscheiden.
  extraDetail?: Record<string, unknown>
): Promise<void> {
  if (ergebnis.status === 'rejected') {
    await protokolliereBestellereignis({
      orderId,
      eventType: 'email_failed',
      reason: `E-Mail „${anlass}" konnte nicht versendet werden.`,
      detail: {
        anlass,
        fehler: ergebnis.reason instanceof Error ? ergebnis.reason.message : String(ergebnis.reason),
        ...extraDetail,
      },
    });
    return;
  }

  if (!ergebnis.value.success) {
    await protokolliereBestellereignis({
      orderId,
      eventType: 'email_failed',
      reason: `E-Mail „${anlass}" wurde vom Versanddienst abgelehnt.`,
      detail: { anlass, fehler: ergebnis.value.error ?? null, ...extraDetail },
    });
    return;
  }

  await protokolliereBestellereignis({
    orderId,
    eventType: geplantFuer ? 'email_scheduled' : 'email_sent',
    reason: geplantFuer
      ? `E-Mail „${anlass}" für ${geplantFuer} eingeplant.`
      : `E-Mail „${anlass}" versendet.`,
    detail: { anlass, messageId: ergebnis.value.messageId ?? null, geplantFuer: geplantFuer ?? null, ...extraDetail },
  });
}

/**
 * Persistiert das Ergebnis eines bereits real, IRREVERSIBEL entstandenen
 * externen Vorgangs (Lexware-Rechnung, DHL-Sendung) mit mehreren
 * Wiederholungsversuchen.
 *
 * Nach einem erfolgreichen, nicht-idempotenten externen Aufruf ist dieser
 * Schreibzugriff der EINZIGE Weg, den zugehörigen Datenbank-Claim dauerhaft
 * vor einer erneuten Freigabe zu schützen (siehe die invoice_id-/
 * tracking_number-Wächter in Migration 0026) – ein einzelner Versuch wäre
 * demselben Transienzrisiko ausgesetzt wie der ursprüngliche Fehler, der
 * hierher geführt hat. Weder Lexware noch DHL bieten einen eigenen
 * Idempotenzschlüssel für diese Aufrufe; die Datenbank ist der einzige
 * Schutz gegen eine doppelte Anlage.
 *
 * Schlagen auch alle Versuche fehl, rufen orderCompletion.ts/
 * shippingService.ts diese Funktion ein ZWEITES, unabhängiges Mal auf – mit
 * einer minimalen Nutzlast (nur rechnung_unklarer_zustand bzw.
 * label_unklarer_zustand, ein einzelnes Bool-Feld statt mehrerer
 * Textspalten), als letzte Rettungsleine. Dieses Flag ist der einzige
 * verbleibende Schutz gegen eine automatische Freigabe durch den
 * Cron-Reaper (Migration 0026: beanspruche_rechnungserstellung/
 * beanspruche_versandlabel und beide gib_haengende_*_frei-Funktionen prüfen
 * es zusätzlich zu invoice_id/tracking_number) – ohne dieses zweite
 * Sicherheitsnetz sähe ein dauerhaft nicht persistierbares invoice_id/
 * tracking_number für den Reaper identisch aus wie "Anbieter nie erreicht"
 * und würde nach Ablauf der Frist fälschlich freigegeben, was einen echten
 * ZWEITEN externen Aufruf ermöglichen würde (Review vom 2026-08-12, zweite
 * Runde). Schlagen SELBST diese beiden unabhängigen Schreibversuche fehl
 * (nur bei einer anhaltenden, schweren Datenbankstörung realistisch), bleibt
 * ein echtes Restrisiko bestehen und wird als KRITISCH protokolliert – ohne
 * eigenen Idempotenzschlüssel bei Lexware/DHL ist das nicht vollständig
 * eliminierbar, aber auf diesen sehr engen Fall reduziert. Ein hängender
 * Claim, der auf manuelle Prüfung wartet, ist in jedem Fall die sichere
 * Fehlerrichtung gegenüber einem automatischen Retry, der den externen
 * Aufruf ein zweites Mal auslösen würde.
 */
export async function persistiereKritischMitWiederholung(
  db: ReturnType<typeof createAdminClient>,
  orderId: string,
  patch: Record<string, unknown>,
  versuche = 3
): Promise<boolean> {
  for (let i = 0; i < versuche; i++) {
    const { error } = await db.from('orders').update(patch).eq('id', orderId);
    if (!error) return true;
    console.error(
      `[orders] Kritische Persistierung für ${orderId} (Versuch ${i + 1}/${versuche}) fehlgeschlagen:`,
      error.message
    );
    if (i < versuche - 1) await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
  }
  return false;
}

/**
 * Selbststornierung durch den Kunden.
 *
 * Die EINZIGE Stelle, an der eine Bestellung durch den Kunden storniert
 * wird. Die Frist wird hier serverseitig gegen `created_at` geprüft – ein
 * gültiger Zugriffstoken allein genügt ausdrücklich NICHT.
 */
export async function storniereBestellungDurchKunden(
  orderId: string,
  jetzt: Date = new Date()
): Promise<StornoErgebnis> {
  const db = createAdminClient();

  const { data: bestellung, error } = await db
    .from('orders')
    .select(
      'id, email, created_at, status, order_type, internal_notification_email_id, accounting_ready_at, payment_status, order_number'
    )
    .eq('id', orderId)
    .maybeSingle<{
      id: string;
      email: string | null;
      created_at: string;
      status: OrderStatus;
      order_type: string;
      internal_notification_email_id: string | null;
      accounting_ready_at: string | null;
      payment_status: string | null;
      order_number: string | null;
    }>();

  if (error || !bestellung) return { ok: false, grund: 'nicht-gefunden' };

  // Anfragen sind keine Bestellungen – sie haben keine Stornofrist.
  if (bestellung.order_type !== 'order') return { ok: false, grund: 'keine-bestellung' };

  // Erneuter Klick auf denselben Link darf nicht als Fehler wirken. Der
  // Erstattungsanstoß erfolgte (falls nötig) bereits beim ERSTEN Aufruf –
  // ein hängengebliebener Versuch hat im Admin-Bereich seinen eigenen Retry.
  if (bestellung.status === 'cancelled') return { ok: true, bereitsStorniert: true, erstattungAusstehend: false };

  // Dieselbe Zustandsmaschine wie beim Admin-Statuswechsel (setzeBestellstatus):
  // eine bereits abgeschlossene Bestellung (Endzustand `completed`) darf auch
  // innerhalb der Stornofrist nicht mehr storniert werden – sie ist bereits
  // produziert/versendet/abgerechnet. Ohne diese Prüfung könnte eine schnell
  // durchlaufende Bestellung (z.B. durch einen frühen Admin-Statuswechsel)
  // als `cancelled` markiert werden, obwohl sie bereits `completed` ist.
  if (!istUebergangErlaubt(bestellung.status, 'cancelled')) {
    return { ok: false, grund: 'nicht-stornierbar' };
  }

  if (!stornofristLaeuftNoch(bestellung.created_at, jetzt)) {
    return { ok: false, grund: 'frist-abgelaufen' };
  }

  const { data: geaendert, error: updateFehler } = await db
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: jetzt.toISOString(),
      cancellation_source: 'customer',
      // Redelivery-Signal für die Buchhaltungs-Synchronisierung – siehe
      // ausführlichen Kommentar in setzeBestellstatus() oben. Nur relevant,
      // wenn die Bestellung überhaupt schon buchhaltungsbereit war.
      ...(bestellung.accounting_ready_at ? { accounting_ready_at: jetzt.toISOString() } : {}),
      // Eine Rückerstattung wird fällig, wenn die Bestellung bereits bezahlt
      // war – siehe supabase/migrations/0029_rueckerstattung.sql. Tatsächlich
      // ausgelöst wird sie vom Aufrufer (StornoErgebnis.erstattungAusstehend
      // unten), nicht hier – siehe Kopfkommentar des Rückgabetyps.
      ...(bestellung.payment_status === 'paid' ? { refund_status: 'required' } : {}),
    })
    .eq('id', orderId)
    // Schutz gegen zwei gleichzeitige Klicks: Nur wer den Datensatz noch
    // im nicht-stornierten Zustand vorfindet, storniert ihn.
    .neq('status', 'cancelled')
    // Zusätzlicher Schutz gegen den seltenen Fall, dass die Bestellung
    // zwischen der obigen Prüfung und diesem UPDATE durch einen parallelen
    // Admin-Statuswechsel `completed` erreicht (Endzustand, siehe oben).
    .neq('status', 'completed')
    // Die Datenbank entscheidet, WER storniert hat. Ohne diese Rückgabe
    // wüssten zwei gleichzeitige Anfragen beide nichts voneinander und
    // würden beide ein 'cancelled'-Ereignis und eine Bestätigungsmail
    // erzeugen – der Kunde bekäme zwei Mails für einen Vorgang.
    .select('id');

  if (updateFehler) {
    console.error(`[orders] Stornierung ${orderId} fehlgeschlagen:`, updateFehler);
    return { ok: false, grund: 'fehler' };
  }

  // Keine Zeile getroffen: entweder eine parallele Stornierung war
  // schneller (dann ist es aus Kundensicht ein Erfolg), oder die Bestellung
  // wurde im selben Moment `completed` (dann NICHT storniert). Der aktuelle
  // Stand entscheidet – niemals blind "erfolgreich storniert" annehmen.
  if ((geaendert?.length ?? 0) === 0) {
    const { data: aktuell } = await db
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .maybeSingle<{ status: OrderStatus }>();
    if (aktuell?.status === 'cancelled') {
      // Eine parallele Anfrage hat den Storno (und damit ggf. auch den
      // Erstattungsanstoß) bereits ausgelöst – kein zweiter hier nötig.
      return { ok: true, bereitsStorniert: true, erstattungAusstehend: false };
    }
    return { ok: false, grund: 'nicht-stornierbar' };
  }

  // Ab hier ist die Bestellung storniert. Alles Weitere ist bewusst
  // NICHT-FATAL: Es darf den Storno nicht rückgängig machen oder melden.

  await protokolliereBestellereignis(
    {
      orderId,
      eventType: 'cancelled',
      fromStatus: bestellung.status,
      toStatus: 'cancelled',
      reason: 'Selbststornierung durch den Kunden innerhalb der Stornofrist.',
      detail: { quelle: 'customer', bestelltAm: bestellung.created_at },
    },
    db
  );

  // Die geplante interne Benachrichtigung zurückziehen, damit der Betreiber
  // nicht über eine stornierte Bestellung informiert wird.
  //
  // Gelingt das nicht (z.B. weil der Resend-Schlüssel nur Senderechte hat),
  // trifft die Meldung trotzdem ein. Sie ist dann irreführend, aber nicht
  // gefährlich: Die Detailseite im Adminbereich verweigert stornierte
  // Bestellungen, es kann also keine Ware beschafft werden. Der Ausgang wird
  // hier festgehalten, damit ein solcher Fall später nachvollziehbar ist.
  if (bestellung.internal_notification_email_id) {
    const widerrufen = await widerrufeGeplanteEmail(bestellung.internal_notification_email_id);
    await protokolliereBestellereignis(
      {
        orderId,
        eventType: widerrufen ? 'scheduled_email_cancelled' : 'scheduled_email_cancel_failed',
        reason: widerrufen
          ? 'Geplante interne Benachrichtigung zurückgezogen.'
          : 'Geplante interne Benachrichtigung konnte NICHT zurückgezogen werden – sie wird zugestellt.',
        detail: { anlass: 'internal_order_notification', messageId: bestellung.internal_notification_email_id },
      },
      db
    );
  }

  // Bestätigung an den Kunden. Nicht-fatal: Die Stornierung steht bereits in
  // der Datenbank und gilt unabhängig davon. Ein Fehlschlag darf sie weder
  // rückgängig machen noch als gescheitert melden.
  if (bestellung.email) {
    try {
      const versand = await sendOrderCancellationEmail({
        orderId,
        orderNumber: bestellung.order_number ?? buildOrderNumber(orderId),
        empfaenger: bestellung.email,
        storniertAm: formatiereZeitpunkt(jetzt, { dateStyle: 'long', timeStyle: 'short' }),
        erstattungFaellig: bestellung.payment_status === 'paid',
      });
      await protokolliereVersand(orderId, 'order_cancelled', { status: 'fulfilled', value: versand }, undefined, {
        quelle: 'customer',
      });
    } catch (err) {
      await protokolliereVersand(orderId, 'order_cancelled', { status: 'rejected', reason: err }, undefined, {
        quelle: 'customer',
      });
    }
  } else {
    console.warn(`[orders] Storno-Bestätigung ${orderId} übersprungen: keine E-Mail-Adresse hinterlegt.`);
  }

  // HIER gehört künftig die Freigabe reservierter Bestände hin, sobald es
  // eine Bestandsführung gibt. Bewusst kein leerer Platzhalter-Aufruf –
  // eine Funktion, die nichts tut, sieht nach Funktionalität aus.

  return { ok: true, bereitsStorniert: false, erstattungAusstehend: bestellung.payment_status === 'paid' };
}

export type KundenfreigabeErgebnis =
  | { ok: true; bereitsErteilt: boolean }
  | { ok: false; grund: 'nicht-gefunden' | 'nicht-angefragt' | 'fehler' };

/**
 * Freigabe der Druckvorschau durch die Kundschaft – der verbindliche
 * Bestätigungsschritt, den FAQ/Über-uns versprechen. Setzt
 * `orders.freigabe_erteilt_am`, was `setzeBestellstatus()` oben als
 * zusätzliche, von der Stornofrist/Zahlung unabhängige Bedingung für den
 * Übergang nach 'in_production' prüft.
 *
 * Dieselbe Absicherung gegen einen doppelten Effekt wie bei
 * storniereBestellungDurchKunden oben: bedingtes Update
 * (`.is('freigabe_erteilt_am', null)`), ein erneuter Klick auf denselben
 * Link ist kein Fehler.
 */
export async function freigebeVorschauDurchKunden(
  orderId: string,
  jetzt: Date = new Date()
): Promise<KundenfreigabeErgebnis> {
  const db = createAdminClient();
  const { data: bestellung, error } = await db
    .from('orders')
    .select('id, email, freigabe_angefragt_am, freigabe_erteilt_am, order_number')
    .eq('id', orderId)
    .maybeSingle<{
      id: string;
      email: string | null;
      freigabe_angefragt_am: string | null;
      freigabe_erteilt_am: string | null;
      order_number: string | null;
    }>();

  if (error || !bestellung) return { ok: false, grund: 'nicht-gefunden' };
  // Ohne Anfrage keine Freigabe – schützt zusätzlich zur UI (die den Bereich
  // nur bei gesetztem freigabeAngefragtAm zeigt) auch einen direkten Aufruf.
  if (!bestellung.freigabe_angefragt_am) return { ok: false, grund: 'nicht-angefragt' };
  if (bestellung.freigabe_erteilt_am) return { ok: true, bereitsErteilt: true };

  const { data: geaendert, error: updateFehler } = await db
    .from('orders')
    .update({ freigabe_erteilt_am: jetzt.toISOString() })
    .eq('id', orderId)
    .is('freigabe_erteilt_am', null)
    .select('id');

  if (updateFehler) {
    console.error(`[orders] Kundenfreigabe ${orderId} fehlgeschlagen:`, updateFehler);
    return { ok: false, grund: 'fehler' };
  }
  if ((geaendert?.length ?? 0) === 0) {
    // Eine parallele Freigabe (zweiter Tab, Doppelklick) war schneller – aus
    // Kundensicht ebenfalls ein Erfolg, kein zweites Ereignis/keine zweite Mail.
    return { ok: true, bereitsErteilt: true };
  }

  await protokolliereBestellereignis(
    { orderId, eventType: 'proof_approved', reason: 'Druckvorschau durch die Kundschaft freigegeben.' },
    db
  );

  // Interne Benachrichtigung, nicht-fatal: Die Freigabe steht bereits fest
  // und gilt unabhängig davon, ob der Betreiber sofort davon erfährt – die
  // Bestell-Historie (order_events) ist der maßgebliche Nachweis.
  if (bestellung.email) {
    try {
      const versand = await sendProofFeedbackEmail({
        orderId,
        orderNumber: bestellung.order_number ?? buildOrderNumber(orderId),
        adminUrl: `${basisUrl()}/admin/bestellung/${orderId}`,
        art: 'freigegeben',
        kundeEmail: bestellung.email,
      });
      await protokolliereVersand(orderId, 'proof_feedback', { status: 'fulfilled', value: versand });
    } catch (err) {
      await protokolliereVersand(orderId, 'proof_feedback', { status: 'rejected', reason: err });
    }
  }

  return { ok: true, bereitsErteilt: false };
}

export type AenderungswunschErgebnis =
  | { ok: true }
  | { ok: false; grund: 'nicht-gefunden' | 'nicht-angefragt' };

/**
 * Änderungswunsch der Kundschaft zur Druckvorschau – reines
 * Kommunikationssignal, KEINE Bestellbearbeitung. Setzt bewusst KEINEN
 * Zeitstempel (anders als freigebeVorschauDurchKunden): der Übergang nach
 * 'in_production' bleibt einfach so lange blockiert, bis der Betreiber die
 * Angelegenheit geklärt hat und (bei Bedarf nach einer neuen Vorschau) die
 * Freigabe erneut anfragt. Die Klärung selbst bleibt ein manueller Vorgang
 * außerhalb dieser Funktion, wie jede andere Ausnahme im System.
 *
 * Kein Claim-Lock nötig: mehrere Änderungswünsche sind fachlich unbedenklich
 * (mehrere Kommentare zur selben Bestellung), anders als eine Freigabe mit
 * ihrer EINEN maßgeblichen Wirkung.
 */
export async function wuenscheAenderungDurchKunden(
  orderId: string,
  kommentar: string
): Promise<AenderungswunschErgebnis> {
  const db = createAdminClient();
  const { data: bestellung, error } = await db
    .from('orders')
    .select('id, email, freigabe_angefragt_am, order_number')
    .eq('id', orderId)
    .maybeSingle<{ id: string; email: string | null; freigabe_angefragt_am: string | null; order_number: string | null }>();

  if (error || !bestellung) return { ok: false, grund: 'nicht-gefunden' };
  if (!bestellung.freigabe_angefragt_am) return { ok: false, grund: 'nicht-angefragt' };

  await protokolliereBestellereignis(
    {
      orderId,
      eventType: 'proof_change_requested',
      reason: 'Kundschaft wünscht eine Änderung an der Druckvorschau.',
      detail: { kommentar },
    },
    db
  );

  if (bestellung.email) {
    try {
      const versand = await sendProofFeedbackEmail({
        orderId,
        orderNumber: bestellung.order_number ?? buildOrderNumber(orderId),
        adminUrl: `${basisUrl()}/admin/bestellung/${orderId}`,
        art: 'aenderung_gewuenscht',
        kundeEmail: bestellung.email,
        kommentar,
      });
      await protokolliereVersand(orderId, 'proof_feedback', { status: 'fulfilled', value: versand });
    } catch (err) {
      await protokolliereVersand(orderId, 'proof_feedback', { status: 'rejected', reason: err });
    }
  }

  return { ok: true };
}

export interface LieferadresseKorrektur {
  customerName?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  land?: string;
}

export type LieferadresseKorrekturErgebnis =
  | { ok: true }
  | { ok: false; grund: 'nicht-gefunden' | 'bereits-label-erstellt' | 'fehler' };

/**
 * Korrigiert Name/Lieferadresse einer Bestellung durch den Betreiber – der
 * häufigste Support-Fall ("habe mich bei der Hausnummer vertippt") ließ sich
 * bislang nur per direktem Datenbankzugriff oder per vollständigem Storno
 * beheben (Ausbauplan, quickwins).
 *
 * Bewusst NUR erlaubt, solange noch KEIN DHL-Label erzeugt wurde: Ein bereits
 * gedrucktes Label trägt die alte Adresse physisch – eine nachträgliche
 * Korrektur in der Datenbank würde dann nur eine falsche Erwartung wecken,
 * ohne das reale Problem (falsches Label bereits an DHL übergeben) zu lösen.
 * Für diesen selteneren Fall bleibt der bestehende Weg (Kulanzstornierung +
 * neue Bestellung) der richtige.
 */
export async function korrigiereLieferadresseDurchAdmin(
  orderId: string,
  korrektur: LieferadresseKorrektur
): Promise<LieferadresseKorrekturErgebnis> {
  const db = createAdminClient();
  const { data: bestellung, error } = await db
    .from('orders')
    .select('id, dhl_label_url, customer_name, shipping_street, shipping_zip, shipping_city, shipping_country')
    .eq('id', orderId)
    .maybeSingle<{
      id: string;
      dhl_label_url: string | null;
      customer_name: string;
      shipping_street: string | null;
      shipping_zip: string | null;
      shipping_city: string | null;
      shipping_country: string | null;
    }>();

  if (error || !bestellung) return { ok: false, grund: 'nicht-gefunden' };
  if (bestellung.dhl_label_url) return { ok: false, grund: 'bereits-label-erstellt' };

  const patch: Record<string, unknown> = {};
  if (korrektur.customerName?.trim()) patch.customer_name = korrektur.customerName.trim();
  if (korrektur.strasse?.trim()) patch.shipping_street = korrektur.strasse.trim();
  if (korrektur.plz?.trim()) patch.shipping_zip = korrektur.plz.trim();
  if (korrektur.ort?.trim()) patch.shipping_city = korrektur.ort.trim();
  if (korrektur.land?.trim()) patch.shipping_country = korrektur.land.trim();

  if (Object.keys(patch).length === 0) return { ok: true };

  const { error: updateFehler } = await db.from('orders').update(patch).eq('id', orderId);
  if (updateFehler) {
    console.error(`[orders] Adresskorrektur ${orderId} fehlgeschlagen:`, updateFehler);
    return { ok: false, grund: 'fehler' };
  }

  const vorher = [
    bestellung.customer_name,
    bestellung.shipping_street,
    [bestellung.shipping_zip, bestellung.shipping_city].filter(Boolean).join(' '),
    bestellung.shipping_country,
  ]
    .filter(Boolean)
    .join(', ');
  await protokolliereBestellereignis({
    orderId,
    eventType: 'address_corrected',
    reason: 'Name/Lieferadresse durch den Betreiber korrigiert.',
    detail: { vorher, geaenderteFelder: Object.keys(patch) },
  });

  return { ok: true };
}

export type LoescheBestellungErgebnis =
  | { ok: true }
  | { ok: false; grund: 'nicht-gefunden' | 'nicht-loeschbar' | 'fehler' };

/**
 * Löscht eine stornierte Bestellung ECHT aus der Datenbank – NUR, wenn dafür
 * nie eine Rechnungsnummer vergeben wurde (Migration 0034 erzwingt beide
 * Bedingungen atomar im selben DELETE, kein TOCTOU-Fenster). Bestellungen
 * mit Rechnungsnummer bleiben unlöschbar, um die fortlaufende
 * Rechnungsnummerierung/den Prüfpfad nicht zu zerstören – dafür gibt es
 * weiterhin ausschließlich `setzeBestellstatus(..., 'cancelled', ...)`.
 *
 * order_items/configuration_elements/order_events/supplier_orders hängen
 * bereits per `on delete cascade` an orders(id) – KEIN manuelles Aufräumen
 * dieser Tabellen nötig. Storage-Dateien (Kundendateien, Vorschauen) liegen
 * außerhalb der Datenbank und werden hier zusätzlich, aber nicht-fatal,
 * entfernt.
 */
export async function loescheStornierteBestellung(orderId: string): Promise<LoescheBestellungErgebnis> {
  const db = createAdminClient();

  const { data, error } = await db.rpc('loesche_stornierte_bestellung', { p_order_id: orderId });
  if (error) {
    console.error(`[orders] Löschung ${orderId} fehlgeschlagen:`, error.message);
    return { ok: false, grund: 'fehler' };
  }

  const geloescht = Array.isArray(data) ? data.length > 0 : Boolean(data);
  if (!geloescht) {
    // Nicht gefunden, nicht storniert, oder bereits eine Rechnungsnummer
    // vergeben – die Datenbank unterscheidet diese Fälle nicht (bewusst: das
    // DELETE selbst prüft beide Bedingungen), ein zweiter lesender Aufruf
    // klärt nur, welche Meldung angemessen ist.
    const { data: bestellung } = await db.from('orders').select('id').eq('id', orderId).maybeSingle();
    return { ok: false, grund: bestellung ? 'nicht-loeschbar' : 'nicht-gefunden' };
  }

  await removeProductionFiles(`orders/${orderId}`);

  return { ok: true };
}
