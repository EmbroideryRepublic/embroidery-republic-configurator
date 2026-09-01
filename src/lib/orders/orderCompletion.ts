/**
 * ═══════════════════════════════════════════════════════════════════════
 * PHASE 2 DES BESTELLEINGANGS: ABSCHLIESSEN
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Der Bestelleingang zerfällt in zwei Phasen:
 *
 *   1. ANLEGEN     (lib/actions/orders.ts) – prüfen, bepreisen, speichern.
 *                  Danach EXISTIERT die Bestellung.
 *   2. ABSCHLIESSEN (diese Datei) – Druckvorschauen rendern, Produktionsblatt
 *                  erzeugen, Kundschaft und Betrieb benachrichtigen.
 *
 * ── Warum die Trennung ────────────────────────────────────────────────
 * Beim Rechnungskauf folgen beide Phasen unmittelbar aufeinander – genau wie
 * bisher, das Verhalten ändert sich nicht.
 *
 * Sobald bezahlt wird, liegt dazwischen aber ein Wechsel zum
 * Zahlungsdienstleister und zurück. Ohne die Trennung würde für JEDEN
 * abgebrochenen Bezahlvorgang das volle Programm laufen: mehrere Megabyte
 * Druckvorschauen, ein Produktionsblatt und – schlimmer – eine
 * Bestellbestätigung für etwas, das nie bezahlt wurde.
 *
 * Phase 2 enthält deshalb genau die Schritte, die TEUER oder nach AUSSEN
 * SICHTBAR sind. Alles, was die Bestellung erst vollständig macht (auch der
 * Upload der Logodateien), gehört zu Phase 1 – sonst wäre eine unbezahlte
 * Bestellung unvollständig gespeichert.
 *
 * ── Diese Phase scheitert nie fatal ───────────────────────────────────
 * Zum Zeitpunkt des Aufrufs ist die Bestellung bereits gespeichert und gilt
 * als erfolgreich. Jeder Schritt hier ist einzeln abgesichert; die Funktion
 * wirft nicht. Ein Rendering- oder Versandfehler darf eine gültige
 * Bestellung niemals nachträglich zum Scheitern bringen – die Datenbank ist
 * die Quelle der Wahrheit, nicht das PDF.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { uploadProductionFile, getProductionFileSignedUrl, downloadProductionFile } from '@/lib/supabase/storage';
import { renderProductionSheet } from '@/lib/production/buildProductionSheet';
import { renderPrintView } from '@/lib/rendering/renderPrintView';
import { toRenderableElement } from '@/lib/rendering/mapOrderElements';
import { verarbeiteBestelleingang, versucheBestellbestaetigung } from './orderIntake';
import { protokolliereBestellereignis, protokolliereVersand, persistiereKritischMitWiederholung } from './orderService';
import { buildOrderNumber, PRINT_VIEW_LABELS } from '@/lib/actions/orderTypes';
import type { OrderElementRecord, OrderItemRecord, OrderPaymentMethod, OrderRecord, RechnungFuerEmail } from '@/lib/actions/orderTypes';
import { brauchtVorabZahlung } from '@/config/zahlung';
import { waehleRechnungsAnbieter, istRechnungserstellungMoeglich } from '@/lib/invoicing/registry';
import { RechnungsTeilerfolgFehler, type Rechnungsauftrag, type Rechnungserstellung } from '@/lib/invoicing/types';
import { PAYMENT_TERM_DAYS, IST_KLEINUNTERNEHMER } from '@/config/company';
import { ziehNaechsteRechnungsnummer } from './rechnungsnummer';
import { sendEmail } from '@/lib/email/sendEmail';
import { InvoiceEmail } from '@/lib/email/templates/InvoiceEmail';
import type { PrintView } from '@/types';

/**
 * Was Phase 2 erreicht hat.
 *
 * Nach demselben Muster wie die übrigen Ergebnisobjekte im Projekt
 * (`StageResult`, `StatusErgebnis`): Es wird berichtet, nicht geworfen. Der
 * Aufrufer kann das Ergebnis protokollieren – oder ignorieren, ohne dass
 * etwas kaputtgeht.
 */
export interface AbschlussErgebnis {
  /** Erfolgreich gerenderte und abgelegte Druckvorschauen. */
  vorschauen: number;
  /** Produktionsblatt erzeugt und hochgeladen. */
  produktionsblatt: boolean;
  /** Kommunikation angestoßen (Bestätigung + interne Meldung). */
  kommunikation: boolean;
  /** Rechnung bei Lexware erstellt und der Bestellung zugeordnet. */
  rechnung: boolean;
  /** Was schiefging – leer, wenn alles glattlief. */
  probleme: string[];
}

/**
 * Schließt eine bereits ANGELEGTE Bestellung ab.
 *
 * Bekommt den vollständigen Datensatz übergeben, statt ihn selbst zu laden:
 * Beim Rechnungskauf liegt er ohnehin im Speicher, und ein zusätzlicher
 * Ladevorgang wäre reine Verschwendung.
 *
 * Für den Zahlungs-Webhook wird eine Variante gebraucht, die den Datensatz
 * anhand der Bestell-ID aus der Datenbank rekonstruiert – siehe
 * `ladeBestellungFuerAbschluss` weiter unten.
 */
export async function schliesseBestellungAb(order: OrderRecord): Promise<AbschlussErgebnis> {
  const probleme: string[] = [];

  const vorschauen = await erzeugeDruckvorschauen(order, probleme);
  const { pfad: produktionsblattPfad, signierteUrl } = await erzeugeProduktionsblatt(order, probleme);

  // Rechnung VOR der Kommunikation erstellen (seit 2026-09-01, vorher
  // umgekehrt): Nur so kann die EINE Bestellbestätigung unten die bereits
  // fertige Rechnung als PDF mitschicken, statt einer zweiten, separaten
  // Rechnungs-E-Mail (Fund vom 2026-09-01, echter PayPal-Live-Test: bis
  // dahin gingen Zahlungsbestätigung, Bestellbestätigung UND Rechnung als
  // drei getrennte E-Mails raus – für ein einziges Ereignis wirkte das wie
  // Spam). Ändert nichts an erzeugeRechnung()s eigener Erfolgs-/
  // Fehlerlogik – nur WOHIN das Ergebnis bei Erfolg fließt.
  let rechnungFuerEmail: RechnungFuerEmail | null = null;
  const rechnung = await erzeugeRechnung(order, probleme, (info) => {
    rechnungFuerEmail = info;
  });
  const kommunikation = await benachrichtige(order, signierteUrl, probleme, rechnungFuerEmail);

  return {
    vorschauen,
    produktionsblatt: Boolean(produktionsblattPfad),
    kommunikation,
    rechnung,
    probleme,
  };
}

