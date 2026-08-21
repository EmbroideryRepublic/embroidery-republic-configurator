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
import { stornofristLaeuftNoch } from '@/config/orderProcess';
import { widerrufeGeplanteEmail } from '@/lib/email/scheduledEmails';
import { sendOrderCancellationEmail } from '@/lib/email/orderEmails';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import type { OrderStatus } from '@/lib/actions/orderTypes';
import { istUebergangErlaubt } from '@/config/orderStatus';
import { imAdminSichtbar } from '@/lib/orders/orderVisibility';
import { sendOrderShippedEmail, sendOrderInProductionEmail, sendOrderCompletedEmail } from '@/lib/email/orderEmails';

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
      grund: 'nicht-gefunden' | 'uebergang-unzulaessig' | 'noch-nicht-freigegeben' | 'fehler';
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
    .select('id, email, status, order_type, created_at, payment_status, accounting_ready_at, tracking_number, carrier')
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

  // Dieselbe Regel wie für die Sichtbarkeit im Adminbereich (orderVisibility.ts):
  // Vor Ablauf der Stornofrist darf noch nicht bearbeitet werden – sonst
  // könnte Ware beschafft werden, die der Kunde Sekunden später doch noch
  // storniert. Die Admin-UI verbirgt den Button dafür zwar, aber die Server
  // Action selbst muss dieselbe Grenze durchsetzen, sonst schützt sie nur
  // vor der eigenen Oberfläche, nicht vor einem direkten Aufruf.
  // Ausnahme: eine Stornierung ist immer erlaubt, das widerspricht der Regel
  // nicht – im Gegenteil, sie ist genau das, wovor die Regel schützen will.
  if (nach !== 'cancelled') {
    const sichtbar = imAdminSichtbar(
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
    if (!sichtbar) {
      return { ok: false, grund: 'noch-nicht-freigegeben', aktuell: von };
    }
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
    try {
      // Fällt auf die bereits gespeicherte Sendungsnummer zurück (z.B. durch
      // die DHL-Label-Erstellung, siehe shippingService.ts), wenn beim
      // Statuswechsel selbst keine manuell eingegeben wurde – sonst müsste
      // der Admin eine bereits bekannte Nummer ein zweites Mal abtippen.
      // Eine explizit übergebene Nummer hat weiterhin Vorrang (bewusste
      // Überschreibung, z.B. bei einem abweichenden Versandweg).
      const trackingNummer = optionen.trackingNummer?.trim() || bestellung.tracking_number || null;
      const versand = await sendOrderShippedEmail({
        orderId,
        orderNumber: buildOrderNumber(orderId),
        empfaenger: bestellung.email,
        trackingNummer,
        carrier: bestellung.carrier,
      });
      await protokolliereBestellereignis(
        {
          orderId,
          eventType: 'email_sent',
          reason: 'Versandbenachrichtigung an den Kunden versendet.',
          detail: { anlass: 'order_shipped', messageId: versand?.messageId ?? null },
        },
        db
      );
    } catch (err) {
      console.error(`[orders] Versandmail ${orderId} fehlgeschlagen (nicht-fatal):`, err);
    }
  }

  if (nach === 'in_production' && bestellung.email) {
    try {
      const versand = await sendOrderInProductionEmail({
        orderId,
        orderNumber: buildOrderNumber(orderId),
        empfaenger: bestellung.email,
      });
      await protokolliereBestellereignis(
        {
          orderId,
          eventType: 'email_sent',
          reason: 'Produktionsbeginn-Benachrichtigung an den Kunden versendet.',
          detail: { anlass: 'order_in_production', messageId: versand?.messageId ?? null },
        },
        db
      );
    } catch (err) {
      console.error(`[orders] Produktionsmail ${orderId} fehlgeschlagen (nicht-fatal):`, err);
    }
  }

  if (nach === 'completed' && bestellung.email) {
    try {
      const versand = await sendOrderCompletedEmail({
        orderId,
        orderNumber: buildOrderNumber(orderId),
        empfaenger: bestellung.email,
      });
      await protokolliereBestellereignis(
        {
          orderId,
          eventType: 'email_sent',
          reason: 'Abschluss-Benachrichtigung an den Kunden versendet.',
          detail: { anlass: 'order_completed', messageId: versand?.messageId ?? null },
        },
        db
      );
    } catch (err) {
      console.error(`[orders] Abschlussmail ${orderId} fehlgeschlagen (nicht-fatal):`, err);
    }
  }

  // Kulanzstornierung durch den Betreiber: dieselbe Storno-Bestätigung wie
  // bei der Selbststornierung durch den Kunden (storniereBestellungDurchKunden
  // oben) – der Kunde soll unabhängig davon, WER storniert hat, denselben
  // belastbaren Nachweis bekommen, dass keine Kosten entstehen.
  if (nach === 'cancelled' && bestellung.email) {
    try {
      const versand = await sendOrderCancellationEmail({
        orderId,
        orderNumber: buildOrderNumber(orderId),
        empfaenger: bestellung.email,
        storniertAm: jetzt.toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' }),
        erstattungFaellig: erstattungAusstehend,
      });
      await protokolliereBestellereignis(
        {
          orderId,
          eventType: 'email_sent',
          reason: 'Storno-Bestätigung an den Kunden versendet (Kulanzstornierung durch den Betreiber).',
          detail: { anlass: 'order_cancelled', quelle: 'admin', messageId: versand?.messageId ?? null },
        },
        db
      );
    } catch (err) {
      console.error(`[orders] Storno-Bestätigung (Admin) ${orderId} fehlgeschlagen (nicht-fatal):`, err);
    }
  }

  return { ok: true, von, nach, bereitsErreicht: false, erstattungAusstehend };
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
    if (error) console.warn(`[orders] Historie-Eintrag "${eintrag.eventType}" nicht geschrieben:`, error.message);
  } catch (err) {
    console.warn(`[orders] Historie-Eintrag "${eintrag.eventType}" fehlgeschlagen:`, err);
  }
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
    .select('id, email, created_at, status, order_type, internal_notification_email_id, accounting_ready_at, payment_status')
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
        // Bestellnummer wird abgeleitet, sie ist keine Spalte.
        orderNumber: buildOrderNumber(orderId),
        empfaenger: bestellung.email,
        storniertAm: jetzt.toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' }),
        erstattungFaellig: bestellung.payment_status === 'paid',
      });
      await protokolliereBestellereignis(
        {
          orderId,
          eventType: 'email_sent',
          reason: 'Storno-Bestätigung an den Kunden versendet.',
          detail: { anlass: 'order_cancelled', messageId: versand?.messageId ?? null },
        },
        db
      );
    } catch (err) {
      console.error(`[orders] Storno-Bestätigung ${orderId} fehlgeschlagen (nicht-fatal):`, err);
      await protokolliereBestellereignis(
        {
          orderId,
          eventType: 'email_failed',
          reason: 'Storno-Bestätigung konnte nicht versendet werden.',
          detail: { anlass: 'order_cancelled', fehler: err instanceof Error ? err.message : String(err) },
        },
        db
      );
    }
  } else {
    console.warn(`[orders] Storno-Bestätigung ${orderId} übersprungen: keine E-Mail-Adresse hinterlegt.`);
  }

  // HIER gehört künftig die Freigabe reservierter Bestände hin, sobald es
  // eine Bestandsführung gibt. Bewusst kein leerer Platzhalter-Aufruf –
  // eine Funktion, die nichts tut, sieht nach Funktionalität aus.

  return { ok: true, bereitsStorniert: false, erstattungAusstehend: bestellung.payment_status === 'paid' };
}
