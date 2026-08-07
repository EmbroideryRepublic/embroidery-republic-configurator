'use server';

import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { uploadProductionFile } from '@/lib/supabase/storage';
import { istSicherePfadkomponente } from '@/lib/upload/pruefeUpload';
import { meldeEreignis } from '@/lib/observability/ereignis';
import { merkeBestellung } from '@/lib/observability/kontext';
import { anfangsZahlungsstatus, brauchtVorabZahlung } from '@/config/zahlung';
import { pruefeRateLimit } from '@/lib/security/rateLimit';
import { validateSubmission } from '@/lib/orders/orderValidation';
// Phase 2 des Bestelleingangs – Rendering, Produktionsblatt, Benachrichtigung.
import { schliesseBestellungAb } from '@/lib/orders/orderCompletion';
import { getProduct } from '@/config/products';
import type { CartItem, ConfigElement } from '@/types';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { priceCart, priceClaimDeviation, type ServerItemPrice } from '@/lib/pricing/serverPricing';
import type { OrderElementRecord, OrderItemRecord, OrderPaymentMethod, OrderRecord } from '@/lib/actions/orderTypes';
import { formatiereGeld } from '@/lib/format';
import { aktuellerKunde } from '@/lib/account/session';
import { ladeProfil as ladeProfilDb } from '@/lib/account/data';

export interface SubmitResult {
  success: boolean;
  orderNumber?: string;
  error?: string;
  /** Nur gesetzt, wenn die Zahlung über Stripe Checkout abgewickelt werden
   *  muss (card/paypal) – der Client leitet dann per Full-Page-Redirect
   *  dorthin weiter, statt sofort eine Erfolgsmeldung zu zeigen. */
  checkoutUrl?: string;
}

interface CheckoutContact {
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phone?: string;
}

interface CheckoutShipping {
  street: string;
  zip: string;
  city: string;
  country: string;
}

export interface SubmitOrderInput {
  items: CartItem[];
  contact: CheckoutContact;
  shipping: CheckoutShipping;
  paymentMethod: OrderPaymentMethod;
  /**
   * Zustimmung zu AGB und Datenschutzerklärung. Der Client prüft das bereits
   * vor dem Absenden – hier zusätzlich serverseitig erzwungen
   * (validateSubmission), damit eine Bestellung ohne Zustimmung nicht allein
   * durch einen manipulierten oder älteren Client zustande kommt.
   */
  acceptedTerms: boolean;
  /**
   * Kennung DIESES Absendevorgangs, im Browser erzeugt und über alle
   * Wiederholungen hinweg unverändert. Verhindert, dass Doppelklick,
   * Zeitüberschreitung oder ein wiederholter Request eine zweite Bestellung
   * erzeugen (siehe Migration 0011). Fehlt sie, wird ohne Doppelschutz
   * gespeichert – ältere Clients bleiben damit funktionsfähig.
   */
  clientRequestId?: string;
}

interface InquiryContact {
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
}

export interface SubmitInquiryInput {
  items: CartItem[];
  contact: InquiryContact;
  message?: string;
  /** Siehe SubmitOrderInput.clientRequestId. */
  clientRequestId?: string;
}

/** Wandelt ein rohes ConfigElement (inkl. UI-Feldern wie isOutOfBounds)
 *  in den schlanken Produktions-Schnappschuss um, der PDF und E-Mail
 *  gemeinsam nutzen. Logo-Dateien werden dabei in Storage hochgeladen –
 *  `logoStoragePath` zeigt danach auf die dauerhaft gespeicherte Datei
 *  statt auf die (nur im Browser gültige) Data-URL. */
