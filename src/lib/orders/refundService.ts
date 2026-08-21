/**
 * ═══════════════════════════════════════════════════════════════════════
 * RÜCKERSTATTUNG STORNIERTER, BEZAHLTER BESTELLUNGEN – unsere Geschäftslogik
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Dieselbe Schichtung wie `paymentService.ts`: `lib/payments/` bleibt rein
 * (Port, Adapter, kein Datenbankzugriff), die fachliche Entscheidung – WANN
 * erstattet wird, WELCHER Betrag, WAS bei einem Fehlschlag geschieht – liegt
 * hier.
 *
 * ── Nur volle Erstattung ────────────────────────────────────────────────
 * Es gibt keinen Teilstorno. Erstattet wird IMMER `orders.total_price` – der
 * Betrag, den `verarbeiteZahlungsEreignis()` in `paymentService.ts` beim
 * ursprünglichen Zahlungseingang bereits exakt (ohne Toleranz) gegen den
 * tatsächlich beim Anbieter gebuchten Betrag geprüft hat. Für jede
 * `payment_status='paid'`-Bestellung gilt deshalb: `total_price` IST der
 * tatsächlich gezahlte Betrag.
 *
 * ── Warum ein Absturz hier UNGEFÄHRLICH ist ────────────────────────────
 * Anders als bei Lexware/DHL (siehe `persistiereKritischMitWiederholung` in
 * `orderService.ts`) trägt jeder Erstattungsaufruf einen STABILEN
 * Idempotenzschlüssel (`refund-${orderId}`, siehe `Erstattungsauftrag` in
 * `lib/payments/types.ts`). Ein Absturz zwischen einer erfolgreichen
 * Anbieter-Antwort und der Persistierung führt deshalb praktisch NIE zu
 * einer zweiten echten Erstattung: Der nächste Versuch (Cron-Reaper oder
 * Admin-Retry) ruft denselben Anbieter-Endpunkt mit demselben Schlüssel
 * erneut auf und bekommt innerhalb des vom Anbieter vorgehaltenen
 * Zeitfensters das Ergebnis des ursprünglichen Aufrufs zurück; danach trägt
 * eine zweite, unabhängige Ebene dieselbe Sicherheit (siehe Kopfkommentar
 * von `supabase/migrations/0029_rueckerstattung.sql`).
 */
import { createAdminClient } from '@/lib/supabase/server';
import { waehleZahlungsAnbieter } from '@/lib/payments/registry';
import { euroZuCent } from '@/lib/payments/betrag';
import type { ZahlungsAnbieterId, ZahlungsEreignis } from '@/lib/payments/types';
import { formatiereGeld } from '@/lib/format';
import { protokolliereBestellereignis, persistiereKritischMitWiederholung } from './orderService';
import type { EreignisErgebnis } from './paymentService';

export type ErstattungsAnstossErgebnis =
  | { ok: true; ausgang: 'erstattet' | 'bereits_erledigt' }
  | { ok: false; grund: string };

/**
 * Stößt die Rückerstattung einer stornierten, bezahlten Bestellung an – oder
 * tut nichts, wenn sie aktuell nicht ansteht.
 *
 * Aufrufer:
 *  - `orderCancellation.ts`/`orderStatusActions.ts` direkt nach einer
 *    FRISCHEN Stornierung einer bezahlten Bestellung
 *    (`StornoErgebnis.erstattungAusstehend`/`StatusErgebnis.erstattungAusstehend`),
 *  - der Admin-Bereich über `retryErstattung()` (Server Action, in
 *    `lib/actions/refundActions.ts`),
 *  - `gib_haengende_erstattungen_frei` setzt hängengebliebene Versuche
 *    zurück auf `required` – der NÄCHSTE dieser drei Aufrufer holt sie dann
 *    nach (kein eigener aktiver Nachhol-Job nötig, anders als bei
 *    `holeOffeneAbschluesseNach` für Zahlungen).
 *
 * Beansprucht via `beanspruche_erstattung` (Migration 0029) – zwei
 * gleichzeitige Aufrufe (automatischer Anstoß + ein Admin-Klick auf „Erneut
 * versuchen" im selben Moment) gewinnen nie beide.
 *
 * Wirft nicht.
 */
