'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { uploadProductionFile, getProductionFileSignedUrl } from '@/lib/supabase/storage';
import { renderProductionSheet } from '@/lib/production/buildProductionSheet';
import { sendOrderConfirmationEmail, sendInternalOrderNotificationEmail } from '@/lib/email/orderEmails';
import { renderPrintView } from '@/lib/rendering/renderPrintView';
import { toRenderableElement } from '@/lib/rendering/mapOrderElements';
import { getProduct } from '@/config/products';
import type { CartItem, ConfigElement, PrintView } from '@/types';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { priceCart, priceClaimDeviation, type ServerItemPrice } from '@/lib/pricing/serverPricing';
import { enqueueSupplierOrdersForOrder } from '@/lib/suppliers/lifecycle/enqueue';
import type { OrderElementRecord, OrderItemRecord, OrderPaymentMethod, OrderRecord } from '@/lib/actions/orderTypes';

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
}): Promise<SubmitResult> {
  // Eine echte Bestellung braucht mindestens eine Position; eine
  // unverbindliche Anfrage darf bewusst auch ohne Warenkorb-Inhalt
  // gesendet werden (siehe InquiryForm in CartDrawer.tsx).
  if (params.orderType === 'order' && params.items.length === 0) {
    return { success: false, error: 'Der Warenkorb ist leer.' };
  }
  if (!params.email.includes('@')) {
    return { success: false, error: 'Bitte eine gültige E-Mail-Adresse angeben.' };
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
        `${clientClaimedTotal.toFixed(2)} €, serverseitig ${pricing.totalPrice.toFixed(2)} € (Δ ${deviation.toFixed(2)} €).`
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

  // Admin-Client (Service Role) statt des Publishable-Keys: dieser Code läuft
  // ausschließlich serverseitig in einer Server Action, nie im Browser. Mit
  // dem Publishable-Key schlägt `.select()` nach dem Insert fehl, weil RLS
  // für "orders"/"order_items" nur eine INSERT-Policy kennt – für das
  // RETURNING der eingefügten Zeile braucht Postgres zusätzlich eine
  // SELECT-Policy. Eine öffentliche SELECT-Policy würde aber allen
  // Kunden-PII-Daten für jeden mit dem Publishable-Key offenlegen, daher
  // hier bewusst der Service-Role-Client (umgeht RLS vollständig).
  const supabase = createAdminClient();

  const { data: orderRow, error: insertOrderError } = await supabase
    .from('orders')
    .insert({
      customer_name: params.customerName,
      company: params.company ?? null,
      email: params.email,
      phone: params.phone ?? null,
      message: params.message ?? null,
      order_type: params.orderType,
      quantity: pricing.totalQuantity,
      total_price: pricing.totalPrice,
      shipping_street: params.shipping?.street ?? null,
      shipping_zip: params.shipping?.zip ?? null,
      shipping_city: params.shipping?.city ?? null,
      shipping_country: params.shipping?.country ?? null,
    })
    .select('id, created_at')
    .single();

  if (insertOrderError || !orderRow) {
    console.error('[orders] Insert in "orders" fehlgeschlagen:', insertOrderError);
    return { success: false, error: 'Die Bestellung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.' };
  }

  const orderId = orderRow.id as string;
  const orderNumber = buildOrderNumber(orderId);

  const itemRecords = await buildItemRecords(params.items, orderId, pricing.items);

  const orderItemsPayload = params.items.map((item, i) => ({
    order_id: orderId,
    product_id: item.productId,
    product_name: itemRecords[i]?.productName ?? item.productId,
    color_id: item.colorId,
    color_name: itemRecords[i]?.colorName ?? item.colorId,
    print_method: item.printMethod,
    size_quantities: item.sizeQuantities,
    // Serverseitig berechnete Menge/Preis (nie der Client-Wert).
    quantity: pricing.items[i]?.quantity ?? 0,
    unit_price: pricing.items[i]?.unitPrice ?? 0,
  }));

  // Eine Anfrage ohne Warenkorb-Inhalt hat nichts zum Einfügen – Insert
  // mit leerem Array überspringen statt einen unnötigen Request/Fehler
  // zu riskieren.
  let insertedItems: { id: string }[] = [];
  if (orderItemsPayload.length > 0) {
    const { data, error: insertItemsError } = await supabase.from('order_items').insert(orderItemsPayload).select('id');
    if (insertItemsError || !data) {
      console.error('[orders] Insert in "order_items" fehlgeschlagen:', insertItemsError);
      return { success: false, error: 'Die Bestellpositionen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.' };
    }
    insertedItems = data;
  }

  const configurationElementsPayload = itemRecords.flatMap((itemRecord, i) => {
    const orderItemId = insertedItems[i]?.id;
    if (!orderItemId) return [];
    return itemRecord.elements.map((el) => ({
      order_item_id: orderItemId,
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
    }));
  });

  if (configurationElementsPayload.length > 0) {
    const { error: insertElementsError } = await supabase.from('configuration_elements').insert(configurationElementsPayload);
    if (insertElementsError) {
      // Bestellung selbst ist bereits gespeichert (die Quelle der Wahrheit) –
      // ein Fehler hier soll die Bestellung nicht als Ganzes scheitern lassen,
      // nur geloggt werden, damit es manuell nachgetragen werden kann.
      console.error('[orders] Insert in "configuration_elements" fehlgeschlagen:', insertElementsError);
    }
  }

  // Druckvorschau-Rendering (Phase 2): pro Bestellposition und Ansicht mit
  // mindestens einem Element ein hochauflösendes PNG erzeugen (Kleidungsstück
  // + Logo/Text exakt wie im Editor platziert) und in Storage ablegen.
  // Bewusst NACH dem configuration_elements-Insert (braucht die dort
  // gespeicherten Werte) und in einem eigenen, nicht-fatalen try/catch wie
  // beim Produktionsblatt-PDF weiter unten – ein Rendering-Fehler darf die
  // Bestellung nie zum Scheitern bringen.
  try {
    // Alle (Position × Ansicht)-Kombinationen zuerst sammeln und dann PARALLEL
    // rendern+hochladen. Zuvor lief das streng nacheinander – bei mehreren
    // Positionen mit je bis zu vier Ansichten summierten sich die einzelnen
    // Rasterungen zu einer sehr langen Wartezeit im Checkout. Die Aufgaben sind
    // voneinander unabhängig (getrennte Dateipfade, getrennte Buffer).
    const renderTasks: { itemIndex: number; itemRecord: OrderItemRecord; view: PrintView; elements: OrderElementRecord[] }[] = [];
    for (let itemIndex = 0; itemIndex < itemRecords.length; itemIndex++) {
      const itemRecord = itemRecords[itemIndex];
      if (!itemRecord) continue;

      const elementsByView = new Map<PrintView, OrderElementRecord[]>();
      for (const el of itemRecord.elements) {
        const list = elementsByView.get(el.view) ?? [];
        list.push(el);
        elementsByView.set(el.view, list);
      }
      for (const [view, elements] of elementsByView) {
        renderTasks.push({ itemIndex, itemRecord, view, elements });
      }
    }

    const renderStartedAt = Date.now();
    await Promise.all(
      renderTasks.map(async ({ itemIndex, itemRecord, view, elements }) => {
        const renderableElements = await Promise.all(elements.map(toRenderableElement));
        const result = await renderPrintView({
          productId: itemRecord.productId,
          colorId: itemRecord.colorId,
          view,
          printMethod: itemRecord.printMethod,
          elements: renderableElements,
        });
        if (!result) return;
        const previewPath = `orders/${orderId}/preview-item${itemIndex}-${view}.png`;
        await uploadProductionFile(previewPath, result.pngBuffer, 'image/png');
        // Buffer zusätzlich am itemRecord behalten – buildProductionSheet()
        // wird gleich im selben Request aufgerufen und kann die Vorschau so
        // direkt einbetten, ohne sie aus Storage erneut herunterzuladen.
        itemRecord.previews ??= {};
        itemRecord.previews[view] = result.pngBuffer;
      })
    );
    console.info(`[orders] Druckvorschauen: ${renderTasks.length} Ansicht(en) in ${Date.now() - renderStartedAt} ms.`);
  } catch (err) {
    console.error('[orders] Druckvorschau-Rendering fehlgeschlagen:', err);
  }

  const order: OrderRecord = {
    id: orderId,
    orderNumber,
    orderType: params.orderType,
    createdAt: orderRow.created_at as string,
    contact: { name: params.customerName, company: params.company, email: params.email, phone: params.phone },
    shipping: params.shipping,
    paymentMethod: params.paymentMethod,
    message: params.message,
    subtotal: pricing.subtotal,
    shippingCost: pricing.shippingCost,
    totalPrice: pricing.totalPrice,
    items: itemRecords,
  };

  let productionSheetSignedUrl: string | null = null;
  try {
    const pdfStartedAt = Date.now();
    const pdfBuffer = await renderProductionSheet(order);
    const pdfPath = `orders/${orderId}/produktionsblatt.pdf`;
    // Upload und Statusspalte hängen nicht voneinander ab → parallel.
    await Promise.all([
      uploadProductionFile(pdfPath, pdfBuffer, 'application/pdf'),
      supabase.from('orders').update({ pdf_url: pdfPath, production_files_url: `orders/${orderId}/` }).eq('id', orderId),
    ]);
    productionSheetSignedUrl = await getProductionFileSignedUrl(pdfPath);
    console.info(`[orders] Produktionsblatt in ${Date.now() - pdfStartedAt} ms.`);
  } catch (err) {
    // Auch hier: Bestellung ist bereits gespeichert, das Produktionsblatt
    // kann notfalls manuell nachgeneriert werden.
    console.error('[orders] Produktionsblatt-Erzeugung fehlgeschlagen:', err);
  }

  // E-Mails sind bewusst „nice-to-have": die Bestellung ist bereits persistiert
  // und gilt als erfolgreich, auch wenn Template-Rendern oder Versand scheitern.
  // Umschlossen, damit ein Render-/Versandfehler NIE eine gespeicherte
  // Bestellung als fehlgeschlagen meldet (DB ist Quelle der Wahrheit).
  try {
    // Beide Mails gehen an unterschiedliche Empfänger und hängen nicht
    // voneinander ab → parallel senden statt nacheinander zu warten.
    const mailStartedAt = Date.now();
    await Promise.all([
      sendOrderConfirmationEmail(order),
      sendInternalOrderNotificationEmail(order, productionSheetSignedUrl),
    ]);
    console.info(`[orders] E-Mail-Versand in ${Date.now() - mailStartedAt} ms.`);
  } catch (err) {
    console.error('[orders] E-Mail-Versand fehlgeschlagen (nicht-fatal):', err);
  }

  // Automatische Übergabe an den Lieferantenprozess: nur bei echten
  // Bestellungen (keine Anfragen) und nur, wenn keine Vorauszahlung nötig
  // ist (Rechnung → sofort fällig). Karte/PayPal werden erst nach
  // bestätigter Zahlung eingereiht (künftig aus dem Stripe-Webhook via
  // enqueueSupplierOrdersForOrder). Bewusst NICHT-fatal: eine Bestellung
  // darf nie an der Lieferanten-Einreihung scheitern.
  if (params.orderType === 'order' && params.paymentMethod === 'invoice') {
    try {
      const result = await enqueueSupplierOrdersForOrder(orderId);
      console.info(`[orders] Lieferanten-Einreihung ${orderId}: +${result.enqueued} eingereiht, ${result.skipped} übersprungen.`);
    } catch (err) {
      console.error('[orders] Lieferanten-Einreihung fehlgeschlagen (nicht-fatal):', err);
    }
  }

  return { success: true, orderNumber };
}

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitResult> {
  const customerName = `${input.contact.firstName} ${input.contact.lastName}`.trim();
  if (!customerName || !input.shipping.street || !input.shipping.zip || !input.shipping.city) {
    return { success: false, error: 'Bitte alle Pflichtfelder ausfüllen.' };
  }

  // Menge + Preis werden serverseitig in persistAndNotifyCore aus Katalog +
  // Konfiguration berechnet – hier bewusst NICHTS aus dem Client übernehmen.
  return persistAndNotify({
    orderType: 'order',
    customerName,
    company: input.contact.companyName || undefined,
    email: input.contact.email,
    phone: input.contact.phone || undefined,
    items: input.items,
    shipping: input.shipping,
    paymentMethod: input.paymentMethod,
  });
}

export async function submitInquiry(input: SubmitInquiryInput): Promise<SubmitResult> {
  if (!input.contact.name.trim()) {
    return { success: false, error: 'Bitte einen Namen angeben.' };
  }

  // Menge + Preis serverseitig (persistAndNotifyCore) – kein Client-Wert.
  return persistAndNotify({
    orderType: 'inquiry',
    customerName: input.contact.name,
    company: input.contact.companyName || undefined,
    email: input.contact.email,
    phone: input.contact.phone || undefined,
    message: input.message || undefined,
    items: input.items,
  });
}