async function buildElementRecord(element: ConfigElement, orderId: string, itemIndex: number): Promise<OrderElementRecord> {
  const base = {
    view: element.view,
    xCm: element.xCm,
    yCm: element.yCm,
    widthCm: element.widthCm,
    heightCm: element.heightCm,
    rotationDeg: element.rotationDeg,
  };

  if (element.type === 'text') {
    return {
      ...base,
      type: 'text',
      content: element.content,
      fontFamily: element.fontFamily,
      fontSizePx: element.fontSizePx,
      color: element.color,
      bold: element.bold,
      italic: element.italic,
      align: element.align,
      letterSpacing: element.letterSpacing,
      lineHeight: element.lineHeight,
      hasShadow: element.hasShadow,
      hasOutline: element.hasOutline,
      outlineColor: element.outlineColor,
    };
  }

  // Zwei Versionen hochladen: die Originaldatei (vor Hintergrundentfernung,
  // Archiv/Referenz für die Werkstatt) UND die tatsächlich angezeigte/
  // verwendete Version (ggf. freigestellt) – Letztere ist die, die das
  // Druckvorschau-Rendering (Phase 2, src/lib/rendering/) verwendet, da sie
  // exakt dem entspricht, was der Kunde im Editor gesehen hat.
  // Die Element-ID stammt vom Client und geht in den Speicherpfad ein. Ohne
  // Prüfung könnte ein Wert wie `../../fremde-bestellung` den Ordner dieser
  // Bestellung verlassen.
  //
  // Der Speicher weist solche Pfade ohnehin ab (istSichererSpeicherpfad in
  // storage.ts). Hier wird zusätzlich an der Quelle geprüft: Der Fehler
  // benennt dann die Ursache, statt erst tief im Upload aufzutreten.
  if (!istSicherePfadkomponente(element.id)) {
    throw new Error(`Ungültige Element-Kennung: ${JSON.stringify(element.id)}`);
  }

  const originalPath = `orders/${orderId}/item-${itemIndex}-logo-${element.id}-original.png`;
  const displayPath = `orders/${orderId}/item-${itemIndex}-logo-${element.id}-display.png`;
  // Beide Uploads sind voneinander unabhängig → parallel statt nacheinander.
  await Promise.all([
    uploadProductionFile(originalPath, element.originalFileUrl),
    uploadProductionFile(displayPath, element.fileUrl),
  ]);

  return {
    ...base,
    type: 'logo',
    fileName: element.fileName,
    logoStoragePath: originalPath,
    logoDisplayStoragePath: displayPath,
  };
}

async function buildItemRecords(
  items: CartItem[],
  orderId: string,
  serverPrices: ServerItemPrice[]
): Promise<OrderItemRecord[]> {
  return Promise.all(
    items.map(async (item, itemIndex) => {
      const product = getProduct(item.productId);
      const color = product?.colors.find((c) => c.id === item.colorId);
      const elements = await Promise.all(item.elements.map((el) => buildElementRecord(el, orderId, itemIndex)));
      // AUSSCHLIESSLICH serverseitig berechnete Preise/Menge – der Client-Preis
      // (item.unitPrice/totalPrice/quantity) wird bewusst NICHT übernommen.
      const priced = serverPrices[itemIndex];

      return {
        productId: item.productId,
        colorId: item.colorId,
        productName: product?.name ?? item.productId,
        colorName: color?.name ?? item.colorId,
        printMethod: item.printMethod,
        sizeQuantities: item.sizeQuantities,
        quantity: priced?.quantity ?? 0,
        unitPrice: priced?.unitPrice ?? 0,
        totalPrice: priced?.totalPrice ?? 0,
        elements,
      } satisfies OrderItemRecord;
    })
  );
}

/**
 * Sucht eine bereits gespeicherte Bestellung zur Absendekennung.
 *
 * Gibt die Bestell-ID zurück oder null. Ein Lesefehler wird bewusst wie
 * "nicht gefunden" behandelt: dann greift immer noch der eindeutige Index
 * beim Insert. Ein Doppelschutz darf nie selbst zum Grund werden, warum eine
 * Bestellung scheitert.
 */
async function findeBestellungZuKennung(
  supabase: ReturnType<typeof createAdminClient>,
  clientRequestId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('client_request_id', clientRequestId)
    .maybeSingle();

  if (error) {
    console.warn('[orders] Prüfung auf wiederholte Absendung fehlgeschlagen (fahre fort):', error);
    return null;
  }
  return (data?.id as string | undefined) ?? null;
}