/**
 * Holt Phase 2 nach, falls sie für eine bereits angelegte Bestellung nie
 * gelaufen ist – der Retry-Pfad für `lib/actions/orders.ts` (beide
 * Doppelschutz-Treffer bei `clientRequestId`: dieselbe Absendung kam ein
 * zweites Mal an, weil die erste Antwort den Kunden nie erreichte).
 *
 * Ohne diese Nachholung blieb eine Bestellung, deren Phase 1 (die
 * Datenbanktransaktion) zwar committet hatte, deren Phase 2 aber vor/während
 * des Renderings abbrach (Deploy-Neustart, Funktions-Timeout, Absturz),
 * für immer ohne Bestätigungsmail, interne Benachrichtigung und
 * Produktionsblatt – der bisherige Code gab bei einem Treffer sofort
 * `success:true` zurück, ohne je zu prüfen, ob Phase 2 überhaupt gelaufen
 * war. `useSubmitGuard` schickt den Kunden nach einer Zeitüberschreitung
 * genau mit dieser (unveränderten) `clientRequestId` erneut los – das ist
 * also kein Rand-, sondern der erwartete Wiederherstellungsweg.
 *
 * Bewusst HIER statt in orders.ts: Phase 2 bleibt so vollständig
 * eigenständig aufrufbar (siehe „Der Abschluss hängt nicht am Anlegen" in
 * phasentrennung.test.ts) und `schliesseBestellungAb` wird in orders.ts
 * weiterhin nur an der einen regulären Stelle direkt aufgerufen.
 *
 * Bei Vorabzahlung (Karte/PayPal) wird NICHTS nachgeholt – dort startet
 * Phase 2 erst durch den bestätigten Zahlungs-Webhook, exakt wie beim
 * Erstversuch. `verarbeiteBestelleingang` ist selbst idempotent (prüft
 * `internal_notification_email_id`), ein erneuter Aufruf von
 * `schliesseBestellungAb` sendet also so oder so keine zweite E-Mail – die
 * Prüfung hier erspart nur die überflüssige Rendering-/PDF-Arbeit im
 * Normalfall (die Antwort ging nur verloren, Phase 2 lief längst durch).
 */
export async function holeAbschlussFuerRetryNach(orderId: string): Promise<void> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('orders')
    .select('payment_method, internal_notification_email_id')
    .eq('id', orderId)
    .maybeSingle<{ payment_method: OrderPaymentMethod | null; internal_notification_email_id: string | null }>();

  if (error || !data) return;
  if (data.internal_notification_email_id) return; // Phase 2 lief bereits vollständig durch.

  const vorabZahlung = data.payment_method ? brauchtVorabZahlung(data.payment_method) : false;
  if (vorabZahlung) return; // wartet weiterhin auf den Zahlungs-Webhook

  const order = await ladeBestellungFuerAbschluss(orderId);
  if (!order) return;

  console.info(`[orders] Phase 2 für ${orderId} war offen – hole sie im Retry nach.`);
  const abschluss = await schliesseBestellungAb(order);
  if (abschluss.probleme.length > 0) {
    console.warn(`[orders] Nachgeholter Abschluss ${orderId} mit Einschränkungen:`, abschluss.probleme);
  }
}

/**
 * Holt ausschließlich die Rechnungserstellung nach – für Bestellungen, deren
 * letzter Versuch SAUBER fehlgeschlagen ist (Anspruch wieder freigegeben,
 * keine Rechnung, kein Klärungsfall) und die seitdem nie erneut versucht
 * wurden.
 *
 * ── Warum das nötig ist, obwohl es `holeAbschlussFuerRetryNach` oben schon
 * gibt ────────────────────────────────────────────────────────────────────
 * Jener Weg greift ausschließlich, wenn dieselbe `clientRequestId` erneut
 * ankommt, UND bricht sofort ab, sobald `internal_notification_email_id`
 * bereits gesetzt ist – also praktisch immer, denn Kommunikation und
 * Rechnung sind unabhängige Schritte in `schliesseBestellungAb` (siehe dort):
 * Scheitert nur die Rechnung, während Bestätigung/interne Meldung längst
 * erfolgreich liefen, wird dieser Fall von `holeAbschlussFuerRetryNach` nie
 * erreicht. Ohne einen eigenen Nachholweg bliebe so eine Bestellung
 * dauerhaft ohne `accounting_ready_at` und würde nie zur lokalen Buchhaltung
 * synchronisiert (Abnahme-Review vom 2026-08-18, Punkt 10) – unabhängig
 * davon, ob der Kunde je erneut etwas absendet.
 *
 * Der bestehende Cron-Reaper `gib_haengende_rechnungserstellung_frei` (siehe
 * Migration 0026) deckt das ebenfalls nicht ab: Er befreit nur Ansprüche, die
 * hängengeblieben sind (`rechnung_erstellung_gestartet_am IS NOT NULL`,
 * Absturz mitten in der Bearbeitung) – ein sauber freigegebener Anspruch
 * (`rechnung_erstellung_gestartet_am IS NULL`) sieht für ihn bereits wie
 * "nichts zu tun" aus, obwohl genau hier niemand je einen neuen Versuch
 * anstößt.
 *
 * Ruft bewusst NUR den privaten Rechnungs-Schritt auf, nicht die gesamte
 * Phase 2: Druckvorschauen, Produktionsblatt und Kommunikation sind für eine
 * längst bestätigte Bestellung entweder schon gelaufen oder für diesen
 * gezielten Nachholvorgang irrelevant. Die Auswahl-Bedingung entspricht exakt
 * der von `beanspruche_rechnungserstellung` (Migration 0026) – der
 * eigentliche Schutz gegen doppelte Rechnungserstellung liegt weiterhin
 * ausschließlich in jenem atomaren Claim, nicht in dieser Auswahl hier: Läuft
 * der reguläre Zahlungs-Webhook zufällig zeitgleich für dieselbe Bestellung,
 * gewinnt nur einer der beiden Aufrufe den Claim, der andere ist ein
 * folgenloses No-op (siehe `erzeugeRechnung`).
 *
 * Von der Cron-Route aufgerufen (siehe process-supplier-orders/route.ts);
 * wirft nie.
 */
export async function holeOffeneRechnungenNach(
  limit: number
): Promise<{ gefunden: number; erstellt: number; fehlgeschlagen: number }> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('orders')
    .select('id')
    .eq('order_type', 'order')
    .in('payment_status', ['paid', 'not_required'])
    .is('invoice_id', null)
    .eq('rechnung_unklarer_zustand', false)
    .is('rechnung_erstellung_gestartet_am', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[orders] Suche nach offenen Rechnungen fehlgeschlagen:', error.message);
    return { gefunden: 0, erstellt: 0, fehlgeschlagen: 0 };
  }

  let erstellt = 0;
  let fehlgeschlagen = 0;
  // Bewusst sequenziell statt parallel: Dieser Pfad greift nur bei seltenen,
  // sauber fehlgeschlagenen Einzelfällen (Regelfall: 0 Treffer) – anders als
  // `processDueSupplierOrders` ist hier kein Durchsatz gefragt, und jeder
  // einzelne Versuch verschickt bereits eine E-Mail mit PDF-Anhang.
  for (const zeile of data ?? []) {
    const orderId = zeile.id as string;
    const order = await ladeBestellungFuerAbschluss(orderId);
    if (!order) {
      fehlgeschlagen++;
      continue;
    }
    const probleme: string[] = [];
    const ok = await erzeugeRechnung(order, probleme);
    if (ok) {
      erstellt++;
    } else {
      fehlgeschlagen++;
      console.warn(`[orders] Rechnungs-Retry für ${orderId} weiterhin ohne Erfolg:`, probleme);
    }
  }

  return { gefunden: (data ?? []).length, erstellt, fehlgeschlagen };
}

