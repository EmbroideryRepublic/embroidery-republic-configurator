/**
 * ═══════════════════════════════════════════════════════════════════════
 * AUFTRAG NACHTRÄGLICH ÄNDERN – Ablauf (Datenbank, Historie, Kundenmail)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Die Fachregeln und die Preisberechnung stehen in `orderEdit.ts` (rein). Diese
 * Datei verbindet sie mit der Außenwelt – in genau dieser Reihenfolge:
 *
 *   1. laden            Stand aus der Datenbank (Bestellung, Positionen, Motive, Lieferantenstatus)
 *   2. berechnen        `berechneAenderung` – lehnt ab, bevor irgendetwas gespeichert ist
 *   3. gegenprüfen      Entspricht das Ergebnis dem, was der Betreiber in der Vorschau gesehen hat?
 *                       Sind alle nötigen Bestätigungen gesetzt?
 *   4. speichern        EINE Datenbanktransaktion (`aendere_bestellpositionen`, Migration 0038):
 *                       Positionen + Bestellsumme + Historien-Eintrag gemeinsam oder gar nicht
 *   5. danach, nicht-fatal:  Kundenmail · Lieferantenaufträge angleichen
 *
 * Dasselbe Muster wie der Bestelleingang (docs/bestellprozess-konsistenz.md):
 * Was nach außen wirkt und sich nicht zurücknehmen lässt (die E-Mail), geschieht
 * ERST, wenn die Datenbank die Änderung sicher gespeichert hat – nie davor und
 * nie innerhalb der Transaktion. Scheitert Schritt 4, geht keine Mail raus.
 *
 * ── Was hier bewusst NICHT geschieht ──────────────────────────────────────
 *  • keine Erstattung (refundService.ts kennt nur die volle Erstattung bei
 *    Stornierung; eine Teilerstattung macht der Betreiber selbst),
 *  • keine Rechnungskorrektur (der Rechnungsanbieter-Port kennt nur `erstelle`),
 *  • kein Eingriff in `accounting_ready_at` (siehe Bericht: die lokale
 *    Buchhaltung übernimmt eine Rechnung nur EINMAL),
 *  • kein Löschen von Dateien im Speicher.
 *
 * Alle Außenwelt-Zugriffe laufen über `AenderungsAbhaengigkeiten`, damit der
 * Ablauf in Tests mit Attrappen geprüft werden kann (nichts Echtes wird
 * gespeichert oder versendet) – siehe __tests__/orderEditService.test.ts.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import {
  betreffAuftragGeaendert,
  renderAuftragGeaendertText,
  sendOrderEditedEmail,
  type EmailVersandErgebnis,
} from '@/lib/email/orderEmails';
import { createSupplierOrder } from '@/lib/suppliers/createSupplierOrder';
import { buildSupplierPositions } from '@/lib/suppliers/buildSupplierPositions';
import { transition } from '@/lib/suppliers/lifecycle/store';
import type { SupplierOrderStatus } from '@/lib/suppliers/lifecycle/status';
import { erzeugeBestellToken } from '@/lib/orders/orderAccessToken';
import { basisUrl } from '@/lib/seo/basisUrl';
import { formatiereGeld } from '@/lib/format';
import { protokolliereVersand } from './orderService';
import {
  baueEreignisDetail,
  baueEreignisGrund,
  baueKundenmailDaten,
  baueRpcNutzlast,
  berechneAenderung,
  berechneOffeneErstattungCent,
  type Abgelehnt,
  type Aenderung,
  type AenderungsElement,
  type AenderungsPlan,
  type AenderungsPosition,
  type AenderungsStand,
  type AenderungsVorschau,
  type BestaetigungsCode,
  type KundenmailDaten,
  type Summen,
} from './orderEdit';

// ═══════════════════════════════════════════════════════════════════════
// Außenwelt – austauschbar für Tests
// ═══════════════════════════════════════════════════════════════════════

export type SpeicherErgebnis = { ok: true } | { ok: false; grund: 'stand-geaendert' | 'fehler'; meldung: string };

export interface AenderungsAbhaengigkeiten {
  /** Lädt den aktuellen Stand; null = Bestellung gibt es nicht. Wirft bei Datenbankfehlern. */
  ladeStand(orderId: string): Promise<AenderungsStand | null>;
  /** Schreibt die Änderung atomar (Migration 0038). Wirft nicht. */
  speichere(orderId: string, nutzlast: Record<string, unknown>): Promise<SpeicherErgebnis>;
  /** Verschickt die Kundenmail. Darf nicht werfen müssen – der Aufrufer fängt es trotzdem ab. */
  sendeKundenmail(params: { orderId: string; empfaenger: string; daten: KundenmailDaten }): Promise<EmailVersandErgebnis>;
  /** Klartext der Mail für die Vorschau. */
  mailText(daten: KundenmailDaten): Promise<string>;
  /** Hält den Versandausgang in der Bestell-Historie fest. */
  protokolliereMail(orderId: string, ergebnis: PromiseSettledResult<EmailVersandErgebnis>): Promise<void>;
  /** Gleicht Lieferantenaufträge an (entfallene Lieferanten abbrechen, Positions-Schnappschuss auffrischen). */
  gleicheLieferantenAn(orderId: string, plan: AenderungsPlan): Promise<void>;
  /** Link auf die Bestellansicht der Kundschaft, falls ein signierter Link möglich ist. */
  bestellansichtUrl(orderId: string): string | null;
}