/** Dünner Wrapper um persistAndNotifyCore: fängt WIRKLICH alles ab,
 *  inklusive synchroner Throws (z.B. createAdminClient() wirft sofort, wenn
 *  NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SECRET_KEY fehlen – beobachtet beim
 *  ersten Testlauf ohne echte Zugangsdaten). Ohne diesen äußeren try/catch
 *  bubbelt der Fehler bis zur Server-Action-Grenze hoch und reißt beim
 *  Client die gesamte Warenkorb-Ansicht ab, statt nur die Fehlermeldung
 *  im Formular anzuzeigen. */
async function persistAndNotify(params: Parameters<typeof persistAndNotifyCore>[0]): Promise<SubmitResult> {
  try {
    return await persistAndNotifyCore(params);
  } catch (err) {
    console.error('[orders] Unerwarteter Fehler bei der Bestellverarbeitung:', err);
    return { success: false, error: 'Da ist etwas schiefgelaufen. Bitte versuchen Sie es in ein paar Minuten erneut.' };
  }
}

/** Persistiert eine Bestellung/Anfrage in orders/order_items/
 *  configuration_elements, lädt Original-Logodateien + Produktionsblatt
 *  in Storage hoch und verschickt Bestätigungs-/interne Benachrichtigungs-
 *  Mail. */
