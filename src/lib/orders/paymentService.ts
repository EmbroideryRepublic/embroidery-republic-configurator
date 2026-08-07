/**
 * ═══════════════════════════════════════════════════════════════════════
 * ZAHLUNGSVORGÄNGE EINER BESTELLUNG – unsere Geschäftslogik
 * ═══════════════════════════════════════════════════════════════════════
 *
 * JEDE fachliche Entscheidung über eine Zahlung fällt hier: ob eine
 * eröffnet werden darf, mit welchem Betrag, ob ein Ereignis den Zustand
 * ändern darf, und was danach zu geschehen hat.
 *
 * Der Zahlungsdienstleister liefert ausschließlich EREIGNISSE und
 * technische Kennungen. Er bestimmt nie den fachlichen Zustand einer
 * Bestellung – er meldet nur, was auf seiner Seite passiert ist.
 *
 * ── Warum diese Datei hier liegt und nicht in lib/payments ────────────
 * `lib/payments/` ist die REINE Schicht: Port, Betragsregel, Adapter. Sie
 * kennt keine Datenbank. Sobald Zustand gelesen oder geschrieben wird, ist
 * es Geschäftslogik der Bestellung – und die liegt in `lib/orders/`, genau
 * wie `orderService.ts` für den Bestellstatus.
 *
 * Damit gilt dieselbe Aufteilung wie beim Bestellstatus:
 *   config/orderStatus.ts   (rein)  ←→  orders/orderService.ts    (Zustand)
 *   payments/*              (rein)  ←→  orders/paymentService.ts  (Zustand)
 *
 * ── Idempotenz ────────────────────────────────────────────────────────
 * Der gesamte Schutz steckt in EINER Bedingung:
 * `where payment_status = 'pending'`. Ein zweites Mal zugestelltes Ereignis
 * trifft null Zeilen und löst deshalb keine Folgeschritte aus. Dieselbe
 * Bedingung verhindert, dass ein verspätetes „fehlgeschlagen" eine bereits
 * bestätigte Zahlung zurücksetzt. Keine Ereignistabelle nötig – siehe
 * docs/zahlungsarchitektur.md, Abschnitt 4a.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { waehleZahlungsAnbieter } from '@/lib/payments/registry';
import { euroZuCent, pruefeZahlbetrag } from '@/lib/payments/betrag';
import type { ZahlungsAnbieterId, ZahlungsEreignis } from '@/lib/payments/types';
import { formatiereGeld } from '@/lib/format';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { protokolliereBestellereignis } from './orderService';
import { ladeBestellungFuerAbschluss, schliesseBestellungAb } from './orderCompletion';
import { sendEmail } from '@/lib/email/sendEmail';
import { PaymentSucceededEmail } from '@/lib/email/templates/PaymentSucceededEmail';
import { PaymentFailedEmail } from '@/lib/email/templates/PaymentFailedEmail';
import { basisUrl } from '@/lib/seo/basisUrl';
import { bestellansichtUrl } from './orderIntake';

/**
 * Minimaler, unabhängiger Nachschlag für die beiden Zahlungs-E-Mails – NICHT
 * dasselbe wie `ladeBestellungFuerAbschluss` (das lädt den vollen
 * Bestellkontext für Phase 2). E-Mail-Versand ist bewusst entkoppelt vom
 * Abschluss-Anspruch: Schlägt Phase 2 fehl, soll die Kundschaft trotzdem
 * wissen, dass die Zahlung angekommen ist.
 */
async function ladeEmailUndBetrag(
  db: ReturnType<typeof createAdminClient>,
  orderId: string
): Promise<{ email: string; totalPrice: number } | null> {
  const { data, error } = await db.from('orders').select('email, total_price').eq('id', orderId).maybeSingle();
  if (error || !data) return null;
  return { email: data.email as string, totalPrice: Number(data.total_price ?? 0) };
}