export async function stelleErstattungSicher(orderId: string): Promise<ErstattungsAnstossErgebnis> {
  const db = createAdminClient();

  const { data: anspruch, error: claimFehler } = await db.rpc('beanspruche_erstattung', { p_order_id: orderId });
  if (claimFehler) {
    console.error(`[erstattung] Anspruch für ${orderId} fehlgeschlagen:`, claimFehler.message);
    return { ok: false, grund: claimFehler.message };
  }
  const beansprucht = Array.isArray(anspruch) ? anspruch.length > 0 : Boolean(anspruch);
  if (!beansprucht) {
    // Kein Anspruch bekommen: entweder bereits erstattet, fachlich (noch)
    // nicht fällig (nicht storniert/nicht bezahlt), oder ein anderer Lauf
    // ist gerade dran. Der aktuelle Stand entscheidet, was davon zutrifft.
    const { data: bestellung } = await db.from('orders').select('refund_status').eq('id', orderId).maybeSingle();
    if (bestellung?.refund_status === 'refunded') {
      return { ok: true, ausgang: 'bereits_erledigt' };
    }
    return {
      ok: false,
      grund: 'Erstattung aktuell nicht beanspruchbar (nicht storniert/bezahlt, bereits erstattet, oder ein anderer Lauf ist aktiv).',
    };
  }

  const { data: bestellung, error: ladeFehler } = await db
    .from('orders')
    .select('id, total_price, payment_provider, payment_transaction_id')
    .eq('id', orderId)
    .maybeSingle<{
      id: string;
      total_price: number | string | null;
      payment_provider: string | null;
      payment_transaction_id: string | null;
    }>();

  if (ladeFehler || !bestellung || !bestellung.payment_transaction_id) {
    // Ohne Transaktions-ID lässt sich beim Anbieter nichts zuordnen – das
    // deutet auf eine Dateninkonsistenz hin (eine `payment_status='paid'`-
    // Bestellung sollte `payment_transaction_id` IMMER gesetzt haben, siehe
    // `bestaetigeZahlung()` in paymentService.ts). Anspruch freigeben, damit
    // ein Admin nach Behebung erneut versuchen kann.
    console.error(`[erstattung] Bestellung ${orderId} nach Anspruch nicht ladbar oder ohne payment_transaction_id.`);
    await db.rpc('gib_erstattung_frei', { p_order_id: orderId });
    return { ok: false, grund: 'Bestellung nach Anspruch nicht ladbar oder ohne payment_transaction_id.' };
  }

  const betragCent = euroZuCent(Number(bestellung.total_price ?? 0));
  const anbieter = waehleZahlungsAnbieter(bestellung.payment_provider as ZahlungsAnbieterId | undefined);

  let ergebnis;
  try {
    ergebnis = await anbieter.erstatte({
      transaktionId: bestellung.payment_transaction_id,
      betragCent,
      waehrung: 'EUR',
      // STABIL über jeden Versuch hinweg – siehe Kopfkommentar dieser Datei
      // und Erstattungsauftrag in lib/payments/types.ts.
      idempotenzSchluessel: `refund-${orderId}`,
    });
  } catch (err) {
    // EINDEUTIGER Fehlschlag (der Anbieter hat synchron abgelehnt) – Anspruch
    // sofort freigeben (→ 'failed'), damit ein Retry nicht erst auf den
    // Cron-Reaper warten muss.
    const text = err instanceof Error ? err.message : String(err);
    console.error(`[erstattung] Anbieter-Aufruf für ${orderId} fehlgeschlagen:`, err);
    await db.rpc('gib_erstattung_frei', { p_order_id: orderId });
    await protokolliereBestellereignis(
      { orderId, eventType: 'refund_failed', reason: `Rückerstattung fehlgeschlagen: ${text}` },
      db
    );
    return { ok: false, grund: text };
  }

  // Der Anbieter-Aufruf ist JETZT bereits real geschehen. Ab hier gilt
  // dieselbe Vorsicht wie bei Rechnung/Label: mehrere Schreibversuche, bevor
  // ein Fehlschlag hingenommen wird.
  const gespeichert = await persistiereKritischMitWiederholung(db, orderId, {
    refund_status: 'refunded',
    refund_amount_cent: betragCent,
    refund_reference: ergebnis.erstattungsId,
    refunded_at: new Date().toISOString(),
    refund_erstattung_gestartet_am: null,
  });

  if (!gespeichert) {
    // KRITISCH, aber – anders als bei Lexware/DHL – kein dauerhaftes
    // "unklarer Zustand"-Flag nötig: Der Anspruch bleibt bewusst auf
    // 'processing' stehen (NICHT freigegeben). `gib_haengende_erstattungen_frei`
    // setzt ihn nach Ablauf der Frist automatisch auf 'required' zurück, und
    // der nächste Versuch (Cron oder Admin-Retry) ruft `erstatte()` erneut
    // mit demselben Idempotenzschlüssel auf – der Anbieter liefert dann
    // sicher das bereits vorliegende Ergebnis zurück, statt ein zweites Mal
    // echtes Geld zu bewegen. Diese Zeile hier ist rein diagnostisch.
    console.error(
      `[erstattung] KRITISCH: Erstattung ${ergebnis.erstattungsId} für ${orderId} beim Anbieter erfolgt, aber nicht persistierbar – Anspruch bleibt aktiv, automatischer Retry über den Cron-Reaper.`
    );
    return { ok: false, grund: `Erstattung beim Anbieter erfolgt (${ergebnis.erstattungsId}), aber nicht gespeichert.` };
  }

  await protokolliereBestellereignis(
    {
      orderId,
      eventType: 'refund_succeeded',
      reason: `Rückerstattung über ${formatiereGeld(betragCent / 100)} abgeschlossen.`,
      detail: { anbieter: anbieter.id, erstattungsId: ergebnis.erstattungsId, betragCent },
    },
    db
  );

  return { ok: true, ausgang: 'erstattet' };
}

