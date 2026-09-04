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
 * Der Schutz steckt in der WHERE-Bedingung des jeweiligen UPDATE. Für einen
 * Fehlschlag (`markiereZahlungAlsGescheitert`) genügt `payment_status =
 * 'pending'`: ein zweites „fehlgeschlagen" trifft dann null Zeilen. Für eine
 * BESTÄTIGUNG (`bestaetigeZahlung`) reicht `'pending'` allein NICHT (siehe
 * Fund vom 2026-08-26, Produktionsreife-Audit): Stripe Checkout erlaubt nach
 * einer abgelehnten Karte einen erneuten Versuch auf DERSELBEN Session – der
 * Ablauf ist dann `pending → failed → paid` für dieselbe Bestellung, ganz
 * ohne `starteZahlung()`-Wiederaufnahme dazwischen. Die Bedingung dort ist
 * deshalb `payment_status IN ('pending','failed')`. Das bleibt trotzdem
 * lückenlos idempotent: Sobald `payment_status='paid'` gesetzt ist, matcht
 * KEINE der beiden Bedingungen mehr – eine erneute Zustellung eines
 * bestätigten Ereignisses trifft weiterhin null Zeilen. Keine Ereignistabelle
 * nötig – siehe docs/zahlungsarchitektur.md, Abschnitt 4a.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { waehleZahlungsAnbieter } from '@/lib/payments/registry';