/**
 * Ereignisnamen für die Bestell-Historie.
 *
 * Bewusst eine feste Zuordnung statt `payment_${art}`: Die Ereignisarten
 * sind deutsch benannt, die `event_type`-Werte in `order_events` durchgängig
 * englisch (`email_sent`, `status_changed`, `payment_started`). Eine
 * Zeichenkette zusammenzusetzen ergäbe Mischformen wie `payment_abgebrochen`
 * – und Auswertungen über die Historie müssten beide Sprachen kennen.
 */
const EREIGNIS_PROTOKOLLNAME: Record<ZahlungsEreignis['art'], string> = {
  bestaetigt: 'payment_succeeded',
  fehlgeschlagen: 'payment_failed',
  abgebrochen: 'payment_abandoned',
  abgelaufen: 'payment_expired',
};

export type ZahlungStartErgebnis =
  | { ok: true; weiterleitungUrl: string; referenz: string; betragCent: number; wiederaufgenommen: boolean }
  | { ok: false; meldung: string; grund: string };

export interface ZahlungStartEingabe {
  orderId: string;
  /**
   * Frisch aus der Preispipeline berechneter Gesamtbetrag in Euro.
   *
   * Wird angegeben, wenn die Zahlung unmittelbar nach dem Anlegen eröffnet
   * wird – dann liegt das Ergebnis der Berechnung noch vor und lässt sich
   * gegen den gespeicherten Betrag prüfen (`pruefeZahlbetrag`).
   *
   * Fehlt der Wert (Wiederaufnahme in einer späteren Anfrage), gilt der
   * GESPEICHERTE Betrag. Das ist keine Nachlässigkeit, sondern fachlich
   * richtig: Maßgeblich ist der Betrag, den die Kundschaft bestätigt hat.
   * Hätte sich der Katalogpreis inzwischen geändert, dürfte der neue Preis
   * ohnehin nicht stillschweigend eingezogen werden.
   */
  neuBerechnetEuro?: number;
  anbieterId?: ZahlungsAnbieterId;
}

/**
 * Eröffnet einen Bezahlvorgang für eine bereits ANGELEGTE Bestellung.
 *
 * Deckt beides ab – den ersten Versuch und die Wiederaufnahme eines
 * abgebrochenen. Der Unterschied ist bewusst kein eigener Einstiegspunkt:
 * Fachlich ist es derselbe Vorgang, nur mit einem Vorlauf (den alten
 * Vorgang verwerfen).
 */
