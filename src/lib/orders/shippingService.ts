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
import type { Versandauftrag } from '@/lib/shipping/types';
import { protokolliereBestellereignis } from './orderService';
import { buildOrderNumber } from '@/lib/actions/orderTypes';

export type VersandlabelErgebnis =
  | { ok: true; sendungsnummer: string }
  | { ok: false; grund: 'nicht-gefunden' | 'nicht-moeglich' | 'fehler'; meldung: string };

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
    .select('id, customer_name, shipping_street, shipping_zip, shipping_city, shipping_country, tracking_number')
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

  try {
    if (!bestellung.shipping_street) {
      throw new Error('Bestellung ohne Lieferadresse.');
    }
    const auftrag: Versandauftrag = {
      bestellId: orderId,
      bestellnummer: buildOrderNumber(orderId),
      empfaenger: {
        name: bestellung.customer_name as string,
        strasse: bestellung.shipping_street as string,
        plz: bestellung.shipping_zip as string,
        ort: bestellung.shipping_city as string,
        land: bestellung.shipping_country as string,
      },
      gewichtKg,
    };

    const sendung = await waehleVersandAnbieter().erstelleSendung(auftrag);
    const pfad = `orders/${orderId}/versandlabel.pdf`;
    await Promise.all([
      uploadProductionFile(pfad, sendung.label, 'application/pdf'),
      db
        .from('orders')
        .update({ tracking_number: sendung.sendungsnummer, carrier: 'dhl', dhl_label_url: pfad })
        .eq('id', orderId),
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
    await db.rpc('gib_versandlabel_frei', { p_order_id: orderId });
    await protokolliereBestellereignis({ orderId, eventType: 'shipping_label_failed', reason: text });
    return { ok: false, grund: 'fehler', meldung: 'Das Label konnte nicht erstellt werden. Bitte erneut versuchen.' };
  }
}