/**
 * Lädt eine BEREITS erstellte Rechnung für den Nachhol-Versand der
 * Bestellbestätigung (siehe `holeOffeneBestellbestaetigungenNach` unten).
 *
 * ── Warum das nötig ist ────────────────────────────────────────────────────
 * `erzeugeRechnung()` und `versucheBestellbestaetigung()` sind bewusst
 * UNABHÄNGIG voneinander abgesichert (jede mit eigenem Claim). Das ist
 * richtig, hat aber eine Lücke: Schlägt beim ERSTEN Versuch nur der
 * E-Mail-Versand fehl (z.B. Resend-Ratenlimit), während die Rechnung im
 * selben Lauf bereits erfolgreich erstellt wurde, findet
 * `holeOffeneRechnungenNach` diese Bestellung nie wieder (sein Filter ist
 * `invoice_id IS NULL` – hier längst gesetzt). Ohne diese Funktion würde der
 * Nachhol-Versand unten die Bestellbestätigung zwar zustellen, aber OHNE die
 * Rechnung zu erwähnen oder anzuhängen – und die Kundschaft bekäme ihre
 * Rechnung dann NIE per E-Mail, obwohl sie bei uns längst existiert (Fund
 * beim Zustandslogik-Audit vom 2026-09-01, PayPal-Live-Test).
 *
 * Wirft nie: Ein Fehlschlag beim Nachladen des PDFs darf den ohnehin schon
 * verzögerten Bestätigungsversand nicht zusätzlich blockieren – im
 * schlimmsten Fall geht die Bestätigung dann wie bisher ohne Rechnung raus.
 */
async function ladeBereitsErstellteRechnungFuerEmail(
  db: ReturnType<typeof createAdminClient>,
  orderId: string,
  paymentMethod: OrderPaymentMethod | null | undefined
): Promise<RechnungFuerEmail | null> {
  const { data, error } = await db
    .from('orders')
    .select('invoice_number, invoice_pdf_url, invoice_date')
    .eq('id', orderId)
    .maybeSingle<{ invoice_number: string | null; invoice_pdf_url: string | null; invoice_date: string | null }>();

  if (error || !data?.invoice_number || !data.invoice_pdf_url) return null;

  try {
    const pdf = await downloadProductionFile(data.invoice_pdf_url);
    return {
      rechnungsnummer: data.invoice_number,
      rechnungsdatum: data.invoice_date ?? new Date().toISOString().slice(0, 10),
      pdf,
      zahlungszielTage: !paymentMethod || paymentMethod === 'invoice' ? PAYMENT_TERM_DAYS : 0,
    };
  } catch (err) {
    console.error(`[orders] Bereits erstellte Rechnung für ${orderId} nicht nachladbar:`, err);
    return null;
  }
}

/**
 * Holt die Bestellbestätigung nach für Bestellungen, deren Zustellung sauber
 * fehlgeschlagen ist (Anspruch wieder freigegeben, order_confirmation_sent_at
 * weiterhin null) und die seitdem nie erneut versucht wurden.
 *
 * ── Warum das nötig ist (Vorfall 2026-08-21) ──────────────────────────────
 * `sendEmail()` ist bewusst "best effort, nie fatal" – lehnt der Versanddienst
 * ab (Domain nicht verifiziert, ungültiger Schlüssel, Ratenlimit, …), bleibt
 * die Bestellung ohne diesen Nachholweg für IMMER ohne Bestätigung, bis
 * jemand manuell eingreift. `versucheBestellbestaetigung` (orderIntake.ts)
 * macht daraus einen claim-geschützten, sicher wiederholbaren Vorgang; diese
 * Funktion ist der Aufrufer für den Cron-Lauf.
 *
 * Die Auswahl-Bedingung entspricht exakt der von `beanspruche_bestellbestaetigung`
 * (Migration 0030, seit 0033 UM payment_status ERGÄNZT – siehe dort: eine
 * Bestellung mit Vorabzahlung, deren Zahlung noch nie bestätigt wurde, hat
 * ebenfalls beide Zeitstempel auf NULL, nicht weil ein Versand fehlschlug,
 * sondern weil noch nie einer versucht wurde. Ohne den Filter hier UND im
 * Claim hätte dieser Cron-Lauf ihr fälschlich eine "Zahlung eingegangen"-
 * Bestätigung geschickt, bevor überhaupt bezahlt wurde – real reproduziert
 * beim Zustandslogik-Audit vom 2026-09-01, siehe Migrationskommentar 0033) –
 * der eigentliche Schutz gegen eine doppelte Zustellung bleibt vollständig im
 * dortigen atomaren Claim; läuft zufällig zeitgleich ein regulärer
 * Bestelleingang für dieselbe Bestellung, gewinnt nur einer der beiden
 * Aufrufe den Claim, der andere ist ein folgenloses No-op. Der Filter hier
 * ist zusätzlich (nicht statt des Claims): erspart nur den überflüssigen
 * RPC-Aufruf für Bestellungen, die ohnehin nie einen Anspruch bekämen.
 *
 * Ruft bewusst NUR den Bestätigungs-Schritt auf, nicht die gesamte Phase 2
 * (kein erneutes Rendering/PDF) – dieselbe Begründung wie bei
 * `holeOffeneRechnungenNach` oben. Lädt aber (siehe
 * `ladeBereitsErstellteRechnungFuerEmail` oben) eine zwischenzeitlich bereits
 * erstellte Rechnung nach, damit sie in DIESER Bestätigung noch mitgeschickt
 * werden kann, statt spurlos unversendet zu bleiben.
 *
 * Von der Cron-Route aufgerufen (siehe process-supplier-orders/route.ts);
 * wirft nie.
 */
export async function holeOffeneBestellbestaetigungenNach(
  limit: number
): Promise<{ gefunden: number; zugestellt: number; weiterhinOffen: number }> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('orders')
    .select('id')
    .eq('order_type', 'order')
    .in('payment_status', ['paid', 'not_required'])
    .is('order_confirmation_sent_at', null)
    .is('order_confirmation_versuch_gestartet_am', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[orders] Suche nach offenen Bestellbestätigungen fehlgeschlagen:', error.message);
    return { gefunden: 0, zugestellt: 0, weiterhinOffen: 0 };
  }

  let zugestellt = 0;
  let weiterhinOffen = 0;
  // Bewusst sequenziell statt parallel: Regelfall ist 0 Treffer, und jeder
  // Treffer löst einen echten Versandversuch aus – kein Durchsatz-Pfad,
  // dieselbe Begründung wie bei holeOffeneRechnungenNach oben.
  for (const zeile of data ?? []) {
    const orderId = zeile.id as string;
    const order = await ladeBestellungFuerAbschluss(orderId);
    if (!order) {
      weiterhinOffen++;
      continue;
    }
    const rechnung = await ladeBereitsErstellteRechnungFuerEmail(db, orderId, order.paymentMethod);
    const ergebnis = await versucheBestellbestaetigung(order, rechnung);
    await protokolliereVersand(orderId, 'order_confirmation', { status: 'fulfilled', value: ergebnis });
    if (ergebnis.success) {
      zugestellt++;
    } else {
      weiterhinOffen++;
      console.warn(`[orders] Bestätigungs-Retry für ${orderId} weiterhin ohne Erfolg.`);
    }
  }

  return { gefunden: (data ?? []).length, zugestellt, weiterhinOffen };
}

/**
 * Rekonstruiert eine gespeicherte Bestellung als vollständigen Datensatz.
 *
 * Das ist der Weg des Zahlungs-Webhooks: Er kennt nur die Bestell-ID, muss
 * die Bestellung aber abschließen können – ohne den Speicher der Anfrage, in
 * der sie einst angelegt wurde. Die Datenbank ist dafür die einzige Quelle.
 *
 * Gibt `null` zurück, wenn die Bestellung nicht existiert. Wirft nicht: Der
 * Aufrufer ist ein Webhook-Endpunkt und muss dem Zahlungsdienstleister
 * antworten können, auch wenn hier etwas schiefgeht.
 */