import { euroZuCent, pruefeZahlbetrag } from '@/lib/payments/betrag';
import type { ZahlungsAnbieterId, ZahlungsEreignis } from '@/lib/payments/types';
import { formatiereGeld } from '@/lib/format';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { protokolliereBestellereignis } from './orderService';
import { meldeEreignis } from '@/lib/observability/ereignis';
import { bestaetigeErstattungViaWebhook } from './refundService';
import { ladeBestellungFuerAbschluss, schliesseBestellungAb } from './orderCompletion';
import { sendEmail } from '@/lib/email/sendEmail';
import { PaymentFailedEmail } from '@/lib/email/templates/PaymentFailedEmail';
import { basisUrl } from '@/lib/seo/basisUrl';
import { bestellansichtUrl } from './orderIntake';
import { erzeugeBestellToken } from './orderAccessToken';

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
): Promise<{ email: string; totalPrice: number; orderNumber: string | null } | null> {
  const { data, error } = await db.from('orders').select('email, total_price, order_number').eq('id', orderId).maybeSingle();
  if (error || !data) return null;
  return { email: data.email as string, totalPrice: Number(data.total_price ?? 0), orderNumber: (data.order_number as string | null) ?? null };
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
  // Nur der Vollständigkeit halber hier eingetragen (der Compiler verlangt
  // alle ZahlungsEreignisArt-Werte) – tatsächlich verwendet wird dieser
  // Name NICHT über diese Tabelle, sondern direkt in
  // bestaetigeErstattungViaWebhook() (refundService.ts), da 'erstattet' in
  // verarbeiteZahlungsEreignis() unten VOR der EREIGNIS_PROTOKOLLNAME-Nutzung
  // abzweigt.
  erstattet: 'refund_confirmed_via_webhook',
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
    .select('id, order_number, order_type, status, total_price, payment_status, payment_reference, payment_provider')
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
    await meldeEreignis({
      schwere: 'ERROR',
      kategorie: 'PAYMENT',
      ereignis: 'zahlbetrag_abgelehnt',
      meldung: pruefung.grund,
      felder: { bestellId: orderId },
    });
    await protokolliereBestellereignis({
      orderId,
      eventType: 'payment_blocked',
      reason: pruefung.grund,
    });
    return { ok: false, meldung: pruefung.meldung, grund: pruefung.grund };
  }

  let anbieter;
  try {
    anbieter = waehleZahlungsAnbieter(anbieterId ?? (bestellung.payment_provider as ZahlungsAnbieterId | undefined));
  } catch (err) {
    // Anders als eroeffne()/verwerfe() unten wirft waehleZahlungsAnbieter()
    // synchron bei fehlender/fehlerhafter Konfiguration (z.B. STRIPE_SECRET_KEY
    // nicht gesetzt) – ohne dieses try/catch propagierte das bis zum äußeren
    // Fehlerpfad in orders.ts, und der Kunde sähe nur die generische Meldung
    // „Da ist etwas schiefgelaufen", ohne dass der eigentliche Grund
    // protokolliert wäre (Review vom 2026-08-20).
    const text = err instanceof Error ? err.message : String(err);
    console.error(`[zahlung] Anbieterauswahl für ${orderId} fehlgeschlagen:`, err);
    await meldeEreignis({
      schwere: 'ERROR',
      kategorie: 'PAYMENT',
      ereignis: 'zahlungsanbieter_auswahl_fehlgeschlagen',
      fehler: err,
      felder: { bestellId: orderId },
    });
    await protokolliereBestellereignis({ orderId, eventType: 'payment_blocked', reason: text });
    return {
      ok: false,
      meldung: 'Die Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es in ein paar Minuten erneut.',
      grund: text,
    };
  }

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
      await meldeEreignis({
        schwere: 'WARNING',
        kategorie: 'PAYMENT',
        ereignis: 'alter_zahlungsvorgang_nicht_verworfen',
        fehler: err,
        felder: { bestellId: orderId },
      });
    }
  }

  // ── Vorgang eröffnen ────────────────────────────────────────────────
  const bestellnummer = (bestellung.order_number as string | null) ?? buildOrderNumber(orderId);
  // Signierter Zugriffstoken statt der rohen Bestell-ID in der Rückkehr-URL
  // (Fund vom 2026-08-26, Produktionsreife-Audit): Die Seite selbst prüft
  // KEINE Autorisierung – wer die rohe ID kennt (Browser-Verlauf, geteilter
  // Rechner, Proxy-Log), hätte sonst Zahlungsstatus und Bestellnummer einer
  // fremden Bestellung sehen können. Derselbe, bereits geprüfte Token wie in
  // der Bestellansicht (orderAccessToken.ts) – kein neues Sicherheitskonzept.
  // Fällt der Token aus (fehlendes ORDER_TOKEN_SECRET), auf die rohe ID
  // zurück: Der Bezahlvorgang darf daran nicht scheitern, dieselbe Haltung
  // wie beim Storno-Link in der Bestellbestätigung (orderIntake.ts).
  const zugriffsteil = erzeugeBestellToken(orderId) ?? orderId;
  let eroeffnung;
  try {
    eroeffnung = await anbieter.eroeffne({
      bestellId: orderId,
      bestellnummer,
      betragCent: pruefung.betragCent,
      waehrung: 'EUR',
      beschreibung: `Bestellung ${bestellnummer}`,
      rueckkehrUrl: `${basisUrl()}/bestellung/zahlung/${zugriffsteil}`,
      abbruchUrl: `${basisUrl()}/bestellung/zahlung/${zugriffsteil}?abgebrochen=1`,
      // Je Versuch eigener Schlüssel: Eine Wiederaufnahme SOLL einen neuen
      // Vorgang erzeugen. Innerhalb eines Versuchs verhindert er, dass ein
      // wiederholter Aufruf einen zweiten anlegt.
      idempotenzSchluessel: `${orderId}-${Date.now().toString(36)}`,
    });
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    console.error(`[zahlung] Vorgang für ${orderId} nicht eröffnet:`, err);
    await meldeEreignis({
      schwere: 'ERROR',
      kategorie: 'PAYMENT',
      ereignis: 'zahlungsvorgang_nicht_eroeffnet',
      fehler: err,
      felder: { bestellId: orderId },
    });
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
    // CRITICAL statt ERROR: beim Anbieter existiert bereits eine offene
    // Zahlungsreferenz, die im System nirgends vermerkt ist ("verwaister"
    // Vorgang) – echte Geldbetroffenheit, nicht nur ein technischer Fehlschlag.
    await meldeEreignis({
      schwere: 'CRITICAL',
      kategorie: 'PAYMENT',
      ereignis: 'zahlungszustand_nicht_gespeichert',
      fehler: updateFehler,
      felder: { bestellId: orderId, referenz: eroeffnung.referenz },
    });
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
  // 'erstattet' ist das reine Webhook-Bestätigungssignal einer
  // Rückerstattung (siehe ZahlungsEreignisArt in lib/payments/types.ts) –
  // eigener Ausgang, damit er nicht mit 'bestaetigt' (Zahlungseingang)
  // verwechselt wird.
  | { ok: true; wirkung: 'bestaetigt' | 'fehlgeschlagen' | 'erstattet'; bereitsVerarbeitet: boolean }
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
    await meldeEreignis({
      schwere: 'ERROR',
      kategorie: 'PAYMENT',
      ereignis: 'zahlungsereignis_bestellung_nicht_ladbar',
      fehler: error,
      felder: { bestellId: ereignis.bestellId, ereignisId: ereignis.ereignisId },
    });
    return { ok: false, wiederholen: true, grund: `DB-Fehler beim Laden: ${error.message}` };
  }
  if (!bestellung) {
    // Keine solche Bestellung – ein erneuter Versuch ergäbe dasselbe. Das
    // ist entweder ein fremdes/fehlgeleitetes Ereignis oder eine falsche
    // Endpunktkonfiguration; beides löst sich nicht durch Wiederholung.
    return { ok: false, wiederholen: false, grund: `Bestellung ${ereignis.bestellId} nicht gefunden.` };
  }

  // ── Rückerstattungs-Bestätigung: eigener, früher Zweig ───────────────
  // Bewusst VOR dem Betragsabgleich unten (der ist 'bestaetigt'-spezifisch)
  // und VOR der bestaetigt/fehlgeschlagen-Weiche am Ende dieser Funktion –
  // dort würde 'erstattet' sonst fälschlich als "fehlgeschlagen" behandelt.
  // Siehe bestaetigeErstattungViaWebhook() in refundService.ts: berührt
  // NIEMALS payment_status (Audit Z7), nur refund_status, und nur bestätigend
  // für eine Bestellung, die WIR bereits zur Erstattung vorgemerkt haben.
  if (ereignis.art === 'erstattet') {
    return bestaetigeErstattungViaWebhook(db, ereignis);
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
      await meldeEreignis({
        schwere: 'CRITICAL',
        kategorie: 'PAYMENT',
        ereignis: 'zahlungsbetrag_abweichung',
        meldung: `gemeldet ${ereignis.betragCent} Cent, erwartet ${erwartetCent} Cent`,
        felder: { bestellId: ereignis.bestellId, ereignisId: ereignis.ereignisId },
      });
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
  // insbesondere keine zweite Bestätigungsmail. Bewusst `IN ('pending',
  // 'failed')` statt nur `= 'pending'` (Fund vom 2026-08-26): Ein erneuter
  // Zahlungsversuch mit einer anderen Karte auf DERSELBEN Stripe-Checkout-
  // Session durchläuft `pending → failed → paid`, ohne dass zwischendurch
  // `starteZahlung()` lief. Mit der alten, engeren Bedingung traf ein
  // späteres, echtes „bestaetigt"-Ereignis nach einem bereits verarbeiteten
  // „fehlgeschlagen" null Zeilen – die Zahlung blieb dann spurlos auf
  // `failed` stehen, obwohl das Geld eingezogen wurde: keine Bestätigung,
  // keine Rechnung, kein Produktionsblatt, kein order_events-Eintrag. Bleibt
  // trotzdem lückenlos idempotent, siehe Kopfkommentar dieser Datei.
  const { data: geaendert, error } = await db
    .from('orders')
    .update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      payment_transaction_id: ereignis.transaktionId ?? null,
    })
    .eq('id', ereignis.bestellId)
    .in('payment_status', ['pending', 'failed'])
    .select('id');

  if (error) {
    // TECHNISCH: Die Zahlung IST beim Anbieter erfolgt – wir konnten sie nur
    // nicht verbuchen. Erneut zustellen lassen, sonst geht sie verloren.
    console.error(`[zahlung] Bestätigung für ${ereignis.bestellId} fehlgeschlagen:`, error);
    await meldeEreignis({
      schwere: 'CRITICAL',
      kategorie: 'PAYMENT',
      ereignis: 'zahlungsbestaetigung_nicht_gespeichert',
      fehler: error,
      felder: { bestellId: ereignis.bestellId, ereignisId: ereignis.ereignisId, referenz: ereignis.referenz },
    });
    return { ok: false, wiederholen: true, grund: error.message };
  }

  if ((geaendert?.length ?? 0) === 0) {
    console.info(`[zahlung] Ereignis ${ereignis.ereignisId} bereits verarbeitet – Bestätigungsmail übersprungen.`);
    // NICHT einfach zurückkehren: `payment_status='paid'` stand hier schon vorher, aber ob Phase 2
    // (stelleAbschlussSicher unten) beim ERSTEN Mal tatsächlich bis zum Ende durchlief, ist damit noch
    // nicht gesagt – ein Absturz zwischen dem UPDATE oben und dem Phase-2-Aufruf hinterließe genau
    // dieses Bild (payment_status bereits 'paid', Phase 2 nie gestartet). stelleAbschlussSicher() ist
    // durch seinen eigenen DB-Claim (beanspruche_abschluss) bereits idempotent – ein Aufruf hier ist bei
    // einer echten, längst abgeschlossenen Zustellung ein günstiger No-op (0 Zeilen betroffen), holt bei
    // der oben beschriebenen Unterbrechung aber genau den fehlenden Abschluss nach. Siehe Review vom
    // 2026-08-18: vorher war dies die einzige Stelle, an der ein bezahlter Auftrag bei Prozessabbruch
    // dauerhaft ohne Rechnung/accounting_ready_at bleiben konnte.
    await stelleAbschlussSicher(db, ereignis.bestellId);
    return { ok: true, wirkung: 'bestaetigt', bereitsVerarbeitet: true };
  }

  await protokolliereBestellereignis({
    orderId: ereignis.bestellId,
    eventType: 'payment_succeeded',
    reason: 'Zahlung bestätigt.',
    detail: { ereignisId: ereignis.ereignisId, referenz: ereignis.referenz, betragCent: ereignis.betragCent },
  });

  // KEINE eigene Zahlungsbestätigungs-Mail mehr (bis 2026-09-01: hier direkt
  // verschickt) – Phase 2 unten sendet die EINE Bestellbestätigung, die den
  // Zahlungseingang bereits im Text nennt (OrderConfirmationEmail.tsx) und,
  // sobald fertig, die Rechnung als PDF mitschickt. Fund vom 2026-09-01
  // (echter PayPal-Live-Test): Zahlungsbestätigung, Bestellbestätigung und
  // Rechnung gingen bis dahin als DREI getrennte E-Mails für ein einziges
  // Ereignis raus.

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
 * Holt Phase 2 für bezahlte Bestellungen nach, für die weder eine erneute
 * Webhook-Zustellung noch der ursprüngliche Aufruf sie je abgeschlossen hat.
 *
 * ── Warum das nötig ist ─────────────────────────────────────────────────
 * `stelleAbschlussSicher()` hat im gesamten Repo genau zwei Aufrufer: den
 * Erfolgsfall UND den Redelivery-Fall in `bestaetigeZahlung()` oben (beide in
 * dieser Datei). Kommt nach einer bestätigten Zahlung nie eine zweite
 * Webhook-Zustellung an (der Zahlungsanbieter gibt nach einigen Versuchen
 * auf) UND stürzt der ursprüngliche Aufruf zwischen dem Setzen von
 * `payment_status='paid'` und dem Abschluss von Phase 2 ab, bliebe die
 * Bestellung ohne diesen Nachholweg für immer ohne Rechnung und ohne
 * `accounting_ready_at` (Abnahme-Review vom 2026-08-18, Punkt 1). Der
 * bestehende Cron-Reaper `gib_haengende_abschluesse_frei` (Migration 0020)
 * gibt einen verwaisten Anspruch zwar frei, ruft aber selbst nichts erneut
 * auf – genau diese Lücke schließt diese Funktion.
 *
 * Die Auswahl-Bedingung entspricht exakt der von `beanspruche_abschluss`
 * (Migration 0020) – der eigentliche Schutz gegen einen doppelten Abschluss
 * bleibt vollständig im dortigen atomaren Claim; läuft der reguläre
 * Zahlungs-Webhook zufällig zeitgleich, gewinnt nur einer der beiden Aufrufe
 * den Claim (siehe `stelleAbschlussSicher`).
 *
 * `not_required`-Bestellungen (Rechnungskauf) sind hier bewusst NICHT
 * enthalten: `beanspruche_abschluss` selbst prüft nur `payment_status='paid'`
 * (Rechnungskauf durchläuft Phase 2 synchron im selben Request, ohne diesen
 * Claim), ein Aufruf hier würde für sie ohnehin nie einen Anspruch bekommen.
 *
 * Von der Cron-Route aufgerufen (siehe process-supplier-orders/route.ts);
 * wirft nie.
 */