export async function starteZahlung({
  orderId,
  neuBerechnetEuro,
  anbieterId,
}: ZahlungStartEingabe): Promise<ZahlungStartErgebnis> {
  const db = createAdminClient();

  const { data: bestellung, error } = await db
    .from('orders')
    .select('id, order_type, status, total_price, payment_status, payment_reference, payment_provider')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !bestellung) {
    return { ok: false, meldung: 'Diese Bestellung wurde nicht gefunden.', grund: `Bestellung ${orderId} nicht ladbar.` };
  }

  // ── Fachliche Vorbedingungen ────────────────────────────────────────
  if (bestellung.order_type !== 'order') {
    return { ok: false, meldung: 'Für eine unverbindliche Anfrage ist keine Zahlung nötig.', grund: 'order_type ist nicht "order".' };
  }
  if (bestellung.status === 'cancelled') {
    return { ok: false, meldung: 'Diese Bestellung wurde storniert.', grund: 'Bestellung ist storniert.' };
  }
  if (bestellung.payment_status === 'paid') {
    // Kein Fehler im eigentlichen Sinn – aber auch kein zweiter Vorgang.
    return { ok: false, meldung: 'Diese Bestellung ist bereits bezahlt.', grund: 'payment_status ist bereits "paid".' };
  }

  // ── Betrag ──────────────────────────────────────────────────────────
  const gespeichertEuro = Number(bestellung.total_price ?? 0);
  const pruefung = pruefeZahlbetrag({
    neuBerechnetEuro: neuBerechnetEuro ?? gespeichertEuro,
    gespeichertEuro,
  });
  if (!pruefung.ok) {
    console.error(`[zahlung] Betrag für ${orderId} nicht belastbar: ${pruefung.grund}`);
    await protokolliereBestellereignis({
      orderId,
      eventType: 'payment_blocked',
      reason: pruefung.grund,
    });
    return { ok: false, meldung: pruefung.meldung, grund: pruefung.grund };
  }

  const anbieter = waehleZahlungsAnbieter(anbieterId ?? (bestellung.payment_provider as ZahlungsAnbieterId | undefined));

  // ── Wiederaufnahme: den alten Vorgang zuerst entwerten ──────────────
  // Ohne diesen Schritt bliebe ein früher geöffneter Bezahlvorgang in einem
  // anderen Browser-Tab bezahlbar. Es gäbe dann zwei gültige Vorgänge für
  // eine Bestellung – und eine tatsächlich erfolgte Zahlung, die keinem
  // aktuellen Vorgang zuzuordnen wäre.
  const alteReferenz = bestellung.payment_reference as string | null;
  const wiederaufgenommen = Boolean(alteReferenz);
  if (alteReferenz) {
    try {
      await anbieter.verwerfe(alteReferenz);
    } catch (err) {
      // Der Port sagt zu, nicht zu werfen – diese Sicherung greift nur bei
      // einem fehlerhaften Adapter. Ein bereits abgelaufener Vorgang ist
      // kein Grund, die Wiederaufnahme zu verhindern.
      console.warn(`[zahlung] Alter Vorgang ${alteReferenz} nicht verworfen:`, err);
    }
  }

  // ── Vorgang eröffnen ────────────────────────────────────────────────
  const bestellnummer = buildOrderNumber(orderId);
  let eroeffnung;
  try {
    eroeffnung = await anbieter.eroeffne({
      bestellId: orderId,
      bestellnummer,
      betragCent: pruefung.betragCent,
      waehrung: 'EUR',
      beschreibung: `Bestellung ${bestellnummer}`,
      rueckkehrUrl: `${basisUrl()}/bestellung/zahlung/${orderId}`,
      abbruchUrl: `${basisUrl()}/bestellung/zahlung/${orderId}?abgebrochen=1`,
      // Je Versuch eigener Schlüssel: Eine Wiederaufnahme SOLL einen neuen
      // Vorgang erzeugen. Innerhalb eines Versuchs verhindert er, dass ein
      // wiederholter Aufruf einen zweiten anlegt.
      idempotenzSchluessel: `${orderId}-${Date.now().toString(36)}`,
    });
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    console.error(`[zahlung] Vorgang für ${orderId} nicht eröffnet:`, err);
    return {
      ok: false,
      meldung: 'Die Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es in ein paar Minuten erneut.',
      grund: text,
    };
  }

  // ── Zustand festhalten ──────────────────────────────────────────────
  const { error: updateFehler } = await db
    .from('orders')
    .update({
      payment_status: 'pending',
      payment_provider: anbieter.id,
      payment_reference: eroeffnung.referenz,
      payment_started_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateFehler) {
    console.error(`[zahlung] Zustand für ${orderId} nicht gespeichert:`, updateFehler);
    return {
      ok: false,
      meldung: 'Die Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.',
      grund: updateFehler.message,
    };
  }

  await protokolliereBestellereignis({
    orderId,
    eventType: 'payment_started',
    reason: wiederaufgenommen
      ? `Zahlung erneut gestartet über ${formatiereGeld(pruefung.betragCent / 100)}.`
      : `Zahlung gestartet über ${formatiereGeld(pruefung.betragCent / 100)}.`,
    detail: { anbieter: anbieter.id, referenz: eroeffnung.referenz, betragCent: pruefung.betragCent, wiederaufgenommen },
  });

  return {
    ok: true,
    weiterleitungUrl: eroeffnung.weiterleitungUrl,
    referenz: eroeffnung.referenz,
    betragCent: pruefung.betragCent,
    wiederaufgenommen,
  };
}