async function persistAndNotifyCore(params: {
  orderType: 'order' | 'inquiry';
  customerName: string;
  company?: string;
  email: string;
  phone?: string;
  message?: string;
  items: CartItem[];
  shipping?: CheckoutShipping;
  paymentMethod?: OrderPaymentMethod;
  acceptedTerms?: boolean;
  clientRequestId?: string;
}): Promise<SubmitResult> {
  // ── VOLLSTÄNDIGE PRÜFUNG DER ÜBERMITTELTEN ANGABEN ──────────────────────
  // Produkt, Farbe, Größen, Mengen, Motivmaße und Kontaktdaten werden gegen
  // den Katalog geprüft, BEVOR irgendetwas berechnet oder gespeichert wird
  // (lib/orders/orderValidation.ts). Keine dieser Angaben wird ungeprüft
  // übernommen – auch dann nicht, wenn der Preis am Ende plausibel wirkt.
  // Bewusst noch ohne Datenbankzugriff: fachliche Fehler sollen gemeldet
  // werden, ohne dass eine Verbindung nötig ist.
  const validierung = await validateSubmission({
    orderType: params.orderType,
    items: params.items,
    email: params.email,
    customerName: params.customerName,
    shipping: params.shipping,
    acceptedTerms: params.acceptedTerms,
  });
  if (!validierung.valid) {
    console.warn(
      '[orders] Bestelleingang abgelehnt:',
      validierung.issues.map((i) => `${i.code}${i.itemId ? ` (${i.itemId})` : ''}`).join(', ')
    );
    return { success: false, error: validierung.customerMessage };
  }

  // ── AUTORITATIVE, serverseitige Preisberechnung ─────────────────────────
  // Der vom Client übermittelte Preis wird NIE gespeichert. Menge und Preis
  // werden ausschließlich aus Katalog (basePrice) + Konfiguration (Elemente,
  // Größen, Veredelung) neu berechnet (serverPricing.ts). Ein manipulierter
  // Client-Preis ist damit wirkungslos; er wird nur zur Prüfung protokolliert.
  // Versand wird ebenfalls serverseitig aus Lieferland + Warenwert ermittelt
  // (config/shipping.ts). Bei Anfragen ohne Lieferadresse entfällt er.
  const pricing = await priceCart(params.items, params.shipping?.country);

  const clientClaimedTotal = params.items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
  const deviation = priceClaimDeviation(clientClaimedTotal, pricing.totalPrice);
  if (deviation > 0.01) {
    console.warn(
      `[orders] Client-Preis weicht ab (Serverpreis wird verwendet): behauptet ` +
        `${formatiereGeld(clientClaimedTotal)}, serverseitig ${formatiereGeld(pricing.totalPrice)} (Δ ${formatiereGeld(deviation)}).`
    );
  }

  // Unbekanntes Produkt in einer ECHTEN Bestellung = nicht bepreisbar und
  // damit nicht vertrauenswürdig → ablehnen (bei Anfragen tolerieren).
  if (params.orderType === 'order' && pricing.unpriceable.length > 0) {
    console.warn('[orders] Nicht bepreisbare Produkte in Bestellung abgelehnt:', pricing.unpriceable);
    return { success: false, error: 'Mindestens ein Produkt ist ungültig. Bitte den Warenkorb neu zusammenstellen.' };
  }

  // Kein hinterlegter Versandtarif für das Lieferland → Bestellung ablehnen,
  // statt stillschweigend 0 € Versand zu berechnen.
  if (params.orderType === 'order' && pricing.shippingUnavailable) {
    console.warn('[orders] Bestellung ohne Versandtarif abgelehnt:', params.shipping?.country);
    return {
      success: false,
      error:
        'Für das gewählte Lieferland ist noch kein Versand hinterlegt. Bitte kontaktieren Sie uns – wir erstellen Ihnen ein individuelles Angebot.',
    };
  }

  // ── KEINE BESTELLUNG AUF EINEM UNSICHEREN PREIS ─────────────────────────
  // Die Preispipeline meldet selbst, wenn ihr Ergebnis nicht belastbar ist
  // (`blocked`) – etwa bei einem unbekannten Preisbaustein im Produktivbetrieb,
  // einem nicht einlösbaren Gutschein oder einem unterschrittenen
  // Mindestbestellwert. Das ist der Kern des Grundsatzes „blockieren statt
  // raten": lieber keine Bestellung als eine zu einem Betrag, für den wir
  // nicht einstehen können. Der Kundschaft wird bewusst nicht die technische
  // Ursache gezeigt, sondern ein Weg zu uns.
  if (params.orderType === 'order' && pricing.blocked) {
    console.error('[orders] Bestellung wegen nicht belastbarer Preisberechnung abgelehnt:', pricing.issues);
    return {
      success: false,
      error:
        'Der Gesamtpreis konnte für diese Zusammenstellung nicht verbindlich ermittelt werden. ' +
        'Bitte kontaktieren Sie uns kurz – wir klären das und schließen Ihre Bestellung persönlich ab.',
    };
  }

  // Sicherheitsnetz: Eine echte Bestellung ohne Stückzahl oder ohne Betrag
  // ist immer ein Fehler, egal woher er kommt. Die Validierung oben schließt
  // das bereits aus – diese Prüfung steht direkt vor dem Speichern und würde
  // auch eine künftige Lücke davor abfangen.
  if (params.orderType === 'order' && (pricing.totalQuantity <= 0 || !(pricing.totalPrice > 0))) {
    console.error('[orders] Bestellung mit unplausibler Menge/Summe abgelehnt:', {
      menge: pricing.totalQuantity,
      summe: pricing.totalPrice,
    });
    return { success: false, error: 'Ihre Bestellung konnte nicht berechnet werden. Bitte stellen Sie den Warenkorb neu zusammen.' };
  }

  // Admin-Client (Service Role) statt des Publishable-Keys: dieser Code läuft
  // ausschließlich serverseitig in einer Server Action, nie im Browser. Mit
  // dem Publishable-Key schlägt `.select()` nach dem Insert fehl, weil RLS
  // für "orders"/"order_items" nur eine INSERT-Policy kennt – für das
  // RETURNING der eingefügten Zeile braucht Postgres zusätzlich eine
  // SELECT-Policy. Eine öffentliche SELECT-Policy würde aber allen
  // Kunden-PII-Daten für jeden mit dem Publishable-Key offenlegen, daher
  // hier bewusst der Service-Role-Client (umgeht RLS vollständig).
  const supabase = createAdminClient();

  // ── DOPPELSCHUTZ, ERSTER RIEGEL: bereits abgesendet? ────────────────────
  // Deckt den häufigen Fall ab: die erste Absendung war erfolgreich, aber die
  // Antwort kam nicht an (Verbindungsabbruch, Zeitüberschreitung, Neuladen).
  // Der Browser wiederholt mit derselben Kennung – wir geben die BESTEHENDE
  // Bestellnummer zurück, statt eine zweite Bestellung anzulegen.
  if (params.clientRequestId) {
    const bestehende = await findeBestellungZuKennung(supabase, params.clientRequestId);
    if (bestehende) {
      console.info('[orders] Wiederholte Absendung erkannt – bestehende Bestellung zurückgegeben:', bestehende);
      return { success: true, orderNumber: buildOrderNumber(bestehende) };
    }
  }

  // ── PHASE 1a: Dateien ablegen – VOR der Transaktion ─────────────────
  //
  // Die Bestellkennung wird hier erzeugt und nicht von der Datenbank
  // vergeben. Nur so können die Logodateien bereits unter ihrem endgültigen
  // Pfad liegen, bevor die Transaktion beginnt.
  //
  // Warum Uploads NICHT in die Transaktion gehören: Sie sind externe
  // Wirkungen auf einen fremden Dienst und lassen sich nicht zurückrollen.
  // Eine offene Datenbanktransaktion, die auf einen Netzwerkaufruf wartet,
  // hält Sperren und Verbindungen – unter Last der nächste Ausfall.
  //
  // Schlägt ein Upload fehl, bricht der Vorgang hier ab. In der Datenbank ist
  // dann noch nichts entstanden – der sauberste denkbare Zustand. Gelingt der
  // Upload und die Transaktion scheitert danach, bleiben verwaiste Dateien im
  // Speicher zurück: kein Datenverlust, kein falscher Zustand, nur belegter
  // Platz. Ein späterer Aufräumlauf kann sie anhand fehlender Bestellungen
  // erkennen.
  const orderId = randomUUID();
  const orderNumber = buildOrderNumber(orderId);

  let itemRecords;
  try {
    itemRecords = await buildItemRecords(params.items, orderId, pricing.items);
  } catch (fehler) {
    await meldeEreignis({
      schwere: 'ERROR',
      kategorie: 'UPLOAD',
      ereignis: 'ablage_fehlgeschlagen',
      fehler,
    });
    return {
      success: false,
      error: 'Ihre Motivdateien konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.',
    };
  }

  // ── PHASE 1b: EINE Transaktion für die gesamte Bestellung ───────────
  //
  // Bestellung, Positionen und Konfigurationselemente entstehen gemeinsam
  // oder gar nicht (Migration 0015). Vorher waren es drei getrennte Aufrufe:
  // Brach der zweite oder dritte ab, blieb ein Torso zurück – und die
  // Idempotenzsperre gab diesen Torso beim nächsten Versuch als Erfolg aus.
  // Additiv (Kundenkonto, Migration 0023): War beim Absenden eine Sitzung
  // aktiv, wird die Bestellung verknüpft (orders.customer_id). Ohne Sitzung
  // bleibt sie null – der Gastkauf ist davon in keiner Weise betroffen, das
  // ist reine Zusatzinformation für die Konto-Bestellhistorie.
  const kunde = await aktuellerKunde();

  // Die USt-IdNr. kommt AUSSCHLIESSLICH aus dem serverseitig geladenen Profil
  // der gerade angemeldeten Person, NIE aus einer Client-Angabe (dieselbe
  // Server-ist-Wahrheit wie beim Preis) – ein Gast ohne Sitzung hat kein
  // Profil und damit hier immer null. Als Schnappschuss in orders.customer_vat_id
  // gespeichert (Migration 0025): ändert sich das Profil später, bleibt die
  // auf dieser Bestellung ausgewiesene Nummer unverändert.
  const vatId = kunde ? (await ladeProfilDb(kunde.id, kunde.email))?.vatId ?? null : null;

  const orderPayload = {
    id: orderId,
    customer_id: kunde?.id ?? null,
    customer_vat_id: vatId,
    customer_name: params.customerName,
    company: params.company ?? null,
    email: params.email,
    phone: params.phone ?? null,
    message: params.message ?? null,
    order_type: params.orderType,
    quantity: pricing.totalQuantity,
    total_price: pricing.totalPrice,
    // Steuer zum KAUFZEITPUNKT festhalten: Eine spätere Satzänderung darf
    // diese Bestellung nicht mehr berühren (Migration 0014).
    tax_rate: pricing.taxRate,
    tax_amount: pricing.taxAmount,
    net_total: pricing.netTotal,
    prices_include_tax: true,
    shipping_street: params.shipping?.street ?? null,
    shipping_zip: params.shipping?.zip ?? null,
    shipping_city: params.shipping?.city ?? null,
    shipping_country: params.shipping?.country ?? null,
    client_request_id: params.clientRequestId ?? null,
    // Ohne die Zahlungsart kann später weder der Adminbereich noch eine
    // Erstattung entscheiden, wie zu verfahren ist. Anfragen haben keine
    // und bleiben bewusst leer.
    payment_method: params.paymentMethod ?? null,
    // Zahlungsstatus von der Zahlungsart abgeleitet: Rechnungskauf braucht
    // keine Vorabzahlung (not_required), Karte/PayPal warten auf die
    // Bestätigung (pending). Bestimmt, ob Phase 2 sofort läuft.
    payment_status: params.paymentMethod ? anfangsZahlungsstatus(params.paymentMethod) : 'not_required',
    // Zeitpunkt der bestätigten AGB-/Datenschutz-Zustimmung, unverändert aus
    // validateSubmission übernommen (Migration 0025) – nicht hier neu
    // berechnet, siehe orderValidation.ts. null bei Anfragen, die keine
    // Zustimmung verlangen.
    terms_accepted_at: validierung.termsAcceptedAt ?? null,
  };

  const itemsPayload = params.items.map((item, i) => ({
    product_id: item.productId,
    product_name: itemRecords[i]?.productName ?? item.productId,
    color_id: item.colorId,
    color_name: itemRecords[i]?.colorName ?? item.colorId,
    print_method: item.printMethod,
    size_quantities: item.sizeQuantities,
    // Serverseitig berechnete Menge/Preis (nie der Client-Wert).
    quantity: pricing.items[i]?.quantity ?? 0,
    unit_price: pricing.items[i]?.unitPrice ?? 0,
    // Der Positionsgesamtpreis wird GESPEICHERT, nicht abgeleitet: `unit_price`
    // ist der auf Cent gerundete effektive Stückpreis, `unit_price × quantity`
    // weicht deshalb je nach Menge um mehrere Cent ab (siehe Migration 0013).
    total_price: pricing.items[i]?.totalPrice ?? 0,
    tax_rate: pricing.taxRate,
    net_total_price: Math.round(((pricing.items[i]?.totalPrice ?? 0) / (1 + pricing.taxRate / 100)) * 100) / 100,
    elements: (itemRecords[i]?.elements ?? []).map((el) => ({
      element_type: el.type,
      view: el.view,
      x_cm: el.xCm,
      y_cm: el.yCm,
      width_cm: el.widthCm,
      height_cm: el.heightCm,
      rotation_deg: el.rotationDeg,
      original_file_url: el.logoStoragePath ?? null,
      display_file_url: el.logoDisplayStoragePath ?? null,
      file_name: el.fileName ?? null,
      text_content: el.content ?? null,
      font_family: el.fontFamily ?? null,
      font_size: el.fontSizePx ?? null,
      font_color: el.color ?? null,
      font_weight: el.bold ? 'bold' : null,
      font_style: el.italic ? 'italic' : null,
      text_align: el.align ?? null,
      letter_spacing: el.letterSpacing ?? null,
      line_height: el.lineHeight ?? null,
      has_shadow: el.hasShadow ?? false,
      has_outline: el.hasOutline ?? false,
      outline_color: el.outlineColor ?? null,
    })),
  }));

  const { data: rpcRows, error: transaktionsFehler } = await supabase.rpc('create_order_atomic', {
    p_order: orderPayload,
    p_items: itemsPayload,
  });

  if (transaktionsFehler) {
    // ── DOPPELSCHUTZ, ZWEITER RIEGEL: gleichzeitige Absendung ────────────
    // Zwischen der Prüfung oben und dieser Transaktion liegt immer eine
    // Lücke. Bei zwei echt gleichzeitigen Anfragen gewinnt eine, die andere
    // läuft in den eindeutigen Index aus Migration 0011 (Code 23505).
    //
    // Seit die Bestellung atomar entsteht, ist dieser Riegel verlässlich:
    // Die zweite Anfrage blockiert am Index, bis die erste abgeschlossen
    // ist, und sieht danach entweder eine VOLLSTÄNDIGE Bestellung oder gar
    // keine. Ein Zwischenzustand ist nicht mehr beobachtbar.
    const code = (transaktionsFehler as { code?: string }).code;
    if (params.clientRequestId && code === '23505') {
      const bestehende = await findeBestellungZuKennung(supabase, params.clientRequestId);
      if (bestehende) {
        console.info('[orders] Gleichzeitige Doppelabsendung abgefangen:', bestehende);
        return { success: true, orderNumber: buildOrderNumber(bestehende) };
      }
    }
    await meldeEreignis({
      schwere: 'CRITICAL',
      kategorie: 'ORDER',
      ereignis: 'transaktion_fehlgeschlagen',
      meldung: transaktionsFehler.message,
      felder: { code, positionen: itemsPayload.length },
    });
    return { success: false, error: 'Die Bestellung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.' };
  }

  const angelegt = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
  if (!angelegt?.order_id) {
    // Kein Fehler, aber auch kein Ergebnis: Ein solcher Zustand darf nicht
    // als Erfolg durchgehen, sonst wird eine nicht existierende Bestellung
    // bestätigt.
    await meldeEreignis({
      schwere: 'CRITICAL',
      kategorie: 'ORDER',
      ereignis: 'transaktion_ohne_ergebnis',
      meldung: 'Die Transaktion meldete keinen Fehler, lieferte aber keine Bestellkennung.',
    });
    return { success: false, error: 'Die Bestellung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.' };
  }

  // ── ENDE PHASE 1: die Bestellung EXISTIERT ──────────────────────────
  // Alles bis hierher macht die Bestellung vollständig und belastbar:
  // geprüft, bepreist, gespeichert, Logodateien abgelegt.
  const order: OrderRecord = {
    id: orderId,
    orderNumber,
    orderType: params.orderType,
    createdAt: (angelegt.order_created_at as string) ?? new Date().toISOString(),
    contact: { name: params.customerName, company: params.company, email: params.email, phone: params.phone },
    shipping: params.shipping,
    paymentMethod: params.paymentMethod,
    message: params.message,
    subtotal: pricing.subtotal,
    shippingCost: pricing.shippingCost,
    totalPrice: pricing.totalPrice,
    taxAmount: pricing.taxAmount,
    taxRate: pricing.taxRate,
    netTotal: pricing.netTotal,
    items: itemRecords,
  };

  // ── PHASE 2: abschließen – NUR ohne Vorabzahlung ────────────────────
  // Druckvorschauen, Produktionsblatt und Benachrichtigungen – die teuren
  // und die nach außen sichtbaren Schritte (lib/orders/orderCompletion.ts).
  //
  // Die Weiche: Braucht die Zahlungsart eine Vorabzahlung (Karte, PayPal),
  // läuft Phase 2 NICHT hier, sondern erst nach der Bestätigung durch den
  // Zahlungs-Webhook (paymentService.ts). Für einen abgebrochenen
  // Bezahlvorgang soll weder gerendert noch eine Bestätigung verschickt
  // werden. Beim Rechnungskauf (not_required) folgt Phase 2 wie bisher
  // unmittelbar.
  //
  // Anfragen (order_type 'inquiry') haben keine Zahlungsart und werden wie
  // Rechnungskauf behandelt.
  const vorabZahlung = params.paymentMethod ? brauchtVorabZahlung(params.paymentMethod) : false;

  if (vorabZahlung) {
    // Die Bestellung existiert und ist 'pending'. Der Aufrufer startet als
    // Nächstes die Zahlung; Phase 2 wartet auf den Webhook.
    return { success: true, orderNumber };
  }

  // Die Funktion wirft nicht – sie berichtet. Eine gespeicherte Bestellung
  // darf an dieser Stelle nicht mehr scheitern.
  const abschluss = await schliesseBestellungAb(order);
  if (abschluss.probleme.length > 0) {
    console.warn(`[orders] Abschluss ${orderNumber} mit Einschränkungen:`, abschluss.probleme);
  }

  // BEWUSST KEINE Lieferanten-Einreihung an dieser Stelle.
  //
  // Während der Stornofrist darf kein Lieferantenprozess beginnen: Der Kunde
  // kann die Bestellung noch selbst stornieren, und für eine stornierte
  // Bestellung soll gar kein Lieferantenauftrag entstehen – so muss auch
  // nichts nachträglich aufgeräumt werden.
  //
  // Der Auftrag entsteht stattdessen bedarfsgerecht, sobald der Betreiber die
  // Bestellung im Adminbereich öffnet. Das ist frühestens nach Fristablauf
  // möglich (siehe lib/orders/orderVisibility), womit die Reihenfolge ohne
  // Scheduler und ohne Hintergrundjob garantiert ist.

  return { success: true, orderNumber };
}

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitResult> {
  // Der teuerste Pfad des Systems: Datei-Uploads, Vorschau-Rendering,
  // Produktionsblatt und zwei E-Mails je Vorgang. Ohne Begrenzung kann ein
  // Skript beliebig viele davon auslösen.
  //
  // Gegen versehentliche Doppelbestellungen schützt die Idempotenz – hier
  // geht es allein um Missbrauch.
  const grenze = await pruefeRateLimit('bestellung');
  if (!grenze.erlaubt) {
    return { success: false, error: grenze.meldung };
  }

  const customerName = `${input.contact.firstName} ${input.contact.lastName}`.trim();

  // Menge + Preis werden serverseitig in persistAndNotifyCore aus Katalog +
  // Konfiguration berechnet, die Pflichtfelder dort geprüft (validateSubmission)
  // – hier bewusst NICHTS aus dem Client übernehmen und nichts doppelt prüfen.
  return persistAndNotify({
    orderType: 'order',
    customerName,
    company: input.contact.companyName || undefined,
    email: input.contact.email,
    phone: input.contact.phone || undefined,
    items: input.items,
    shipping: input.shipping,
    paymentMethod: input.paymentMethod,
    acceptedTerms: input.acceptedTerms,
    clientRequestId: input.clientRequestId,
  });
}

export async function submitInquiry(input: SubmitInquiryInput): Promise<SubmitResult> {
  // Eigenes, höheres Limit: unverbindlich, kein Zahlungsvorgang, im Ablauf
  // günstiger als eine Bestellung.
  const grenze = await pruefeRateLimit('anfrage');
  if (!grenze.erlaubt) {
    return { success: false, error: grenze.meldung };
  }

  // Menge + Preis serverseitig (persistAndNotifyCore) – kein Client-Wert.
  // Die Pflichtfeldprüfung liegt ebenfalls dort (validateSubmission).
  return persistAndNotify({
    orderType: 'inquiry',
    customerName: input.contact.name,
    company: input.contact.companyName || undefined,
    email: input.contact.email,
    phone: input.contact.phone || undefined,
    message: input.message || undefined,
    items: input.items,
    clientRequestId: input.clientRequestId,
  });
}