/**
 * Holt hängengebliebene Rückerstattungen nach, für die weder der
 * automatische Anstoß bei der Stornierung noch ein bisheriger Admin-Retry sie
 * je abgeschlossen hat.
 *
 * Dasselbe Muster wie `holeOffeneAbschluesseNach()` in `paymentService.ts`
 * und `holeOffeneRechnungenNach()`/das Versand-Pendant: Der Cron-Reaper
 * (`gib_haengende_erstattungen_frei`, Migration 0029) gibt einen verwaisten
 * Anspruch zwar frei, ruft aber selbst nichts erneut auf – das schließt diese
 * Funktion.
 */
export async function holeOffeneErstattungenNach(
  limit: number
): Promise<{ gefunden: number; erstattet: number; weiterhinOffen: number }> {
  const db = createAdminClient();
  // Muss der Auswahlbedingung von beanspruche_erstattung (Migration 0029)
  // EXAKT entsprechen – sonst holt dieser Retry entweder echte Kandidaten
  // nicht nach oder wählt Bestellungen aus, die der Claim strukturell
  // ohnehin nie annehmen würde (siehe refundRetry.test.ts).
  const { data, error } = await db
    .from('orders')
    .select('id')
    .eq('status', 'cancelled')
    .eq('payment_status', 'paid')
    .in('refund_status', ['required', 'failed'])
    .is('refund_erstattung_gestartet_am', null)
    .order('cancelled_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[erstattung] Suche nach offenen Rückerstattungen fehlgeschlagen:', error.message);
    return { gefunden: 0, erstattet: 0, weiterhinOffen: 0 };
  }

  let erstattet = 0;
  let weiterhinOffen = 0;
  // Sequenziell statt parallel, gleiche Begründung wie bei den Nachbar-
  // Nachholfunktionen: Regelfall ist 0 Treffer, jeder Treffer löst einen
  // echten Zahlungsanbieter-Aufruf aus – kein Durchsatz-Pfad.
  for (const zeile of data ?? []) {
    const orderId = zeile.id as string;
    const ergebnis = await stelleErstattungSicher(orderId);
    if (ergebnis.ok) {
      erstattet++;
    } else {
      weiterhinOffen++;
      console.warn(`[erstattung] Nachholversuch für ${orderId} weiterhin ohne Erfolg: ${ergebnis.grund}`);
    }
  }

  return { gefunden: (data ?? []).length, erstattet, weiterhinOffen };
}

