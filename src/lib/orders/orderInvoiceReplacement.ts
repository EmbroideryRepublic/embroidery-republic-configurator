/**
 * ═══════════════════════════════════════════════════════════════════════
 * ERSATZRECHNUNG NACH EINER AUFTRAGSÄNDERUNG
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Ändert der Betreiber eine Bestellung, zu der es schon eine Rechnung gibt
 * (orderEditService.ts), entsteht automatisch eine NEUE Rechnung mit den
 * geänderten Positionen und Beträgen. Sie trägt den Hinweis „Diese Rechnung
 * ersetzt die Rechnung Nr. … vom …“; die bisherige bleibt als PDF erhalten und
 * steht mit Nummer, Datum und Nachfolgerin in `order_invoice_history`
 * (Migration 0039).
 *
 * ── Die Schritte (jeder einzeln wiederholbar) ─────────────────────────────
 *   1. reservieren   Datenbankfunktion: Anspruch + Nachfolgenummer, atomar. Pro
 *                    (Bestellung, abgelöste Rechnung) genau EINE Nummer – eine
 *                    Wiederholung bekommt dieselbe zurück.
 *   2. rendern       PDF mit dem internen Anbieter (react-pdf), über denselben
 *                    Auftragsaufbau wie jede erste Rechnung (rechnungsauftrag.ts:
 *                    Kleinunternehmer-/Steuerweg, Versandrest, Zahlungsziel).
 *   3. ablegen       Eigener Speicherpfad je Rechnung – das PDF der alten
 *                    Rechnung wird nie überschrieben.
 *   4. tauschen      Datenbankfunktion: `orders` auf die neue Rechnung, Historie
 *                    abschließen, Ereignis `invoice_replaced` – atomar.
 *
 * Scheitert ein Schritt, bleibt die Auftragsänderung gespeichert; der Anspruch
 * wird freigegeben, ein Ereignis `invoice_replacement_failed` schreibt den Grund
 * in die Historie, und der Admin zeigt „neue Rechnung fehlt“ mit einer
 * Schaltfläche. Ein erneuter Versuch beginnt bei Schritt 1 und kann nie eine
 * zweite Nummer verbrauchen.
 *
 * ── Was hier bewusst NICHT geschieht ──────────────────────────────────────
 *  • `accounting_ready_at` bleibt unberührt (die Buchhaltungs-App übernimmt eine
 *    Bestellung nur einmal; ein erneutes Ausliefern wäre dort wirkungslos).
 *  • Keine Zahlung, keine Erstattung.
 *  • Nur der interne Rechnungsanbieter: Lexware vergibt eigene Nummern; die
 *    reservierte Nummer ließe sich dort nicht erzwingen.
 *
 * Alle Außenwelt-Zugriffe laufen über `ErsatzRechnungsAbhaengigkeiten`, damit der
 * Ablauf ohne Datenbank, Speicher und Mail prüfbar ist.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { uploadProductionFile } from '@/lib/supabase/storage';
import { waehleRechnungsAnbieter, istRechnungserstellungMoeglich } from '@/lib/invoicing/registry';
import type { Rechnungsauftrag, Rechnungserstellung } from '@/lib/invoicing/types';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { sendInvoiceReplacementEmail, type EmailVersandErgebnis } from '@/lib/email/orderEmails';
import { formatiereDatum } from '@/lib/format';
import { ladeBestellungFuerAbschluss } from './orderCompletion';
import { protokolliereBestellereignis, protokolliereVersand } from './orderService';
import { baueRechnungsauftrag } from './rechnungsauftrag';
import { ermittleAusstehendeErsetzung, type AusstehendeErsetzung } from './orderEdit';

// ═══════════════════════════════════════════════════════════════════════
// Außenwelt – austauschbar für Tests
// ═══════════════════════════════════════════════════════════════════════

export type ReservierungsAntwort =
  | {
      status: 'reserviert';
      neueNummer: string;
      /** ISO-Datum (yyyy-mm-dd) – steht ab der Reservierung fest. */
      neuesDatum: string;
      alteNummer: string;
      altesDatum: string | null;
      alterPfad: string | null;
    }
  | { status: 'bereits-ersetzt' }
  | { status: 'laeuft' }
  | { status: 'abgelehnt'; code: string };