export type EreignisErgebnis =
  | { ok: true; wirkung: 'bestaetigt' | 'fehlgeschlagen'; bereitsVerarbeitet: boolean }
  // `wiederholen` trennt zwei grundverschiedene Fehlschläge:
  //   false → FACHLICH abgelehnt (Betragsabweichung, unbekannte Bestellung).
  //           Deterministisch – eine erneute Zustellung ergäbe dasselbe.
  //   true  → TECHNISCH gescheitert (Datenbank nicht erreichbar). Transient –
  //           der Anbieter SOLL erneut zustellen.
  // Ohne diese Unterscheidung würde ein DB-Aussetzer wie eine fachliche
  // Ablehnung mit 200 quittiert; Stripe stellte nie erneut zu, und eine
  // bestätigte Zahlung bliebe für immer unverbucht.
  | { ok: false; wiederholen: boolean; grund: string };

/**
 * Verarbeitet ein normalisiertes Zahlungsereignis.
 *
 * Der Anbieter hat es geliefert – ENTSCHIEDEN wird hier. Ein Ereignis ist
 * eine Meldung über die Außenwelt, keine Anweisung.
 */
export async function verarbeiteZahlungsEreignis(ereignis: ZahlungsEreignis): Promise<EreignisErgebnis> {
  const db = createAdminClient();

  const { data: bestellung, error } = await db
    .from('orders')
    .select('id, order_type, status, total_price, payment_status')
    .eq('id', ereignis.bestellId)
    .maybeSingle();

  if (error) {
    // Datenbank nicht erreichbar → TECHNISCH, erneut zustellen lassen.
    console.error(`[zahlung] Bestellung ${ereignis.bestellId} nicht ladbar (technisch):`, error);
    return { ok: false, wiederholen: true, grund: `DB-Fehler beim Laden: ${error.message}` };
  }
  if (!bestellung) {
    // Keine solche Bestellung – ein erneuter Versuch ergäbe dasselbe. Das
    // ist entweder ein fremdes/fehlgeleitetes Ereignis oder eine falsche
    // Endpunktkonfiguration; beides löst sich nicht durch Wiederholung.
    return { ok: false, wiederholen: false, grund: `Bestellung ${ereignis.bestellId} nicht gefunden.` };
  }

  // ── Betragsabgleich: melden ist nicht bestimmen ─────────────────────
  // Der vom Anbieter genannte Betrag wird GEPRÜFT, nie übernommen. Weicht
  // er ab, gilt die Zahlung nicht als bestätigt – auch wenn der Anbieter
  // das behauptet.
  if (ereignis.art === 'bestaetigt') {
    const erwartetCent = euroZuCent(Number(bestellung.total_price ?? 0));
    if (ereignis.betragCent !== erwartetCent) {
      console.error(
        `[zahlung] Betragsabweichung bei ${ereignis.bestellId}: gemeldet ${ereignis.betragCent}, erwartet ${erwartetCent} Cent.`
      );
      await protokolliereBestellereignis({
        orderId: ereignis.bestellId,
        eventType: 'payment_amount_mismatch',
        reason: `Gemeldeter Betrag (${ereignis.betragCent} Cent) weicht vom Bestellbetrag (${erwartetCent} Cent) ab – nicht als bezahlt gewertet.`,
        detail: { ereignisId: ereignis.ereignisId, referenz: ereignis.referenz },
      });
      // FACHLICH: der Betrag stimmt nicht – Wiederholung ändert nichts.
      return { ok: false, wiederholen: false, grund: 'Betragsabweichung' };
    }
  }

  return ereignis.art === 'bestaetigt'
    ? bestaetigeZahlung(db, ereignis)
    : markiereZahlungAlsGescheitert(db, ereignis);
}

