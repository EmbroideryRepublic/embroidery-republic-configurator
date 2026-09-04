/**
 * ═══════════════════════════════════════════════════════════════════════
 * VERSANDLABEL EINER BESTELLUNG – unsere Geschäftslogik
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach demselben Muster wie `orderCompletion.ts`s `erzeugeRechnung()` und
 * `paymentService.ts`s `stelleAbschlussSicher()`: der Versandanbieter liefert
 * nur eine Sendungsnummer und ein Label, ENTSCHIEDEN wird hier.
 *
 * ── Idempotenz ────────────────────────────────────────────────────────
 * DHL bietet KEINEN Idempotenzschlüssel für die Label-Erstellung (anders als
 * Stripe/PayPal beim Zahlungsstart) – der Schutz gegen ein doppelt erstelltes
 * Label liegt deshalb VOLLSTÄNDIG in der atomaren Datenbank-Claim
 * (`beanspruche_versandlabel`, Migration 0026): Setzt sie den Claim nicht
 * (0 Zeilen), hat entweder bereits ein Label existiert oder ein anderer Lauf
 * ist gerade dran – in beiden Fällen wird `waehleVersandAnbieter().
 * erstelleSendung()` NICHT aufgerufen.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { uploadProductionFile } from '@/lib/supabase/storage';
import { waehleVersandAnbieter } from '@/lib/shipping/registry';
import { VersandTeilerfolgFehler, type Versandauftrag, type Versanderstellung } from '@/lib/shipping/types';
import { protokolliereBestellereignis, persistiereKritischMitWiederholung } from './orderService';
import { buildOrderNumber } from '@/lib/actions/orderTypes';

export type VersandlabelErgebnis =
  | { ok: true; sendungsnummer: string }
  | { ok: false; grund: 'nicht-gefunden' | 'nicht-moeglich' | 'fehler' | 'teilerfolg'; meldung: string };

/**
 * Erstellt ein DHL-Versandlabel für eine Bestellung und speichert
 * Sendungsnummer + Label-Pfad daran.
 *
 * Voraussetzungen (siehe beanspruche_versandlabel): nicht storniert, Zahlung
 * abgeschlossen oder nicht nötig, Lieferadresse vorhanden, noch kein Label.
 * Admin-ausgelöst über `shippingActions.ts`.
 */