export async function holeOffeneAbschluesseNach(
  limit: number
): Promise<{ gefunden: number; abgeschlossen: number; weiterhinOffen: number }> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('orders')
    .select('id')
    .eq('payment_status', 'paid')
    .is('pdf_url', null)
    .is('abschluss_gestartet_am', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[zahlung] Suche nach offenen Abschlüssen fehlgeschlagen:', error.message);
    return { gefunden: 0, abgeschlossen: 0, weiterhinOffen: 0 };
  }

  let abgeschlossen = 0;
  let weiterhinOffen = 0;
  // Bewusst sequenziell statt parallel: Regelfall ist 0 Treffer, und jeder
  // Treffer löst Rendering/PDF-Erzeugung/E-Mail-Versand aus – kein
  // Durchsatz-Pfad, siehe holeOffeneRechnungenNach für dieselbe Begründung.
  for (const zeile of data ?? []) {
    const orderId = zeile.id as string;
    await stelleAbschlussSicher(db, orderId);
    const { data: nachher } = await db.from('orders').select('pdf_url').eq('id', orderId).maybeSingle();
    if (nachher?.pdf_url) {
      abgeschlossen++;
    } else {
      weiterhinOffen++;
      console.warn(`[zahlung] Abschluss-Retry für ${orderId} weiterhin ohne Erfolg.`);
    }
  }

  return { gefunden: (data ?? []).length, abgeschlossen, weiterhinOffen };
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
    await meldeEreignis({
      schwere: 'ERROR',
      kategorie: 'PAYMENT',
      ereignis: 'zahlungsfehlschlag_nicht_gespeichert',
      fehler: error,
      felder: { bestellId: ereignis.bestellId, ereignisId: ereignis.ereignisId, art: ereignis.art },
    });
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
    const orderNumber = bestellinfo.orderNumber ?? buildOrderNumber(ereignis.bestellId);
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