/** Bestätigt eine Zahlung und stößt den Bestellabschluss an. */
async function bestaetigeZahlung(
  db: ReturnType<typeof createAdminClient>,
  ereignis: ZahlungsEreignis
): Promise<EreignisErgebnis> {
  // DIE Idempotenzbedingung. Trifft sie keine Zeile, war die Zahlung schon
  // bestätigt (erneut zugestelltes Ereignis) – dann passiert nichts weiter,
  // insbesondere keine zweite Bestätigungsmail.
  const { data: geaendert, error } = await db
    .from('orders')
    .update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      payment_transaction_id: ereignis.transaktionId ?? null,
    })
    .eq('id', ereignis.bestellId)
    .eq('payment_status', 'pending')
    .select('id');

  if (error) {
    // TECHNISCH: Die Zahlung IST beim Anbieter erfolgt – wir konnten sie nur
    // nicht verbuchen. Erneut zustellen lassen, sonst geht sie verloren.
    console.error(`[zahlung] Bestätigung für ${ereignis.bestellId} fehlgeschlagen:`, error);
    return { ok: false, wiederholen: true, grund: error.message };
  }

  if ((geaendert?.length ?? 0) === 0) {
    console.info(`[zahlung] Ereignis ${ereignis.ereignisId} bereits verarbeitet – übersprungen.`);
    return { ok: true, wirkung: 'bestaetigt', bereitsVerarbeitet: true };
  }

  await protokolliereBestellereignis({
    orderId: ereignis.bestellId,
    eventType: 'payment_succeeded',
    reason: 'Zahlung bestätigt.',
    detail: { ereignisId: ereignis.ereignisId, referenz: ereignis.referenz, betragCent: ereignis.betragCent },
  });

  // E-Mail ist "nice to have", nicht-fatal – dieselbe Haltung wie beim
  // Bestellabschluss (Rendering/PDF dürfen die verbuchte Zahlung nicht
  // rückgängig machen, ein fehlgeschlagener Mailversand erst recht nicht).
  const bestellinfo = await ladeEmailUndBetrag(db, ereignis.bestellId);
  if (bestellinfo) {
    await sendEmail({
      to: bestellinfo.email,
      subject: `Zahlung erhalten: ${buildOrderNumber(ereignis.bestellId)}`,
      react: PaymentSucceededEmail({ orderNumber: buildOrderNumber(ereignis.bestellId), betrag: bestellinfo.totalPrice }),
      kontext: { anlass: 'payment_succeeded', orderId: ereignis.bestellId },
    }).catch(() => {});
  }

  // ── JETZT erst Phase 2 ──────────────────────────────────────────────
  // Druckvorschauen, Produktionsblatt und Benachrichtigungen laufen genau
  // hier – nach bestätigter Zahlung, nicht vorher. Das ist der Grund für
  // die Phasentrennung aus S3.
  //
  // Nicht-fatal: Die Zahlung IST bestätigt. Scheitert der Abschluss, darf
  // das den Zahlungszustand nicht zurücknehmen – der Cron-Lauf holt ihn nach.
  await stelleAbschlussSicher(db, ereignis.bestellId);

  return { ok: true, wirkung: 'bestaetigt', bereitsVerarbeitet: false };
}

/**
 * Führt Phase 2 aus – höchstens einmal, auch bei erneut zugestellten oder
 * gleichzeitigen Webhooks.
 *
 * Der Anspruch (Claim) wird atomar in der Datenbank gesetzt
 * (`beanspruche_abschluss`, Migration 0020): Er greift nur, wenn die
 * Bestellung bezahlt ist, Phase 2 noch nicht läuft und noch kein
 * Produktionsblatt existiert. Zwei gleichzeitige Webhooks – einer bekommt den
 * Anspruch, der andere nicht und tut nichts.
 *
 * Warum `payment_status` als Marker nicht genügt: Nach der ersten Zustellung
 * steht er auf 'paid'. Eine wegen Zeitüberschreitung erneut zugestellte
 * Nachricht würde am `WHERE payment_status = 'pending'` scheitern und Phase 2
 * nie nachholen. Der separate Claim entkoppelt „bezahlt" von „abgeschlossen".
 *
 * Wirft nicht. Bei einem Fehler wird der Anspruch freigegeben, damit eine
 * spätere erneute Zustellung oder der Cron-Lauf Phase 2 nachholt.
 */