export async function ladeBestellungFuerAbschluss(orderId: string): Promise<OrderRecord | null> {
  const db = createAdminClient();

  const { data: bestellung, error } = await db
    .from('orders')
    // Als EIN Zeichenkettenliteral: Der Supabase-Client leitet die Feldtypen
    // statisch aus dieser Angabe ab und kann eine zusammengesetzte
    // Zeichenkette nicht auswerten.
    .select(
      'id, created_at, order_type, customer_name, company, email, phone, message, total_price, payment_method, shipping_street, shipping_zip, shipping_city, shipping_country, tax_rate, tax_amount, net_total, customer_vat_id'
    )
    .eq('id', orderId)
    .maybeSingle();

  if (error || !bestellung) {
    console.error(`[orders] Bestellung ${orderId} für den Abschluss nicht ladbar:`, error);
    return null;
  }

  const { data: positionen, error: positionenFehler } = await db
    .from('order_items')
    .select('id, product_id, product_name, color_id, color_name, print_method, size_quantities, quantity, unit_price, total_price')
    .eq('order_id', orderId);

  if (positionenFehler) {
    console.error(`[orders] Positionen zu ${orderId} nicht ladbar:`, positionenFehler);
    return null;
  }

  const positionsIds = (positionen ?? []).map((p) => p.id as string);
  const { data: elemente } = positionsIds.length
    ? await db.from('configuration_elements').select('*').in('order_item_id', positionsIds)
    : { data: [] as Record<string, unknown>[] };

  const elementeJePosition = new Map<string, OrderElementRecord[]>();
  for (const el of elemente ?? []) {
    const liste = elementeJePosition.get(el.order_item_id as string) ?? [];
    liste.push(zuElementRecord(el as Record<string, unknown>));
    elementeJePosition.set(el.order_item_id as string, liste);
  }

  const gesamt = Number(bestellung.total_price ?? 0);
  // `orders` führt Warenwert und Versand nicht getrennt – nur die Endsumme
  // und (seit Migration 0013) den Positionsgesamtpreis je order_item. Der
  // Versandanteil lässt sich daraus ABLEITEN (Endsumme minus Warenwert),
  // statt ihn zu erraten oder auf 0 zu setzen – für die Lexware-Rechnung
  // (erzeugeRechnung unten) muss er als eigene Position stimmen.
  const warenwert = (positionen ?? []).reduce((summe, p) => summe + Number(p.total_price ?? 0), 0);
  const versand = Math.max(0, Math.round((gesamt - warenwert) * 100) / 100);

  return {
    id: bestellung.id as string,
    orderNumber: buildOrderNumber(bestellung.id as string),
    orderType: bestellung.order_type as 'order' | 'inquiry',
    createdAt: bestellung.created_at as string,
    contact: {
      name: bestellung.customer_name as string,
      company: (bestellung.company as string | null) ?? undefined,
      email: bestellung.email as string,
      phone: (bestellung.phone as string | null) ?? undefined,
    },
    shipping: bestellung.shipping_street
      ? {
          street: bestellung.shipping_street as string,
          zip: bestellung.shipping_zip as string,
          city: bestellung.shipping_city as string,
          country: bestellung.shipping_country as string,
        }
      : undefined,
    paymentMethod: (bestellung.payment_method as OrderRecord['paymentMethod']) ?? undefined,
    message: (bestellung.message as string | null) ?? undefined,
    // `orders` führt Warenwert und Versand nicht getrennt – nur die Endsumme.
    // Für den Abschluss genügt das: Produktionsblatt und Bestätigung zeigen
    // die Gesamtsumme. Sollte die Aufteilung je gebraucht werden, kommt sie
    // aus der Preispipeline und nicht aus einer Rückrechnung.
    subtotal: gesamt,
    shippingCost: versand,
    totalPrice: gesamt,
    taxAmount: bestellung.tax_amount !== null && bestellung.tax_amount !== undefined ? Number(bestellung.tax_amount) : undefined,
    taxRate: bestellung.tax_rate !== null && bestellung.tax_rate !== undefined ? Number(bestellung.tax_rate) : undefined,
    netTotal: bestellung.net_total !== null && bestellung.net_total !== undefined ? Number(bestellung.net_total) : undefined,
    customerVatId: (bestellung.customer_vat_id as string | null) ?? undefined,
    items: (positionen ?? []).map((p) => ({
      productId: p.product_id as string,
      colorId: p.color_id as string,
      productName: p.product_name as string,
      colorName: p.color_name as string,
      printMethod: (p.print_method as 'dtf' | 'embroidery') ?? 'dtf',
      sizeQuantities: (p.size_quantities ?? {}) as Record<string, number>,
      quantity: Number(p.quantity ?? 0),
      unitPrice: Number(p.unit_price ?? 0),
      // Gespeichert, nicht abgeleitet – siehe Migration 0013.
      totalPrice: Number(p.total_price ?? 0),
      elements: elementeJePosition.get(p.id as string) ?? [],
    })),
  };
}

/** Übersetzt eine gespeicherte Zeile zurück in einen Motiv-Datensatz. */
function zuElementRecord(zeile: Record<string, unknown>): OrderElementRecord {
  const basis = {
    view: zeile.view as OrderElementRecord['view'],
    xCm: Number(zeile.x_cm ?? 0),
    yCm: Number(zeile.y_cm ?? 0),
    widthCm: Number(zeile.width_cm ?? 0),
    heightCm: Number(zeile.height_cm ?? 0),
    rotationDeg: Number(zeile.rotation_deg ?? 0),
  };

  if (zeile.element_type === 'text') {
    return {
      ...basis,
      type: 'text',
      content: (zeile.text_content as string | null) ?? '',
      fontFamily: (zeile.font_family as string | null) ?? undefined,
      fontSizePx: zeile.font_size ? Number(zeile.font_size) : undefined,
      color: (zeile.font_color as string | null) ?? undefined,
      bold: zeile.font_weight === 'bold',
      italic: zeile.font_style === 'italic',
      align: (zeile.text_align as string | null) ?? undefined,
      letterSpacing: zeile.letter_spacing ? Number(zeile.letter_spacing) : undefined,
      lineHeight: zeile.line_height ? Number(zeile.line_height) : undefined,
      hasShadow: Boolean(zeile.has_shadow),
      hasOutline: Boolean(zeile.has_outline),
      outlineColor: (zeile.outline_color as string | null) ?? undefined,
    };
  }

  return {
    ...basis,
    type: 'logo',
    fileName: (zeile.file_name as string | null) ?? undefined,
    logoStoragePath: (zeile.original_file_url as string | null) ?? undefined,
    logoDisplayStoragePath: (zeile.display_file_url as string | null) ?? undefined,
  };
}

/** Ergebnis EINER gerenderten (Position × Ansicht)-Druckvorschau. */
export interface EinzelVorschauErgebnis {
  ok: boolean;
  pngBuffer?: Buffer;
  /** Nur gesetzt bei ok:false – Grund, warum keine Vorschau entstand
   *  (fehlende Logo-Datei im Storage, kein Produktbild/Druckbereich für
   *  diese Ansicht, Rendering-Fehler …). */
  grund?: string;
}