/**
 * Verarbeitet die Webhook-Bestätigung einer Rückerstattung (Stripe
 * `charge.refunded`, PayPal `PAYMENT.CAPTURE.REFUNDED`) – aufgerufen von
 * `verarbeiteZahlungsEreignis()` in `paymentService.ts` für
 * `ereignis.art === 'erstattet'`.
 *
 * ── Bestätigung, kein Auslöser ──────────────────────────────────────────
 * Die eigentliche Erstattung läuft ausschließlich über unseren eigenen
 * `erstatte()`-Aufruf in `stelleErstattungSicher()` oben. Dieses Ereignis
 * bestätigt nur zusätzlich, was der Anbieter unabhängig meldet – als zweite
 * Absicherung, falls unser eigener Weg (Cron-Reaper eingeschlossen) aus
 * irgendeinem Grund nie zum Abschluss kam.
 *
 * ── Warum die WHERE-Bedingung so eng ist ────────────────────────────────
 * Nur Bestellungen, für die WIR bereits `refund_status` auf 'required',
 * 'processing' oder 'failed' gesetzt haben, werden hier bestätigt. Eine
 * Bestellung mit `refund_status='not_applicable'` bekäme sonst durch ein
 * Anbieter-Ereignis eine Rückerstattung angedichtet, die unser System nie
 * ausgelöst hat (z.B. eine manuelle Erstattung direkt im Anbieter-
 * Dashboard) – das wird stattdessen nur protokolliert, siehe unten.
 *
 * `payment_status` wird an KEINER Stelle dieser Funktion berührt (Audit Z7,
 * docs/zahlungs-audit.md) – ausschließlich `refund_status` und die
 * begleitenden Erstattungsfelder.
 */
export async function bestaetigeErstattungViaWebhook(
  db: ReturnType<typeof createAdminClient>,
  ereignis: ZahlungsEreignis
): Promise<EreignisErgebnis> {
  const { data: geaendert, error } = await db
    .from('orders')
    .update({
      refund_status: 'refunded',
      refunded_at: new Date().toISOString(),
      refund_reference: ereignis.referenz,
      refund_amount_cent: ereignis.betragCent,
      refund_erstattung_gestartet_am: null,
    })
    .eq('id', ereignis.bestellId)
    .in('refund_status', ['required', 'processing', 'failed'])
    .select('id');

  if (error) {
    // TECHNISCH: erneut zustellen lassen, dieselbe Haltung wie bei
    // bestaetigeZahlung() in paymentService.ts.
    console.error(`[erstattung] Webhook-Bestätigung für ${ereignis.bestellId} fehlgeschlagen:`, error);
    return { ok: false, wiederholen: true, grund: error.message };
  }

  if ((geaendert?.length ?? 0) === 0) {
    // Kein Treffer: entweder unser eigener Weg war bereits schneller
    // (refund_status bereits 'refunded' – der Regelfall bei einer normalen
    // Zustellreihenfolge), oder die Bestellung stand nie zur Erstattung an.
    const { data: aktuell } = await db
      .from('orders')
      .select('refund_status')
      .eq('id', ereignis.bestellId)
      .maybeSingle();
    if (aktuell?.refund_status === 'not_applicable') {
      console.warn(
        `[erstattung] Unerwartete Rückerstattungsbestätigung für ${ereignis.bestellId} – refund_status war 'not_applicable' (evtl. manuell beim Anbieter ausgelöst, außerhalb unseres Systems).`
      );
    }
    return { ok: true, wirkung: 'erstattet', bereitsVerarbeitet: true };
  }

  await protokolliereBestellereignis(
    {
      orderId: ereignis.bestellId,
      eventType: 'refund_confirmed_via_webhook',
      reason: 'Rückerstattung zusätzlich über Webhook bestätigt.',
      detail: { ereignisId: ereignis.ereignisId, referenz: ereignis.referenz, betragCent: ereignis.betragCent },
    },
    db
  );

  return { ok: true, wirkung: 'erstattet', bereitsVerarbeitet: false };
}