// ═══════════════════════════════════════════════════════════════════════
// Vorschau
// ═══════════════════════════════════════════════════════════════════════

/**
 * Rechnet eine Änderung durch, OHNE etwas zu speichern oder zu versenden.
 * Liefert, was der Betreiber vor dem Speichern sieht – einschließlich des
 * Wortlauts der Mail, die rausgehen würde.
 */
export async function erstelleAenderungsVorschau(
  orderId: string,
  aenderungen: Aenderung[],
  deps: AenderungsAbhaengigkeiten = standardAbhaengigkeiten()
): Promise<{ ok: true; vorschau: AenderungsVorschau } | Abgelehnt> {
  let stand: AenderungsStand | null;
  try {
    stand = await deps.ladeStand(orderId);
  } catch (err) {
    console.error(`[auftragsaenderung] Stand ${orderId} nicht ladbar:`, err);
    return { ok: false, grund: 'fehler', meldung: 'Die Bestellung konnte nicht geladen werden.' };
  }
  if (!stand) return { ok: false, grund: 'nicht-gefunden', meldung: 'Bestellung nicht gefunden.' };

  const ergebnis = await berechneAenderung(stand, aenderungen);
  if (!ergebnis.ok) return ergebnis;
  const plan = ergebnis.plan;

  const mailDaten = baueKundenmailDaten(plan, stand.bestellung, deps.bestellansichtUrl(orderId));
  let text: string;
  try {
    text = await deps.mailText(mailDaten);
  } catch (err) {
    console.error(`[auftragsaenderung] Mail-Vorschau ${orderId} nicht renderbar:`, err);
    text = '(Die Vorschau der Mail konnte nicht erzeugt werden – sie würde trotzdem versendet.)';
  }

  return {
    ok: true,
    vorschau: {
      alt: plan.alt,
      neu: plan.neu,
      differenzCent: plan.differenzCent,
      positionen: plan.positionen,
      aenderungszeilen: plan.aenderungszeilen,
      bestaetigungen: plan.bestaetigungen,
      hinweise: plan.hinweise,
      erstattungNoetigCent: plan.erstattungNoetigCent,
      rechnungKorrekturNoetig: plan.rechnungKorrekturNoetig,
      rechnungsnummer: stand.bestellung.invoiceNumber,
      zahlungsstatus: stand.bestellung.paymentStatus,
      kundenmail: {
        empfaenger: stand.bestellung.email,
        betreff: betreffAuftragGeaendert(stand.bestellung.orderNumber),
        text,
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Ausführen
// ═══════════════════════════════════════════════════════════════════════

export interface AenderungsAnfrage {
  aenderungen: Aenderung[];
  /** Interner Grund (Pflicht) – landet in der Bestell-Historie. */
  begruendung: string;
  /** Soll die Kundschaft per Mail informiert werden? */
  mailSenden: boolean;
  /** Was der Betreiber ausdrücklich bestätigt hat (siehe BestaetigungsCode). */
  bestaetigungen: BestaetigungsCode[];
  /** Die Summen, die der Betreiber in der Vorschau gesehen hat – weichen sie ab, wird NICHT gespeichert. */
  erwartet: { altCent: number; neuCent: number };
}

export type KundenmailAusgang = 'gesendet' | 'fehlgeschlagen' | 'abgewaehlt' | 'keine-adresse';

export type AenderungsAusgang =
  | {
      ok: true;
      alt: Summen;
      neu: Summen;
      differenzCent: number;
      erstattungNoetigCent: number;
      rechnungKorrekturNoetig: boolean;
      aenderungszeilen: string[];
      kundenmail: KundenmailAusgang;
      /** Nicht-fatale Folgeprobleme (Mail, Lieferanten) – die Änderung selbst ist gespeichert. */
      probleme: string[];
    }
  | Abgelehnt;

const BESTAETIGUNGS_TEXTE: Record<BestaetigungsCode, string> = {
  'rechnung-korrektur': 'Rechnungskorrektur',
  'erstattung-manuell': 'Teilerstattung',
  'ware-bereits-bestellt': 'bereits bestellte Ware',
};

const BEGRUENDUNG_MIN = 3;
const BEGRUENDUNG_MAX = 500;

/**
 * Wendet eine Änderung an: berechnen → gegenprüfen → atomar speichern →
 * (erst danach) Mail und Lieferantenaufträge.
 *
 * Wirft nicht; jeder Fehlerfall ist ein Ergebnis mit Grund. Wo `ok: false`
 * steht, ist NICHTS gespeichert und NICHTS versendet worden.
 */
export async function wendeAenderungAn(
  orderId: string,
  anfrage: AenderungsAnfrage,
  deps: AenderungsAbhaengigkeiten = standardAbhaengigkeiten()
): Promise<AenderungsAusgang> {
  const begruendung = anfrage.begruendung.trim();
  if (begruendung.length < BEGRUENDUNG_MIN) {
    return { ok: false, grund: 'ungueltige-aenderung', meldung: 'Bitte einen Grund für die Änderung angeben (er steht in der Bestell-Historie).' };
  }
  if (begruendung.length > BEGRUENDUNG_MAX) {
    return { ok: false, grund: 'ungueltige-aenderung', meldung: `Der Grund ist zu lang (höchstens ${BEGRUENDUNG_MAX} Zeichen).` };
  }

  // ── 1. + 2. Laden und berechnen ───────────────────────────────────────
  let stand: AenderungsStand | null;
  try {
    stand = await deps.ladeStand(orderId);
  } catch (err) {
    console.error(`[auftragsaenderung] Stand ${orderId} nicht ladbar:`, err);
    return { ok: false, grund: 'fehler', meldung: 'Die Bestellung konnte nicht geladen werden.' };
  }
  if (!stand) return { ok: false, grund: 'nicht-gefunden', meldung: 'Bestellung nicht gefunden.' };

  const berechnet = await berechneAenderung(stand, anfrage.aenderungen);
  if (!berechnet.ok) return berechnet;
  const plan = berechnet.plan;

  // ── 3. Gegenprüfen ────────────────────────────────────────────────────
  // Der Betreiber hat bestätigt, was er in der Vorschau sah. Rechnet der Server
  // jetzt etwas anderes (Katalog geändert, Bestellung zwischendurch angepasst),
  // wird nichts gespeichert – lieber eine neue Vorschau als ein Betrag, den
  // niemand gesehen hat.
  if (plan.alt.gesamtCent !== anfrage.erwartet.altCent || plan.neu.gesamtCent !== anfrage.erwartet.neuCent) {
    return {
      ok: false,
      grund: 'vorschau-veraltet',
      meldung: 'Die Bestellung oder der Preis hat sich seit der Vorschau geändert. Bitte die Vorschau neu berechnen und prüfen.',
    };
  }
  const fehlend = plan.bestaetigungen.filter((b) => !anfrage.bestaetigungen.includes(b));
  if (fehlend.length > 0) {
    return {
      ok: false,
      grund: 'bestaetigung-fehlt',
      meldung: `Bitte bestätigen: ${fehlend.map((b) => BESTAETIGUNGS_TEXTE[b]).join(', ')}.`,
    };
  }

  const email = stand.bestellung.email?.trim() || null;
  const kundenmailPlan: 'geplant' | 'abgewaehlt' | 'keine-adresse' = !anfrage.mailSenden ? 'abgewaehlt' : email ? 'geplant' : 'keine-adresse';

  // ── 4. Speichern (eine Transaktion) ───────────────────────────────────
  const nutzlast = baueRpcNutzlast(plan, {
    reason: baueEreignisGrund(plan, begruendung),
    detail: baueEreignisDetail(plan, {
      begruendung,
      zahlungsstatus: stand.bestellung.paymentStatus,
      rechnungsnummer: stand.bestellung.invoiceNumber,
      kundenmail: kundenmailPlan,
    }),
  });
  const gespeichert = await deps.speichere(orderId, nutzlast);
  if (!gespeichert.ok) {
    return { ok: false, grund: gespeichert.grund, meldung: gespeichert.meldung };
  }

  // ── 5. Ab hier ist die Änderung gespeichert – alles Weitere ist nicht-fatal ──
  const probleme: string[] = [];
  let kundenmail: KundenmailAusgang;

  if (kundenmailPlan === 'geplant' && email) {
    const daten = baueKundenmailDaten(plan, stand.bestellung, deps.bestellansichtUrl(orderId));
    let ergebnis: PromiseSettledResult<EmailVersandErgebnis>;
    try {
      ergebnis = { status: 'fulfilled', value: await deps.sendeKundenmail({ orderId, empfaenger: email, daten }) };
    } catch (err) {
      ergebnis = { status: 'rejected', reason: err };
    }
    try {
      await deps.protokolliereMail(orderId, ergebnis);
    } catch (err) {
      console.error(`[auftragsaenderung] Mail-Ausgang ${orderId} nicht protokolliert:`, err);
    }
    const zugestellt = ergebnis.status === 'fulfilled' && ergebnis.value.success;
    kundenmail = zugestellt ? 'gesendet' : 'fehlgeschlagen';
    if (!zugestellt) {
      probleme.push('Die Mail an die Kundschaft konnte nicht versendet werden (Details in der Bestell-Historie). Bitte selbst Bescheid geben.');
    }
  } else {
    kundenmail = kundenmailPlan === 'keine-adresse' ? 'keine-adresse' : 'abgewaehlt';
    if (kundenmailPlan === 'keine-adresse') {
      probleme.push('Zu dieser Bestellung ist keine E-Mail-Adresse hinterlegt – die Kundschaft wurde nicht informiert.');
    }
  }

  try {
    await deps.gleicheLieferantenAn(orderId, plan);
  } catch (err) {
    console.error(`[auftragsaenderung] Lieferantenaufträge ${orderId} nicht angeglichen:`, err);
    probleme.push('Die Lieferantenaufträge ließen sich nicht angleichen – bitte die Lieferanten-Bestellung auf der Seite prüfen.');
  }

  return {
    ok: true,
    alt: plan.alt,
    neu: plan.neu,
    differenzCent: plan.differenzCent,
    erstattungNoetigCent: plan.erstattungNoetigCent,
    rechnungKorrekturNoetig: plan.rechnungKorrekturNoetig,
    aenderungszeilen: plan.aenderungszeilen,
    kundenmail,
    probleme,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Teilerstattung als „von Hand erstattet“ vermerken
// ═══════════════════════════════════════════════════════════════════════

export type ErstattungsVermerkErgebnis =
  | { ok: true; offenCent: number }
  | { ok: false; meldung: string };

/**
 * Hält fest, dass der Betreiber einen Teil der offenen Erstattung (aus einer
 * Auftragsänderung) selbst beim Zahlungsanbieter erstattet hat. Es bewegt sich
 * KEIN Geld – das System erfährt nur, dass der Betrag nicht mehr offen ist,
 * damit der Hinweis „Differenz X € muss erstattet werden“ verschwindet.
 */
export async function vermerkeManuelleErstattung(
  orderId: string,
  betragCent: number,
  notiz: string
): Promise<ErstattungsVermerkErgebnis> {
  if (!Number.isInteger(betragCent) || betragCent <= 0) {
    return { ok: false, meldung: 'Bitte einen Betrag über 0 € angeben.' };
  }
  const bemerkung = notiz.trim().slice(0, BEGRUENDUNG_MAX);

  const db = createAdminClient();
  const { data, error } = await db
    .from('order_events')
    .select('event_type, detail')
    .eq('order_id', orderId)
    .in('event_type', ['order_items_edited', 'manual_refund_noted']);
  if (error) {
    console.error(`[auftragsaenderung] Erstattungsstand ${orderId} nicht ladbar:`, error.message);
    return { ok: false, meldung: 'Der Stand der Erstattung konnte nicht geladen werden.' };
  }

  const offen = berechneOffeneErstattungCent(
    (data ?? []).map((e) => ({ eventType: e.event_type as string, detail: (e.detail as Record<string, unknown> | null) ?? null }))
  );
  if (offen <= 0) return { ok: false, meldung: 'Für diese Bestellung ist keine Erstattung offen.' };
  if (betragCent > offen) {
    return { ok: false, meldung: `Es sind nur ${formatiereGeld(offen / 100)} offen – der Betrag ist zu hoch.` };
  }

  const { error: insertFehler } = await db.from('order_events').insert({
    order_id: orderId,
    event_type: 'manual_refund_noted',
    reason: `Teilerstattung über ${formatiereGeld(betragCent / 100)} als von Hand erstattet vermerkt${bemerkung ? ` (${bemerkung})` : ''}.`,
    detail: { quelle: 'admin', betragCent, notiz: bemerkung || null, offenVorherCent: offen, offenNachherCent: offen - betragCent },
  });
  if (insertFehler) {
    console.error(`[auftragsaenderung] Erstattungsvermerk ${orderId} nicht gespeichert:`, insertFehler.message);
    return { ok: false, meldung: 'Der Vermerk konnte nicht gespeichert werden.' };
  }
  return { ok: true, offenCent: offen - betragCent };
}

// ═══════════════════════════════════════════════════════════════════════
// Echte Außenwelt
// ═══════════════════════════════════════════════════════════════════════

type AdminClient = ReturnType<typeof createAdminClient>;

/** Lädt Bestellung, Positionen, Motive und Lieferantenstatus. Wirft bei Datenbankfehlern. */
export async function ladeAenderungsStand(orderId: string, db: AdminClient = createAdminClient()): Promise<AenderungsStand | null> {
  const { data: order, error } = await db
    .from('orders')
    .select(
      'id, order_number, order_type, status, payment_status, payment_method, total_price, quantity, tax_rate, shipping_country, invoice_number, email'
    )
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw new Error(`orders: ${error.message}`);
  if (!order) return null;

  const { data: items, error: itemsFehler } = await db
    .from('order_items')
    .select('id, product_id, color_id, product_name, color_name, print_method, size_quantities, quantity, unit_price, total_price')
    .eq('order_id', orderId);
  if (itemsFehler) throw new Error(`order_items: ${itemsFehler.message}`);

  const itemIds = (items ?? []).map((i) => i.id as string);
  const { data: elemente, error: elementFehler } = itemIds.length
    ? await db
        .from('configuration_elements')
        .select('order_item_id, element_type, view, x_cm, y_cm, width_cm, height_cm, original_file_url, display_file_url')
        .in('order_item_id', itemIds)
    : { data: [] as Record<string, unknown>[], error: null };
  if (elementFehler) throw new Error(`configuration_elements: ${elementFehler.message}`);

  const { data: lieferanten, error: lieferantenFehler } = await db.from('supplier_orders').select('status').eq('order_id', orderId);
  if (lieferantenFehler) throw new Error(`supplier_orders: ${lieferantenFehler.message}`);

  const elementeJePosition = new Map<string, AenderungsElement[]>();
  for (const el of elemente ?? []) {
    const liste = elementeJePosition.get(el.order_item_id as string) ?? [];
    liste.push({
      type: el.element_type === 'text' ? 'text' : 'logo',
      view: el.view as string,
      xCm: Number(el.x_cm ?? 0),
      yCm: Number(el.y_cm ?? 0),
      widthCm: Number(el.width_cm ?? 0),
      heightCm: Number(el.height_cm ?? 0),
      logoPfade: [el.original_file_url, el.display_file_url].filter((p): p is string => typeof p === 'string' && p.length > 0),
    });
    elementeJePosition.set(el.order_item_id as string, liste);
  }

  const positionen: AenderungsPosition[] = (items ?? []).map((row) => ({
    id: row.id as string,
    productId: row.product_id as string,
    colorId: row.color_id as string,
    productName: row.product_name as string,
    colorName: row.color_name as string,
    printMethod: (row.print_method as string | null) ?? null,
    sizeQuantities: (row.size_quantities ?? {}) as Record<string, number>,
    quantity: Number(row.quantity ?? 0),
    unitPrice: Number(row.unit_price ?? 0),
    totalPrice: Number(row.total_price ?? 0),
    elements: elementeJePosition.get(row.id as string) ?? [],
  }));

  return {
    bestellung: {
      id: order.id as string,
      orderNumber: (order.order_number as string | null) ?? buildOrderNumber(order.id as string),
      orderType: order.order_type as string,
      status: order.status as string,
      paymentStatus: (order.payment_status as string | null) ?? 'not_required',
      paymentMethod: (order.payment_method as string | null) ?? null,
      totalPrice: Number(order.total_price ?? 0),
      quantity: order.quantity === null || order.quantity === undefined ? null : Number(order.quantity),
      taxRate: order.tax_rate === null || order.tax_rate === undefined ? null : Number(order.tax_rate),
      shippingCountry: (order.shipping_country as string | null) ?? null,
      invoiceNumber: (order.invoice_number as string | null) ?? null,
      email: (order.email as string | null) ?? null,
    },
    positionen,
    lieferantenStatus: (lieferanten ?? []).map((l) => l.status as string),
  };
}

/** Lieferantenstände, aus denen ein Auftrag NOCH abgebrochen werden darf, wenn sein Lieferant entfällt. */
const ABBRECHBAR: readonly SupplierOrderStatus[] = ['draft', 'queued', 'blocked', 'paused', 'failed'];

/**
 * Gleicht die Lieferantenaufträge an den neuen Stand an:
 *  • Fällt ein Lieferant ganz weg, wird sein noch nicht bestellter Auftrag
 *    abgebrochen – sonst bliebe ein Schnappschuss mit Ware, die niemand mehr
 *    braucht, in der Warteschlange.
 *  • Der Positions-Schnappschuss der übrigen (Entwurf/eingereiht) wird aufgefrischt.
 * Bereits bestellte Aufträge (`ordered`) werden NIE angefasst – das wurde dem
 * Betreiber vor dem Speichern als „Ware bereits bestellt“ bestätigt.
 */
async function gleicheLieferantenAn(orderId: string, plan: AenderungsPlan): Promise<void> {
  const db = createAdminClient();
  const { data: zeilen, error } = await db.from('supplier_orders').select('supplier_id, status').eq('order_id', orderId);
  if (error) throw new Error(error.message);
  if (!zeilen || zeilen.length === 0) return; // noch keine Lieferantenaufträge – nichts anzugleichen

  const benoetigt = new Set(Object.keys(buildSupplierPositions(orderId, plan.verbleibendePositionen).positionsBySupplier));
  for (const zeile of zeilen) {
    const status = zeile.status as SupplierOrderStatus;
    if (benoetigt.has(zeile.supplier_id as string) || !ABBRECHBAR.includes(status)) continue;
    await transition(db, orderId, zeile.supplier_id as string, {
      from: status,
      to: 'cancelled',
      reason: 'Alle Positionen dieses Lieferanten wurden nachträglich aus dem Auftrag entfernt (Auftragsänderung durch den Betreiber).',
    });
  }

  // Idempotent: frischt nur Schnappschüsse im Zustand draft/queued auf, ändert keinen Status.
  const aufgefrischt = await createSupplierOrder(orderId);
  if (!aufgefrischt.success) throw new Error(aufgefrischt.error ?? 'Lieferanten-Schnappschuss nicht aufgefrischt.');
}

function bestellansichtUrl(orderId: string): string | null {
  const token = erzeugeBestellToken(orderId);
  return token ? `${basisUrl()}/bestellung/${token}` : null;
}

export function standardAbhaengigkeiten(): AenderungsAbhaengigkeiten {
  return {
    ladeStand: (orderId) => ladeAenderungsStand(orderId),

    async speichere(orderId, nutzlast) {
      try {
        const db = createAdminClient();
        const { error } = await db.rpc('aendere_bestellpositionen', { p_order_id: orderId, p_aenderung: nutzlast });
        if (!error) return { ok: true };
        const code = /aenderung_abgelehnt:([a-z-]+)/.exec(error.message)?.[1];
        if (code === 'stand-geaendert') {
          return {
            ok: false,
            grund: 'stand-geaendert',
            meldung: 'Die Bestellung hat sich während der Bearbeitung geändert (Status, Zahlung oder Positionen). Es wurde nichts gespeichert – bitte die Seite neu laden.',
          };
        }
        console.error(`[auftragsaenderung] Speichern ${orderId} abgelehnt/fehlgeschlagen:`, error.message);
        return {
          ok: false,
          grund: 'fehler',
          meldung: code
            ? `Die Datenbank hat die Änderung abgelehnt (${code}). Es wurde nichts gespeichert.`
            : 'Die Änderung konnte nicht gespeichert werden. Es wurde nichts verändert.',
        };
      } catch (err) {
        console.error(`[auftragsaenderung] Speichern ${orderId} fehlgeschlagen:`, err);
        return { ok: false, grund: 'fehler', meldung: 'Die Änderung konnte nicht gespeichert werden. Es wurde nichts verändert.' };
      }
    },

    sendeKundenmail: (params) => sendOrderEditedEmail(params),
    mailText: (daten) => renderAuftragGeaendertText(daten),
    protokolliereMail: (orderId, ergebnis) => protokolliereVersand(orderId, 'order_edited', ergebnis),
    gleicheLieferantenAn,
    bestellansichtUrl,
  };
}