/**
 * Rendert EINE (Position × Ansicht)-Druckvorschau und lädt sie hoch – die
 * kleinste unabhängige Arbeitseinheit von `erzeugeDruckvorschauen` unten.
 * Wirft NIE: jeder Fehlerfall (fehlende Logo-Datei, kein Druckbereich für
 * diese Ansicht, Rendering-Fehler) wird als `{ok:false, grund}` gemeldet,
 * damit ein Fehlschlag bei EINEM Element nicht die Vorschauen der übrigen,
 * unabhängigen Positionen/Ansichten mitreißt (siehe Aufrufer).
 *
 * Exportiert, damit dieselbe Rendering-Pipeline auch von der Admin-Ansicht
 * aus für eine einzelne fehlende Vorschau nachträglich aufgerufen werden
 * kann (siehe lib/actions/productionPreviewActions.ts) – keine zweite,
 * parallele Rendering-Implementierung.
 */
export async function renderUndLadeEineDruckvorschauHoch(
  orderId: string,
  itemIndex: number,
  itemRecord: Pick<OrderItemRecord, 'productId' | 'colorId' | 'printMethod' | 'sizeQuantities'>,
  view: PrintView,
  elements: OrderElementRecord[]
): Promise<EinzelVorschauErgebnis> {
  try {
    const renderbar = await Promise.all(elements.map(toRenderableElement));
    const ergebnis = await renderPrintView({
      productId: itemRecord.productId,
      colorId: itemRecord.colorId,
      view,
      printMethod: itemRecord.printMethod,
      elements: renderbar,
      sizeQuantities: itemRecord.sizeQuantities,
    });
    if (!ergebnis) {
      return { ok: false, grund: 'Kein Produktbild oder kein Druckbereich für diese Ansicht hinterlegt.' };
    }
    await uploadProductionFile(`orders/${orderId}/preview-item${itemIndex}-${view}.png`, ergebnis.pngBuffer, 'image/png');
    return { ok: true, pngBuffer: ergebnis.pngBuffer };
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    console.error(`[orders] Druckvorschau ${orderId}/item${itemIndex}/${view} fehlgeschlagen:`, err);
    return { ok: false, grund: text };
  }
}

/**
 * Rendert je Position und Ansicht mit mindestens einem Element ein
 * hochauflösendes PNG (Kleidungsstück + Motive exakt wie im Editor
 * platziert) und legt es ab.
 *
 * Die Buffer bleiben zusätzlich am jeweiligen `OrderItemRecord` hängen:
 * `renderProductionSheet` läuft gleich danach und bettet sie direkt ein,
 * statt sie erneut herunterzuladen.
 *
 * Jede (Position × Ansicht)-Aufgabe ist über
 * `renderUndLadeEineDruckvorschauHoch` einzeln abgesichert (wirft nie) –
 * eine fehlende/kaputte Logo-Datei bei EINER Aufgabe darf nicht dazu
 * führen, dass alle übrigen, unabhängigen Vorschauen derselben Bestellung
 * ebenfalls ausbleiben (vormals: ein gemeinsames Promise.all mit einem
 * EINZIGEN äußeren try/catch – der erste Fehlschlag ließ Promise.all sofort
 * verwerfen und keine einzige Vorschau wurde gespeichert, auch nicht die
 * bereits fertigen).
 */
async function erzeugeDruckvorschauen(order: OrderRecord, probleme: string[]): Promise<number> {
  // Erst alle (Position × Ansicht)-Kombinationen sammeln, dann PARALLEL
  // rendern und hochladen. Nacheinander summierten sich die einzelnen
  // Rasterungen bei mehreren Positionen zu einer langen Wartezeit; die
  // Aufgaben sind voneinander unabhängig (getrennte Pfade und Buffer).
  const aufgaben: { itemIndex: number; itemRecord: OrderItemRecord; view: PrintView; elements: OrderElementRecord[] }[] = [];
  for (let itemIndex = 0; itemIndex < order.items.length; itemIndex++) {
    const itemRecord = order.items[itemIndex];
    if (!itemRecord) continue;

    const nachAnsicht = new Map<PrintView, OrderElementRecord[]>();
    for (const el of itemRecord.elements) {
      const liste = nachAnsicht.get(el.view) ?? [];
      liste.push(el);
      nachAnsicht.set(el.view, liste);
    }
    for (const [view, elements] of nachAnsicht) {
      aufgaben.push({ itemIndex, itemRecord, view, elements });
    }
  }

  let erzeugt = 0;
  const begonnen = Date.now();
  await Promise.all(
    aufgaben.map(async (aufgabe) => {
      const ergebnis = await renderUndLadeEineDruckvorschauHoch(
        order.id,
        aufgabe.itemIndex,
        aufgabe.itemRecord,
        aufgabe.view,
        aufgabe.elements
      );
      if (ergebnis.ok && ergebnis.pngBuffer) {
        aufgabe.itemRecord.previews ??= {};
        aufgabe.itemRecord.previews[aufgabe.view] = ergebnis.pngBuffer;
        erzeugt++;
      } else if (ergebnis.grund) {
        probleme.push(
          `Druckvorschau ${aufgabe.itemRecord.productName} (${PRINT_VIEW_LABELS[aufgabe.view] ?? aufgabe.view}): ${ergebnis.grund}`
        );
      }
    })
  );
  console.info(`[orders] Druckvorschauen: ${erzeugt}/${aufgaben.length} Ansicht(en) in ${Date.now() - begonnen} ms.`);
  return erzeugt;
}

/** Erzeugt das Produktionsblatt und vermerkt es an der Bestellung. */
async function erzeugeProduktionsblatt(
  order: OrderRecord,
  probleme: string[]
): Promise<{ pfad: string | null; signierteUrl: string | null }> {
  try {
    const begonnen = Date.now();
    const pdf = await renderProductionSheet(order);
    const pfad = `orders/${order.id}/produktionsblatt.pdf`;
    const db = createAdminClient();
    // Upload und Statusspalte hängen nicht voneinander ab → parallel.
    await Promise.all([
      uploadProductionFile(pfad, pdf, 'application/pdf'),
      db.from('orders').update({ pdf_url: pfad, production_files_url: `orders/${order.id}/` }).eq('id', order.id),
    ]);
    const signierteUrl = await getProductionFileSignedUrl(pfad);
    console.info(`[orders] Produktionsblatt in ${Date.now() - begonnen} ms.`);
    return { pfad, signierteUrl };
  } catch (err) {
    // Die Bestellung ist gespeichert; das Produktionsblatt lässt sich
    // notfalls manuell nachziehen.
    const text = err instanceof Error ? err.message : String(err);
    console.error('[orders] Produktionsblatt-Erzeugung fehlgeschlagen:', err);
    probleme.push(`Produktionsblatt: ${text}`);
    return { pfad: null, signierteUrl: null };
  }
}