export interface ErsatzRechnungsAbhaengigkeiten {
  /** Kann der aktive Rechnungsanbieter Ersatzrechnungen erzeugen? (Nur der interne.) */
  anbieterErsatzFaehig(): boolean;
  ladeBestellung(orderId: string): Promise<OrderRecord | null>;
  reserviere(orderId: string, alteNummer: string, jahr: number, datum: string): Promise<ReservierungsAntwort>;
  erstelle(auftrag: Rechnungsauftrag): Promise<Rechnungserstellung>;
  legePdfAb(pfad: string, pdf: Buffer): Promise<void>;
  tausche(orderId: string, alteNummer: string, neueId: string, neueNummer: string, pfad: string): Promise<'ersetzt' | 'bereits-ersetzt'>;
  gibFrei(orderId: string, alteNummer: string): Promise<void>;
  protokolliere(eintrag: { orderId: string; eventType: string; reason: string; detail: Record<string, unknown> }): Promise<void>;
  jetzt(): Date;
  // Nur für die Wiederholung über die Schaltfläche:
  findeAusstehend(orderId: string): Promise<AusstehendeErsetzung | null>;
  sendeRechnungsmail(params: {
    orderId: string;
    empfaenger: string;
    bestellnummer: string;
    neueNummer: string;
    neuesDatum: string;
    alteNummer: string;
    altesDatum: string | null;
    pdf: Buffer;
  }): Promise<EmailVersandErgebnis>;
  protokolliereMail(orderId: string, ergebnis: PromiseSettledResult<EmailVersandErgebnis>): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// Ergebnis
// ═══════════════════════════════════════════════════════════════════════

export type ErsatzRechnungsErgebnis =
  | {
      ok: true;
      status: 'ersetzt';
      neueNummer: string;
      neuesDatum: string;
      alteNummer: string;
      altesDatum: string | null;
      bestellnummer: string;
      empfaenger: string | null;
      /** Das fertige PDF – für den Anhang der Kundenmail. */
      pdf: Buffer;
    }
  | { ok: true; status: 'bereits-ersetzt' }
  | {
      ok: false;
      grund: 'nicht-gefunden' | 'nicht-ersetzbar' | 'anbieter' | 'laeuft' | 'fehler';
      meldung: string;
    };

/** Eigener Pfad je Rechnung. Das PDF der ersten Rechnung liegt unter `orders/{id}/rechnung.pdf` und bleibt unberührt. */
export function ersatzRechnungPfad(orderId: string, rechnungsnummer: string): string {
  return `orders/${orderId}/rechnung-${rechnungsnummer}.pdf`;
}

const FEHLER_TEXTE: Record<string, string> = {
  'nicht-gefunden': 'Die Bestellung wurde nicht gefunden.',
  'nicht-ersetzbar': 'Die Rechnung dieser Bestellung lässt sich nicht ersetzen (storniert, nicht bezahlt/Zahlung offen oder keine Bestellung).',
  'unklarer-zustand':
    'Die Rechnung dieser Bestellung ist als manueller Klärungsfall markiert (rechnung_unklarer_zustand) – bitte zuerst von Hand klären.',
};

// ═══════════════════════════════════════════════════════════════════════
// Ersetzen
// ═══════════════════════════════════════════════════════════════════════

/**
 * Erzeugt die Ersatzrechnung für `alteNummer` – oder meldet, dass das schon
 * geschehen ist. Wirft nicht; jeder Fehlerfall ist ein Ergebnis mit Grund.
 *
 * Idempotent: Ein zweiter Aufruf für dieselbe abgelöste Rechnung (Doppelklick,
 * Wiederholung nach einem Absturz) verbraucht keine weitere Nummer und erzeugt
 * keine zweite Rechnung.
 */
export async function ersetzeRechnung(
  orderId: string,
  alteNummer: string,
  deps: ErsatzRechnungsAbhaengigkeiten = standardAbhaengigkeiten()
): Promise<ErsatzRechnungsErgebnis> {
  let reserviert: Extract<ReservierungsAntwort, { status: 'reserviert' }> | null = null;
  try {
    if (!deps.anbieterErsatzFaehig()) {
      return {
        ok: false,
        grund: 'anbieter',
        meldung: 'Der aktive Rechnungsanbieter kann keine Ersatzrechnung erzeugen (nur der interne Anbieter kann es).',
      };
    }

    const order = await deps.ladeBestellung(orderId);
    if (!order) return { ok: false, grund: 'nicht-gefunden', meldung: FEHLER_TEXTE['nicht-gefunden']! };

    const jetzt = deps.jetzt();
    const antwort = await deps.reserviere(orderId, alteNummer, jetzt.getFullYear(), jetzt.toISOString().slice(0, 10));
    if (antwort.status === 'bereits-ersetzt') return { ok: true, status: 'bereits-ersetzt' };
    if (antwort.status === 'laeuft') {
      return {
        ok: false,
        grund: 'laeuft',
        meldung: 'Die Ersatzrechnung wird gerade erzeugt. Bitte in ein bis zwei Minuten die Seite neu laden.',
      };
    }
    if (antwort.status === 'abgelehnt') {
      return {
        ok: false,
        grund: antwort.code === 'nicht-gefunden' ? 'nicht-gefunden' : 'nicht-ersetzbar',
        meldung: FEHLER_TEXTE[antwort.code] ?? `Die Datenbank hat den Ersatz abgelehnt (${antwort.code}).`,
      };
    }
    reserviert = antwort;

    // Ab hier ist die Nummer vergeben. Alles Folgende ist wiederholbar – mit DERSELBEN Nummer.
    const auftrag = baueRechnungsauftrag(order, {
      rechnungsdatum: antwort.neuesDatum,
      // Die Nummer steht fest. Der interne Anbieter ruft das genau einmal auf und zieht NICHT neu.
      naechsteRechnungsnummer: async () => antwort.neueNummer,
      ersetzt: { rechnungsnummer: antwort.alteNummer, rechnungsdatum: antwort.altesDatum },
    });
    const rechnung = await deps.erstelle(auftrag);
    if (rechnung.rechnungsnummer !== antwort.neueNummer) {
      throw new Error(
        `Der Rechnungsanbieter lieferte die Nummer ${rechnung.rechnungsnummer} statt der reservierten ${antwort.neueNummer}.`
      );
    }
    if (!rechnung.pdf || rechnung.pdf.length === 0) {
      throw new Error('Der Rechnungsanbieter lieferte ein leeres PDF.');
    }

    const pfad = ersatzRechnungPfad(order.id, antwort.neueNummer);
    if (pfad === antwort.alterPfad) {
      throw new Error('Der Speicherpfad der neuen Rechnung entspricht dem der alten – sie würde überschrieben.');
    }
    await deps.legePdfAb(pfad, rechnung.pdf);

    const tausch = await deps.tausche(orderId, antwort.alteNummer, rechnung.rechnungsId, antwort.neueNummer, pfad);
    if (tausch === 'bereits-ersetzt') return { ok: true, status: 'bereits-ersetzt' };

    return {
      ok: true,
      status: 'ersetzt',
      neueNummer: antwort.neueNummer,
      neuesDatum: antwort.neuesDatum,
      alteNummer: antwort.alteNummer,
      altesDatum: antwort.altesDatum,
      bestellnummer: order.orderNumber,
      empfaenger: order.contact.email?.trim() || null,
      pdf: rechnung.pdf,
    };
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    console.error(`[rechnungsersatz] ${orderId}: Ersatz für ${alteNummer} fehlgeschlagen:`, err);
    if (reserviert) {
      // Die Nummer bleibt reserviert; nur der Anspruch wird freigegeben, damit der nächste Versuch sofort laufen kann.
      await deps.gibFrei(orderId, alteNummer).catch(() => {});
    }
    await deps
      .protokolliere({
        orderId,
        eventType: 'invoice_replacement_failed',
        reason: `Die Ersatzrechnung für Rechnung ${alteNummer} konnte nicht erzeugt werden: ${text}`,
        detail: { alteNummer, reservierteNummer: reserviert?.neueNummer ?? null },
      })
      .catch(() => {});
    return { ok: false, grund: 'fehler', meldung: `Die neue Rechnung konnte nicht erzeugt werden: ${text}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Wiederholung über die Schaltfläche im Admin
// ═══════════════════════════════════════════════════════════════════════

export type ErsatzNachholErgebnis =
  | {
      ok: true;
      meldung: string;
      neueNummer: string | null;
      alteNummer: string | null;
      kundenmail: 'gesendet' | 'fehlgeschlagen' | 'abgewaehlt' | 'keine-adresse' | 'nicht-noetig';
    }
  | { ok: false; meldung: string };

/**
 * „Neue Rechnung erneut erzeugen“: Stellt fest, welche Rechnung noch zu ersetzen
 * ist (aus der Historie, nicht aus einer Angabe des Browsers), erzeugt die
 * Ersatzrechnung und schickt sie – wenn gewünscht – der Kundschaft nach (die
 * Mail zur Auftragsänderung ging ohne sie raus).
 */
export async function erzeugeErsatzrechnungNach(
  orderId: string,
  mailSenden: boolean,
  deps: ErsatzRechnungsAbhaengigkeiten = standardAbhaengigkeiten()
): Promise<ErsatzNachholErgebnis> {
  let ausstehend: AusstehendeErsetzung | null;
  try {
    ausstehend = await deps.findeAusstehend(orderId);
  } catch (err) {
    console.error(`[rechnungsersatz] ${orderId}: Stand nicht ladbar:`, err);
    return { ok: false, meldung: 'Der Stand der Rechnung konnte nicht geladen werden.' };
  }
  if (!ausstehend) {
    return { ok: false, meldung: 'Für diese Bestellung steht keine Ersatzrechnung aus.' };
  }

  const ergebnis = await ersetzeRechnung(orderId, ausstehend.alteNummer, deps);
  if (!ergebnis.ok) return { ok: false, meldung: ergebnis.meldung };
  if (ergebnis.status === 'bereits-ersetzt') {
    return { ok: true, meldung: 'Die Ersatzrechnung war bereits erzeugt.', neueNummer: null, alteNummer: ausstehend.alteNummer, kundenmail: 'nicht-noetig' };
  }

  let kundenmail: 'gesendet' | 'fehlgeschlagen' | 'abgewaehlt' | 'keine-adresse' = 'abgewaehlt';
  if (mailSenden) {
    if (!ergebnis.empfaenger) {
      kundenmail = 'keine-adresse';
    } else {
      let versand: PromiseSettledResult<EmailVersandErgebnis>;
      try {
        versand = {
          status: 'fulfilled',
          value: await deps.sendeRechnungsmail({
            orderId,
            empfaenger: ergebnis.empfaenger,
            bestellnummer: ergebnis.bestellnummer,
            neueNummer: ergebnis.neueNummer,
            neuesDatum: ergebnis.neuesDatum,
            alteNummer: ergebnis.alteNummer,
            altesDatum: ergebnis.altesDatum,
            pdf: ergebnis.pdf,
          }),
        };
      } catch (err) {
        versand = { status: 'rejected', reason: err };
      }
      await deps.protokolliereMail(orderId, versand).catch(() => {});
      kundenmail = versand.status === 'fulfilled' && versand.value.success ? 'gesendet' : 'fehlgeschlagen';
    }
  }

  const mailText: Record<typeof kundenmail, string> = {
    gesendet: 'Die Kundschaft hat die neue Rechnung per Mail bekommen.',
    fehlgeschlagen: 'Die Mail an die Kundschaft ist NICHT rausgegangen – bitte die Rechnung herunterladen und selbst senden.',
    abgewaehlt: 'Es wurde keine Mail versendet – die Rechnung steht zum Download bereit.',
    'keine-adresse': 'Es wurde keine Mail versendet (keine Adresse hinterlegt) – die Rechnung steht zum Download bereit.',
  };
  return {
    ok: true,
    meldung: `Neue Rechnung ${ergebnis.neueNummer} ersetzt Rechnung ${ergebnis.alteNummer}. ${mailText[kundenmail]}`,
    neueNummer: ergebnis.neueNummer,
    alteNummer: ergebnis.alteNummer,
    kundenmail,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Echte Außenwelt
// ═══════════════════════════════════════════════════════════════════════

/** Kann das System Ersatzrechnungen erzeugen? Nur der interne Anbieter (siehe Kopfkommentar). */
export function ersatzrechnungMoeglich(): boolean {
  return istRechnungserstellungMoeglich() && waehleRechnungsAnbieter().id === 'intern';
}

export function standardAbhaengigkeiten(): ErsatzRechnungsAbhaengigkeiten {
  return {
    anbieterErsatzFaehig: ersatzrechnungMoeglich,
    ladeBestellung: ladeBestellungFuerAbschluss,

    async reserviere(orderId, alteNummer, jahr, datum) {
      const db = createAdminClient();
      const { data, error } = await db.rpc('reserviere_ersatzrechnung', {
        p_order_id: orderId,
        p_alte_nummer: alteNummer,
        p_jahr: jahr,
        p_datum: datum,
      });
      if (error) {
        const code = /rechnungsersatz_abgelehnt:([a-z-]+)/.exec(error.message)?.[1];
        if (code) return { status: 'abgelehnt', code };
        throw new Error(`reserviere_ersatzrechnung: ${error.message}`);
      }
      const antwort = data as Record<string, unknown> | null;
      if (antwort?.status === 'reserviert') {
        return {
          status: 'reserviert',
          neueNummer: String(antwort.neue_nummer),
          neuesDatum: String(antwort.neues_datum),
          alteNummer: String(antwort.alte_nummer),
          altesDatum: antwort.altes_datum ? String(antwort.altes_datum) : null,
          alterPfad: antwort.alter_pfad ? String(antwort.alter_pfad) : null,
        };
      }
      if (antwort?.status === 'bereits-ersetzt' || antwort?.status === 'laeuft') return { status: antwort.status };
      throw new Error(`reserviere_ersatzrechnung: unerwartete Antwort ${JSON.stringify(antwort)}`);
    },

    erstelle: (auftrag) => waehleRechnungsAnbieter().erstelle(auftrag),

    async legePdfAb(pfad, pdf) {
      await uploadProductionFile(pfad, pdf, 'application/pdf');
    },

    async tausche(orderId, alteNummer, neueId, neueNummer, pfad) {
      const db = createAdminClient();
      const { data, error } = await db.rpc('ersetze_rechnung', {
        p_order_id: orderId,
        p_alte_nummer: alteNummer,
        p_neue_id: neueId,
        p_neue_nummer: neueNummer,
        p_neuer_pfad: pfad,
      });
      if (error) throw new Error(`ersetze_rechnung: ${error.message}`);
      return (data as { status?: string } | null)?.status === 'bereits-ersetzt' ? 'bereits-ersetzt' : 'ersetzt';
    },

    async gibFrei(orderId, alteNummer) {
      const db = createAdminClient();
      await db.rpc('gib_ersatzrechnung_frei', { p_order_id: orderId, p_alte_nummer: alteNummer });
    },

    protokolliere: (eintrag) => protokolliereBestellereignis(eintrag),
    jetzt: () => new Date(),

    async findeAusstehend(orderId) {
      const db = createAdminClient();
      const [{ data: order, error: orderFehler }, { data: ereignisse, error: ereignisFehler }] = await Promise.all([
        db.from('orders').select('invoice_number').eq('id', orderId).maybeSingle(),
        db
          .from('order_events')
          .select('event_type, at, detail')
          .eq('order_id', orderId)
          .eq('event_type', 'order_items_edited')
          .order('at', { ascending: false })
          .limit(5),
      ]);
      if (orderFehler) throw new Error(`orders: ${orderFehler.message}`);
      if (ereignisFehler) throw new Error(`order_events: ${ereignisFehler.message}`);
      return ermittleAusstehendeErsetzung(
        (ereignisse ?? []).map((e) => ({
          eventType: e.event_type as string,
          at: e.at as string,
          detail: (e.detail as Record<string, unknown> | null) ?? null,
        })),
        (order?.invoice_number as string | null) ?? null
      );
    },

    sendeRechnungsmail: (p) =>
      sendInvoiceReplacementEmail({
        orderId: p.orderId,
        empfaenger: p.empfaenger,
        bestellnummer: p.bestellnummer,
        neueNummer: p.neueNummer,
        neuesDatum: formatiereDatum(p.neuesDatum),
        alteNummer: p.alteNummer,
        altesDatum: p.altesDatum ? formatiereDatum(p.altesDatum) : null,
        pdf: p.pdf,
      }),
    protokolliereMail: (orderId, ergebnis) => protokolliereVersand(orderId, 'invoice_replaced', ergebnis),
  };
}