export async function erzeugeVersandlabelFuerBestellung(
  orderId: string,
  gewichtKg: number
): Promise<VersandlabelErgebnis> {
  const db = createAdminClient();

  const { data: bestellung, error: ladeFehler } = await db
    .from('orders')
    .select('id, order_number, customer_name, shipping_street, shipping_zip, shipping_city, shipping_country, tracking_number')
    .eq('id', orderId)
    .maybeSingle();
  if (ladeFehler || !bestellung) {
    return { ok: false, grund: 'nicht-gefunden', meldung: 'Diese Bestellung wurde nicht gefunden.' };
  }

  const { data: anspruch, error: claimFehler } = await db.rpc('beanspruche_versandlabel', { p_order_id: orderId });
  if (claimFehler) {
    console.error(`[versand] Label-Anspruch für ${orderId} fehlgeschlagen:`, claimFehler.message);
    return { ok: false, grund: 'fehler', meldung: 'Das Label konnte nicht erstellt werden. Bitte erneut versuchen.' };
  }
  const beansprucht = Array.isArray(anspruch) ? anspruch.length > 0 : Boolean(anspruch);
  if (!beansprucht) {
    if (bestellung.tracking_number) {
      return { ok: false, grund: 'nicht-moeglich', meldung: `Für diese Bestellung existiert bereits ein Label (${bestellung.tracking_number}).` };
    }
    return { ok: false, grund: 'nicht-moeglich', meldung: 'Zahlung/Lieferadresse noch nicht vollständig, oder gerade ein anderer Versuch aktiv.' };
  }

  // Außerhalb des try-Blocks deklariert: Schlägt irgendetwas NACH einer
  // erfolgreichen DHL-Sendungserstellung fehl, muss der catch-Block das
  // Ergebnis noch sehen können – sonst geht die einzige Kennung einer
  // bereits real, irreversibel angelegten Sendung verloren und ein Retry
  // würde bei DHL eine zweite erstellen (siehe Review vom 2026-08-11,
  // Orphan-Label – identisches Muster zur Lexware-Rechnung).
  let sendung: Versanderstellung | undefined;

  try {
    if (!bestellung.shipping_street) {
      throw new Error('Bestellung ohne Lieferadresse.');
    }
    const auftrag: Versandauftrag = {
      bestellId: orderId,
      bestellnummer: (bestellung.order_number as string | null) ?? buildOrderNumber(orderId),
      empfaenger: {
        name: bestellung.customer_name as string,
        strasse: bestellung.shipping_street as string,
        plz: bestellung.shipping_zip as string,
        ort: bestellung.shipping_city as string,
        land: bestellung.shipping_country as string,
      },
      gewichtKg,
    };

    sendung = await waehleVersandAnbieter().erstelleSendung(auftrag);

    // ── KRITISCHER Punkt: DHL hat SOEBEN eine echte, abrechnungswirksame
    // Sendung angelegt. Ab hier darf erstelleSendung() für diese Bestellung
    // unter keinen Umständen mehr aufgerufen werden. tracking_number wird
    // deshalb SOFORT und mit eigenen Wiederholungsversuchen persistiert,
    // BEVOR der fehleranfälligere Label-Upload läuft – Migration 0026s
    // Freigabe-Funktionen prüfen bereits tracking_number.
    const kritischGespeichert = await persistiereKritischMitWiederholung(db, orderId, {
      tracking_number: sendung.sendungsnummer,
      carrier: 'dhl',
    });
    if (!kritischGespeichert) {
      throw new Error(
        `Kritische Kennung (Sendungsnummer ${sendung.sendungsnummer}) konnte nach mehreren Versuchen nicht gespeichert werden.`
      );
    }

    const pfad = `orders/${orderId}/versandlabel.pdf`;
    await Promise.all([
      uploadProductionFile(pfad, sendung.label, 'application/pdf'),
      db.from('orders').update({ dhl_label_url: pfad }).eq('id', orderId),
    ]);

    await protokolliereBestellereignis({
      orderId,
      eventType: 'shipping_label_created',
      detail: { sendungsnummer: sendung.sendungsnummer, gewichtKg },
    });

    return { ok: true, sendungsnummer: sendung.sendungsnummer };
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    console.error(`[versand] Label-Erstellung für ${orderId} fehlgeschlagen:`, err);

    // DHL HAT bereits eine echte Sendung angelegt, wenn entweder das volle
    // Ergebnis vorliegt (sendung gesetzt, Fehler danach) ODER
    // erstelleSendung() selbst NACH der Anlage einen VersandTeilerfolgFehler
    // mit der bekannten Sendungsnummer warf (Label fehlte in der Antwort).
    // In BEIDEN Fällen darf der Anspruch NICHT freigegeben werden.
    //
    // WICHTIG (Review vom 2026-08-12, zweite Runde): Es reicht NICHT, hier
    // einfach nichts zu tun. Gelingt auch der Versuch, tracking_number zu
    // speichern, nicht (persistiereKritischMitWiederholung scheitert
    // vollständig), bleibt tracking_number NULL – und das sieht für den
    // Cron-Reaper (gib_haengende_versandlabel_frei) exakt gleich aus wie
    // "DHL nie erreicht". Anders als bei Lexware gibt es bei DHL KEINE
    // zweite Kennung, die als Rückfallebene dienen könnte – tracking_number
    // ist das einzige Feld. Ohne weitere Maßnahme WÜRDE der Reaper diesen
    // Claim nach Ablauf der Frist freigeben und eine zweite, echte,
    // abrechnungswirksame DHL-Sendung ermöglichen – das war der konkret
    // bestätigte Duplikat-Erzeugungspfad. Deshalb: schlägt die
    // tracking_number-Persistierung fehl, wird als LETZTE Rettungsleine
    // `label_unklarer_zustand = true` gesetzt (eigener, unabhängiger
    // Schreibversuch mit minimaler Nutzlast). Dieses Flag sperrt Claim UND
    // Freigabe UND Reaper dauerhaft und wird NIE vom Code zurückgesetzt –
    // nur eine manuelle Prüfung bei DHL kann diesen Zustand auflösen.
    const teilerfolg = err instanceof VersandTeilerfolgFehler ? err : null;
    if (sendung || teilerfolg) {
      const sendungsnummer = sendung?.sendungsnummer ?? teilerfolg!.sendungsnummer;
      const kritischGespeichert = await persistiereKritischMitWiederholung(db, orderId, {
        tracking_number: sendungsnummer,
        carrier: 'dhl',
      });
      // tracking_number ist bereits der stärkste Schutz (Claim/Reaper prüfen
      // es direkt) – das Flag wird nur versucht, wenn selbst DAS gescheitert
      // ist. `null` statt `false`, damit das Protokoll unten nicht
      // fälschlich "Flag gesetzt" suggeriert, wenn es schlicht nicht nötig war.
      const alsUnklarMarkiert = kritischGespeichert
        ? null
        : await persistiereKritischMitWiederholung(db, orderId, { label_unklarer_zustand: true });
      await protokolliereBestellereignis({
        orderId,
        eventType: 'shipping_label_partial_failure',
        reason:
          `DHL-Sendung ${sendungsnummer} wurde angelegt, ein nachgelagerter Schritt ist aber fehlgeschlagen: ${text}. ` +
          (kritischGespeichert
            ? 'Die Sendungsnummer wurde gespeichert, der Anspruch bleibt bewusst gehalten – Label-Upload ' +
              'manuell nachholen, NICHT automatisch erneut versuchen.'
            : alsUnklarMarkiert
              ? 'Die Sendungsnummer konnte NICHT gespeichert werden, aber der Klärungsfall-Marker ' +
                '(label_unklarer_zustand) wurde gesetzt – der Anspruch bleibt dauerhaft gehalten, auch über den ' +
                'Cron-Reaper hinaus. Manuell bei DHL anhand der Bestellnummer suchen und den Datensatz von Hand ' +
                'vervollständigen.'
              : 'KRITISCH: WEDER die Sendungsnummer NOCH der Klärungsfall-Marker konnten gespeichert werden ' +
                '(anhaltende Datenbankstörung). Der Anspruch bleibt in dieser Anfrage zwar gehalten, könnte aber ' +
                'vom Cron-Reaper nach Ablauf der Frist fälschlich freigegeben werden. Dringend SOFORT manuell ' +
                'prüfen: bei DHL anhand der Bestellnummer suchen und label_unklarer_zustand von Hand in der ' +
                'Datenbank setzen.'),
        detail: { sendungsnummer, kritischGespeichert, alsUnklarMarkiert },
      });
      return {
        ok: false,
        grund: 'teilerfolg',
        meldung: `Bei DHL wurde bereits eine Sendung angelegt (Nr. ${sendungsnummer}). NICHT erneut versuchen – die Bestellung wurde zur manuellen Prüfung markiert.`,
      };
    }

    // Kein Ergebnis und kein Teilerfolg bekannt: DHL wurde entweder nie
    // erreicht oder hat geworfen, BEVOR irgendeine Sendung entstand – dann
    // ist nichts Externes entstanden, und die Freigabe ist sicher.
    await db.rpc('gib_versandlabel_frei', { p_order_id: orderId });
    await protokolliereBestellereignis({ orderId, eventType: 'shipping_label_failed', reason: text });
    return { ok: false, grund: 'fehler', meldung: 'Das Label konnte nicht erstellt werden. Bitte erneut versuchen.' };
  }
}