/**
 * Erstellt die Rechnung bei Lexware und ordnet sie der Bestellung zu.
 *
 * Gilt für JEDE Bestellung vom Typ 'order' unabhängig von der Zahlungsart –
 * auch Rechnungskauf, nicht nur Karte/PayPal. Lexware wird damit das
 * führende Rechnungssystem für den gesamten verbindlichen Bestellablauf,
 * nicht nur für die neu hinzukommenden Zahlarten (siehe Migrationskommentar
 * 0026, beanspruche_rechnungserstellung).
 *
 * Claim-geschützt (beanspruche_rechnungserstellung): Ein erneut zugestellter
 * Zahlungs-Webhook oder ein nachgeholter Abschluss (holeAbschlussFuerRetryNach)
 * darf niemals eine zweite Rechnung bei Lexware anlegen. Nicht-fatal wie
 * jeder Nachbarschritt in dieser Datei – eine gespeicherte, bezahlte
 * Bestellung darf an der Rechnungserstellung nicht scheitern.
 *
 * ── Lexware ist stillgelegt, `intern` ist der Standardanbieter (Stand
 * 2026-08-18) ────────────────────────────────────────────────────────────
 * Lexware wird nicht mehr betrieben und bleibt absichtlich unkonfiguriert;
 * `waehleRechnungsAnbieter()` (lib/invoicing/registry.ts) liefert seitdem
 * standardmäßig den `intern`-Anbieter. Der Claim (unten) und die eigentliche
 * Rechnungserstellung laufen dadurch weiterhin ganz normal – nur ohne
 * externen Lexware-Aufruf, mit einer eigenen, website-internen
 * Rechnungsnummer (Migration 0028). Die lokale Buchhaltung übernimmt diese
 * Rechnung anschließend 1:1 über den separaten Integrationspunkt (GET
 * /api/accounting/v1/orders, siehe dort), sie ist bereits produktiv.
 */