export async function stelleAbschlussSicher(
  db: ReturnType<typeof createAdminClient>,
  orderId: string
): Promise<void> {
  const { data: anspruch, error: claimFehler } = await db.rpc('beanspruche_abschluss', { p_order_id: orderId });
  if (claimFehler) {
    console.error(`[zahlung] Abschluss-Anspruch für ${orderId} fehlgeschlagen:`, claimFehler.message);
    return;
  }
  const beansprucht = Array.isArray(anspruch) ? anspruch.length > 0 : Boolean(anspruch);
  if (!beansprucht) {
    // Bereits abgeschlossen oder ein anderer Lauf ist gerade dran.
    return;
  }

  try {
    const order = await ladeBestellungFuerAbschluss(orderId);
    if (!order) {
      console.error(`[zahlung] Bestellung ${orderId} nach Zahlung nicht ladbar – Abschluss übersprungen.`);
      await db.rpc('gib_abschluss_frei', { p_order_id: orderId });
      return;
    }
    const abschluss = await schliesseBestellungAb(order);
    if (abschluss.probleme.length > 0) {
      console.warn(`[zahlung] Abschluss nach Zahlung mit Einschränkungen:`, abschluss.probleme);
    }
    // schliesseBestellungAb setzt pdf_url; der Anspruch gilt dadurch als
    // „fertig" – kein erneuter Lauf greift.
  } catch (err) {
    console.error('[zahlung] Abschluss nach Zahlung fehlgeschlagen (nicht-fatal):', err);
    await db.rpc('gib_abschluss_frei', { p_order_id: orderId });
  }
}

/**
 * Hält fest, dass ein Bezahlvorgang nicht zustande kam.
 *
 * Abbruch, Ablehnung und Zeitablauf führen zum selben Zustand `failed` – die
 * Kundschaft kann in allen drei Fällen einen neuen Versuch starten. Der
 * Unterschied ist rein informativ und steht als Grund in der Historie.
 */
async function markiereZahlungAlsGescheitert(
  db: ReturnType<typeof createAdminClient>,
  ereignis: ZahlungsEreignis
): Promise<EreignisErgebnis> {
  // Auch hier die Bedingung auf 'pending': Eine bereits bestätigte Zahlung
  // darf durch ein verspätetes „abgebrochen" NIEMALS zurückfallen.
  const { data: geaendert, error } = await db
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('id', ereignis.bestellId)
    .eq('payment_status', 'pending')
    .select('id');

  if (error) {
    // TECHNISCH: erneut zustellen lassen.
    console.error(`[zahlung] Fehlschlag für ${ereignis.bestellId} nicht gespeichert:`, error);
    return { ok: false, wiederholen: true, grund: error.message };
  }

  if ((geaendert?.length ?? 0) === 0) {
    console.info(`[zahlung] Ereignis ${ereignis.ereignisId} ohne Wirkung (Zustand nicht mehr offen).`);
    return { ok: true, wirkung: 'fehlgeschlagen', bereitsVerarbeitet: true };
  }

  await protokolliereBestellereignis({
    orderId: ereignis.bestellId,
    eventType: EREIGNIS_PROTOKOLLNAME[ereignis.art],
    reason: ereignis.grund ?? `Bezahlvorgang: ${ereignis.art}.`,
    detail: { ereignisId: ereignis.ereignisId, referenz: ereignis.referenz, art: ereignis.art },
  });

  // Nicht-fatal, wie überall: die Kundschaft soll wissen, dass sie es erneut
  // versuchen kann – ein fehlgeschlagener Mailversand ändert nichts am
  // bereits gespeicherten Zahlungszustand.
  const bestellinfo = await ladeEmailUndBetrag(db, ereignis.bestellId);
  if (bestellinfo) {
    const orderNumber = buildOrderNumber(ereignis.bestellId);
    await sendEmail({
      to: bestellinfo.email,
      subject: `Zahlung nicht erfolgreich: ${orderNumber}`,
      react: PaymentFailedEmail({
        orderNumber,
        bestellansichtUrl: bestellansichtUrl(ereignis.bestellId) ?? undefined,
      }),
      kontext: { anlass: 'payment_failed', orderId: ereignis.bestellId },
    }).catch(() => {});
  }

  return { ok: true, wirkung: 'fehlgeschlagen', bereitsVerarbeitet: false };
}