async function erzeugeRechnung(
  order: OrderRecord,
  probleme: string[],
  /**
   * Wird bei Erfolg MIT den Rechnungsdaten aufgerufen, STATT dass diese
   * Funktion selbst eine eigene Rechnungs-E-Mail verschickt – so kann die
   * Bestellbestätigung (benachrichtige() unten) die fertige Rechnung in
   * DERSELBEN E-Mail mitschicken (Fund vom 2026-09-01: drei getrennte
   * E-Mails für ein einziges Ereignis wirkten wie Spam). Fehlt der
   * Callback (Cron-Nachholpfad `holeOffeneRechnungenNach`, dessen
   * Bestellbestätigung längst – ohne Rechnung – verschickt ist), verschickt
   * diese Funktion wie bisher eine eigenständige Nachtrags-E-Mail.
   */
  onErstellt?: (info: RechnungFuerEmail) => void
): Promise<boolean> {
  if (order.orderType !== 'order') return false; // Anfragen bekommen keine Rechnung
  if (!istRechnungserstellungMoeglich()) return false;

  const db = createAdminClient();
  const { data: anspruch, error: claimFehler } = await db.rpc('beanspruche_rechnungserstellung', {
    p_order_id: order.id,
  });
  if (claimFehler) {
    console.error(`[orders] Rechnungs-Anspruch für ${order.id} fehlgeschlagen:`, claimFehler.message);
    return false;
  }
  const beansprucht = Array.isArray(anspruch) ? anspruch.length > 0 : Boolean(anspruch);
  if (!beansprucht) return false; // bereits erstellt oder ein anderer Lauf ist gerade dran

  // Außerhalb des try-Blocks deklariert: Schlägt irgendetwas NACH einem
  // erfolgreichen Lexware-Aufruf fehl, muss der catch-Block das Ergebnis
  // noch sehen können – sonst geht die einzige Kennung eines bereits real,
  // irreversibel angelegten Belegs verloren und ein Retry würde bei Lexware
  // einen zweiten anlegen (siehe Review vom 2026-08-11, Orphan-Rechnung).
  let rechnung: Rechnungserstellung | undefined;

  try {
    if (!order.shipping) {
      throw new Error('Bestellung ohne Lieferadresse – Rechnungsadresse fehlt.');
    }

    // Kleinunternehmer nach § 19 UStG: niemals eine Steuer ausweisen, auch
    // wenn orders.tax_rate (pauschal 19 %, siehe Migration 0014) etwas
    // anderes sagt – das war bislang ein echter, unbemerkter Fehler auf
    // jeder erstellten Rechnung.
    const steuersatz = IST_KLEINUNTERNEHMER ? 0 : (order.taxRate ?? 19);
    const zahlungszielTage = !order.paymentMethod || order.paymentMethod === 'invoice' ? PAYMENT_TERM_DAYS : 0;

    // Positionen: der bereits validierte POSITIONSGESAMTPREIS als
    // "Einzelpreis" mit menge=1, NICHT unitPrice × echte Menge. Lexware
    // multipliziert unitPrice × quantity selbst, und unit_price ist ein auf
    // den Cent gerundeter EFFEKTIVER Stückpreis, der laut
    // Migration-0013-Kommentar (orders.ts) je nach Menge um mehrere Cent vom
    // gespeicherten Positionsgesamtpreis abweichen kann. menge=1 mit dem
    // vollen, validierten Positionspreis garantiert eine centgenaue
    // Rechnungszeile unabhängig von dieser Rundung; die tatsächliche
    // Stückzahl steht stattdessen lesbar in der Bezeichnung (siehe
    // Review-Bericht vom 2026-08-11, Punkt 4).
    const positionen = order.items.map((item) => ({
      bezeichnung: `${item.productName} · ${item.colorName} (${item.quantity}×)`,
      menge: 1,
      einzelpreisBruttoCent: Math.round(item.totalPrice * 100),
      steuersatzProzent: steuersatz,
    }));

    // Versandzeile als ECHTER REST (Gesamtbetrag minus Positionssumme), nicht
    // aus dem separat abgeleiteten order.shippingCost übernommen: So
    // summieren sich Positionen + Versand IMMER exakt auf den tatsächlich
    // autoritativen, bereits geprüften Bestellbetrag – unabhängig von jeder
    // Rundung an anderer Stelle.
    const positionenSummeCent = positionen.reduce((summe, p) => summe + p.einzelpreisBruttoCent, 0);
    const gesamtCent = Math.round(order.totalPrice * 100);
    const versandRestCent = gesamtCent - positionenSummeCent;
    const abgeleiteterVersandCent = Math.round((order.shippingCost ?? 0) * 100);

    // Reale Versandkosten sind in diesem Shop nie negativ und liegen aktuell
    // nie über ca. 12 € (config/shipping.ts) – ein Rest außerhalb dieses
    // Rahmens ist keine ungewöhnliche Versandgebühr, sondern beweist eine
    // Inkonsistenz zwischen order.totalPrice und der Summe der Positions-
    // preise (z.B. ein nicht auf Positionsebene abgebildeter Rabatt). Ein
    // solcher Rest wird NICHT mehr (wie zuvor) still auf 0 geklemmt oder nur
    // gewarnt und trotzdem verschickt – Math.max(0, …) hätte den
    // ausgewiesenen Betrag unbemerkt zu hoch ausfallen lassen, und eine reine
    // Log-Zeile verhindert nicht, dass ein inhaltlich falscher, unwiderruf-
    // licher Beleg beim Kunden landet. Stattdessen wird die Erstellung HART
    // abgebrochen, BEVOR Lexware überhaupt kontaktiert wird (rechnung bleibt
    // undefined) – der Claim wird dadurch im catch-Block unten sicher
    // freigegeben, ein korrigierter Retry ist jederzeit möglich, sobald die
    // zugrundeliegende Dateninkonsistenz behoben ist.
    const VERSANDREST_OBERGRENZE_CENT = 2000; // 20,00 € – großzügig über dem höchsten realen Satz
    if (versandRestCent < -1 || versandRestCent > VERSANDREST_OBERGRENZE_CENT) {
      throw new Error(
        `Versandrest ${versandRestCent}ct ist unplausibel (Positionssumme ${positionenSummeCent}ct, ` +
          `Bestellbetrag ${gesamtCent}ct, separat abgeleiteter Versandanteil ${abgeleiteterVersandCent}ct) – ` +
          `Rechnungserstellung abgebrochen statt eines falschen Betrags. Bestellung manuell prüfen.`
      );
    }
    if (Math.abs(versandRestCent - abgeleiteterVersandCent) > 50) {
      console.warn(
        `[orders] Rechnung ${order.id}: Versandrest (${versandRestCent}ct) weicht deutlich vom separat ` +
          `abgeleiteten Versandanteil (${abgeleiteterVersandCent}ct) ab – Positionssumme möglicherweise inkonsistent.`
      );
    }

    const auftrag: Rechnungsauftrag = {
      bestellId: order.id,
      bestellnummer: order.orderNumber,
      rechnungsdatum: new Date().toISOString().slice(0, 10),
      kaeufer: {
        name: order.contact.name,
        firma: order.contact.company,
        strasse: order.shipping.street,
        plz: order.shipping.zip,
        ort: order.shipping.city,
        land: order.shipping.country,
        ustIdNr: order.customerVatId,
      },
      positionen,
      versandkostenBruttoCent: versandRestCent,
      gesamtBruttoCent: gesamtCent,
      waehrung: 'EUR',
      zahlungszielTage,
      // Reine Closure, kein Datenbankzugriff innerhalb von lib/invoicing/
      // selbst (siehe Kopfkommentar dort und __tests__/architektur.test.ts).
      // Anbieter mit eigener Nummernvergabe (Lexware, Test) rufen das
      // schlicht nie auf.
      naechsteRechnungsnummer: () => ziehNaechsteRechnungsnummer(db, new Date().getFullYear()),
    };

    rechnung = await waehleRechnungsAnbieter().erstelle(auftrag);

    // ── KRITISCHER Punkt: Lexware hat SOEBEN einen echten, irreversiblen,
    // fortlaufend nummerierten Beleg angelegt. Ab hier darf erstelle() für
    // diese Bestellung unter keinen Umständen mehr aufgerufen werden – ein
    // zweiter Aufruf würde eine zweite echte Rechnung erzeugen. invoice_id
    // wird deshalb SOFORT und mit eigenen Wiederholungsversuchen persistiert,
    // BEVOR ein weiterer, fehleranfälliger Schritt (Upload, E-Mail) läuft.
    // Migration 0026s Freigabe-Funktionen prüfen invoice_id (nicht
    // invoice_number) – erst wenn dieser Schreibzugriff gelingt, ist der
    // Claim vor einer erneuten Freigabe sicher.
    const kritischGespeichert = await persistiereKritischMitWiederholung(db, order.id, {
      invoice_id: rechnung.rechnungsId,
      invoice_number: rechnung.rechnungsnummer,
      // Bisher nur lokale Variable (siehe oben), nie persistiert – die
      // Buchhaltungs-Synchronisierung (Schritt 6) braucht ein echtes
      // Belegdatum, kein Approximat aus dem Abrufzeitpunkt.
      invoice_date: auftrag.rechnungsdatum,
    });
    if (!kritischGespeichert) {
      // Auch mehrere Versuche sind gescheitert. Wirft bewusst weiter in den
      // catch-Block unten – dort wird der Anspruch NICHT freigegeben (siehe
      // dort), derselbe Weg wie jeder andere Fehler nach erfolgreicher
      // Rechnungserstellung.
      throw new Error(
        `Kritische Kennung (invoice_id ${rechnung.rechnungsId}) konnte nach mehreren Versuchen nicht gespeichert werden.`
      );
    }

    const pfad = `orders/${order.id}/rechnung.pdf`;
    // Wirft bei einem echten Storage-Fehler (storage.ts) – landet dann im
    // catch-Block unten wie jeder andere Fehler nach erfolgreicher
    // Rechnungserstellung (rechnung ist bereits gesetzt).
    await uploadProductionFile(pfad, rechnung.pdf, 'application/pdf');

    // accounting_ready_at markiert den frühesten sinnvollen Zeitpunkt für die
    // Buchhaltungs-Synchronisierung (Schritt 6): ab hier hat die Bestellung
    // sowohl Rechnungsnummer als auch PDF. Dient dort als monotoner Cursor,
    // weil `orders` keine generische `updated_at`-Spalte hat und `created_at`
    // nicht mit Buchhaltungsreife korreliert (eine Kartenzahlung kann Stunden
    // nach der Bestellung erst bestätigt werden).
    //
    // BEWUSST NICHT mehr Teil des Promise.all oben (Review vom 2026-08-18,
    // Punkt 2 des Sync-Audits): Ein reiner Supabase-Query-Fehler wirft NICHT
    // automatisch (createAdminClient() setzt kein throwOnError) – ungeprüft
    // wäre diese Bestellung danach für IMMER unsichtbar für die
    // Buchhaltungs-Synchronisierung UND für holeOffeneRechnungenNach (dessen
    // Filter invoice_id IS NULL hier bereits nicht mehr zutrifft), ohne jede
    // Fehlermeldung – invoice_id/invoice_number sind ja schon oben erfolgreich
    // gespeichert. Deshalb dasselbe Wiederholungsmuster wie dort.
    const accountingGespeichert = await persistiereKritischMitWiederholung(db, order.id, {
      invoice_pdf_url: pfad,
      accounting_ready_at: new Date().toISOString(),
    });
    if (!accountingGespeichert) {
      // Auch mehrere Versuche sind gescheitert. Rechnung UND PDF existieren
      // real und korrekt – nur die Buchhaltungs-Bereitschaft konnte nicht
      // vermerkt werden. rechnung_unklarer_zustand ist hierfür die richtige,
      // bereits bestehende Sperre: Sie verhindert (Migration 0026), dass der
      // Cron-Reaper oder ein Retry diese Bestellung je automatisch anfasst,
      // bis sie manuell geprüft wurde – exakt das gewünschte Verhalten, auch
      // wenn die Ursache hier eine andere ist als beim benachbarten
      // invoice_id-Rettungspfad.
      const alsUnklarMarkiert = await persistiereKritischMitWiederholung(db, order.id, {
        rechnung_unklarer_zustand: true,
      });
      await protokolliereBestellereignis({
        orderId: order.id,
        eventType: 'invoice_accounting_marking_failed',
        reason:
          `Rechnung ${rechnung.rechnungsnummer} wurde vollständig angelegt (inkl. PDF-Upload), ` +
          `accounting_ready_at konnte aber nach mehreren Versuchen nicht gesetzt werden. ` +
          (alsUnklarMarkiert
            ? 'rechnung_unklarer_zustand wurde gesetzt – manuell prüfen und die beiden Felder von Hand nachtragen.'
            : 'KRITISCH: Auch der Klärungsfall-Marker konnte nicht gespeichert werden (anhaltende ' +
              'Datenbankstörung) – dringend manuell prüfen.'),
        detail: { invoiceId: rechnung.rechnungsId, invoiceNumber: rechnung.rechnungsnummer, alsUnklarMarkiert },
      });
    }

    await protokolliereBestellereignis({
      orderId: order.id,
      eventType: 'invoice_created',
      detail: { invoiceId: rechnung.rechnungsId, invoiceNumber: rechnung.rechnungsnummer },
    });

    if (onErstellt) {
      // Regelfall: Die Bestellbestätigung (noch nicht verschickt) schickt
      // diese Rechnung selbst mit – hier NICHTS versenden, sonst bekäme die
      // Kundschaft die Rechnung doppelt (einmal hier, einmal dort).
      onErstellt({
        rechnungsnummer: rechnung.rechnungsnummer,
        rechnungsdatum: auftrag.rechnungsdatum,
        pdf: rechnung.pdf,
        zahlungszielTage,
      });
    } else {
      // Cron-Nachholpfad: Die Bestellbestätigung ist zu diesem Zeitpunkt
      // längst (ohne Rechnung) verschickt – hier bleibt nur eine
      // eigenständige Nachtrags-E-Mail.
      await sendEmail({
        to: order.contact.email,
        subject: `Rechnung ${rechnung.rechnungsnummer} zu Bestellung ${order.orderNumber}`,
        react: InvoiceEmail({
          orderNumber: order.orderNumber,
          invoiceNumber: rechnung.rechnungsnummer,
          invoiceDate: auftrag.rechnungsdatum,
        }),
        kontext: { anlass: 'invoice_created', orderId: order.id },
        attachments: [{ filename: `Rechnung-${rechnung.rechnungsnummer}.pdf`, content: rechnung.pdf }],
      }).catch(() => {});
    }

    return true;
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    console.error(`[orders] Rechnungserstellung für ${order.id} fehlgeschlagen:`, err);
    probleme.push(`Rechnung: ${text}`);

    // Lexware HAT bereits eine echte Rechnung angelegt, wenn entweder das
    // volle Ergebnis vorliegt (rechnung gesetzt, Fehler danach) ODER
    // erstelle() selbst NACH der Anlage einen RechnungsTeilerfolgFehler mit
    // den bekannten Kennungen warf (Rechnungsnummer/PDF-Abruf gescheitert).
    // In BEIDEN Fällen darf der Anspruch NICHT freigegeben werden.
    //
    // WICHTIG (Review vom 2026-08-12, zweite Runde): Es reicht NICHT, hier
    // einfach nichts zu tun. Gelingt auch der Versuch, invoice_id zu
    // speichern, nicht (persistiereKritischMitWiederholung scheitert
    // vollständig), bleibt invoice_id NULL – und ein NULL invoice_id sieht
    // für den Cron-Reaper (gib_haengende_rechnungserstellung_frei) exakt
    // gleich aus wie "Lexware nie erreicht". Ohne weitere Maßnahme WÜRDE der
    // Reaper diesen Claim nach Ablauf der Frist freigeben und einen zweiten,
    // echten Lexware-Beleg ermöglichen – das war die konkret bestätigte
    // Lücke. Deshalb: schlägt die invoice_id-Persistierung fehl, wird als
    // LETZTE Rettungsleine `rechnung_unklarer_zustand = true` gesetzt (eigener,
    // unabhängiger Schreibversuch mit minimaler Nutzlast). Dieses Flag
    // sperrt Claim UND Freigabe UND Reaper dauerhaft und wird NIE vom Code
    // zurückgesetzt – nur eine manuelle Prüfung bei Lexware kann diesen
    // Zustand auflösen.
    const teilerfolg = err instanceof RechnungsTeilerfolgFehler ? err : null;
    if (rechnung || teilerfolg) {
      const rechnungsId = rechnung?.rechnungsId ?? teilerfolg!.rechnungsId;
      const rechnungsnummer = rechnung?.rechnungsnummer ?? teilerfolg?.rechnungsnummer ?? null;
      const kritischGespeichert = await persistiereKritischMitWiederholung(db, order.id, {
        invoice_id: rechnungsId,
        invoice_number: rechnungsnummer,
      });
      // invoice_id ist bereits der stärkste Schutz (Claim/Reaper prüfen es
      // direkt) – das Flag wird nur versucht, wenn selbst DAS gescheitert
      // ist. `null` statt `false`, damit das Protokoll unten nicht
      // fälschlich "Flag gesetzt" suggeriert, wenn es schlicht nicht nötig war.
      const alsUnklarMarkiert = kritischGespeichert
        ? null
        : await persistiereKritischMitWiederholung(db, order.id, { rechnung_unklarer_zustand: true });
      await protokolliereBestellereignis({
        orderId: order.id,
        eventType: 'invoice_creation_partial_failure',
        reason:
          `Lexware-Rechnung ${rechnungsId}${rechnungsnummer ? ` (Nr. ${rechnungsnummer})` : ''} wurde ` +
          `angelegt, ein nachgelagerter Schritt ist aber fehlgeschlagen: ${text}. ` +
          (kritischGespeichert
            ? 'Die Kennung wurde gespeichert, der Anspruch bleibt bewusst gehalten – manuell prüfen ' +
              '(PDF/E-Mail ggf. nachholen), NICHT automatisch erneut versuchen.'
            : alsUnklarMarkiert
              ? 'Die Kennung konnte NICHT gespeichert werden, aber der Klärungsfall-Marker (rechnung_unklarer_zustand) ' +
                'wurde gesetzt – der Anspruch bleibt dauerhaft gehalten, auch über den Cron-Reaper hinaus. ' +
                'Manuell bei Lexware anhand der Bestellnummer suchen und den Datensatz von Hand vervollständigen.'
              : 'KRITISCH: WEDER die Kennung NOCH der Klärungsfall-Marker konnten gespeichert werden ' +
                '(anhaltende Datenbankstörung). Der Anspruch bleibt in dieser Anfrage zwar gehalten, könnte aber ' +
                'vom Cron-Reaper nach Ablauf der Frist fälschlich freigegeben werden. Dringend SOFORT manuell ' +
                'prüfen: bei Lexware anhand der Bestellnummer suchen und rechnung_unklarer_zustand von Hand in ' +
                'der Datenbank setzen.'),
        detail: { invoiceId: rechnungsId, invoiceNumber: rechnungsnummer, kritischGespeichert, alsUnklarMarkiert },
      });
      return false;
    }

    // Kein Ergebnis und kein Teilerfolg bekannt: Lexware wurde entweder nie
    // erreicht oder hat geworfen, BEVOR irgendein Beleg entstand (z.B.
    // Netzwerkfehler vor der Antwort, fehlende Lieferadresse) – dann ist
    // nichts Externes entstanden, und die Freigabe ist sicher.
    await db.rpc('gib_rechnungserstellung_frei', { p_order_id: order.id });
    await protokolliereBestellereignis({
      orderId: order.id,
      eventType: 'invoice_creation_failed',
      reason: text,
    });
    return false;
  }
}

/**
 * Stößt die Kommunikation an (Bestätigung an die Kundschaft, interne
 * Meldung). Die Fachlichkeit liegt vollständig in `orderIntake`.
 */
async function benachrichtige(
  order: OrderRecord,
  signierteUrl: string | null,
  probleme: string[],
  rechnung: RechnungFuerEmail | null
): Promise<boolean> {
  try {
    // `verarbeiteBestelleingang` wirft nicht; das try/catch bleibt als letzte
    // Sicherung, damit die Bestellung unter keinen Umständen an der
    // Kommunikation scheitert.
    await verarbeiteBestelleingang(order, signierteUrl, rechnung);
    return true;
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    console.error('[orders] Bestelleingang-Kommunikation fehlgeschlagen (nicht-fatal):', err);
    probleme.push(`Kommunikation: ${text}`);
    return false;
  }
}
