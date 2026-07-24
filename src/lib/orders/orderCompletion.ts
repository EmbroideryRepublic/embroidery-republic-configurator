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
import { uploadProductionFile, getProductionFileSignedUrl } from '@/lib/supabase/storage';
import { renderProductionSheet } from '@/lib/production/buildProductionSheet';
import { renderPrintView } from '@/lib/rendering/renderPrintView';
import { toRenderableElement } from '@/lib/rendering/mapOrderElements';
import { verarbeiteBestelleingang } from './orderIntake';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import type { OrderElementRecord, OrderItemRecord, OrderRecord } from '@/lib/actions/orderTypes';
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
  const kommunikation = await benachrichtige(order, signierteUrl, probleme);

  return {
    vorschauen,
    produktionsblatt: Boolean(produktionsblattPfad),
    kommunikation,
    probleme,
  };
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
      'id, created_at, order_type, customer_name, company, email, phone, message, total_price, payment_method, shipping_street, shipping_zip, shipping_city, shipping_country'
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
  const versand = 0; // wird in orders nicht getrennt geführt – siehe Hinweis unten

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

/**
 * Rendert je Position und Ansicht mit mindestens einem Element ein
 * hochauflösendes PNG (Kleidungsstück + Motive exakt wie im Editor
 * platziert) und legt es ab.
 *
 * Die Buffer bleiben zusätzlich am jeweiligen `OrderItemRecord` hängen:
 * `renderProductionSheet` läuft gleich danach und bettet sie direkt ein,
 * statt sie erneut herunterzuladen.
 */
async function erzeugeDruckvorschauen(order: OrderRecord, probleme: string[]): Promise<number> {
  try {
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
      aufgaben.map(async ({ itemIndex, itemRecord, view, elements }) => {
        const renderbar = await Promise.all(elements.map(toRenderableElement));
        const ergebnis = await renderPrintView({
          productId: itemRecord.productId,
          colorId: itemRecord.colorId,
          view,
          printMethod: itemRecord.printMethod,
          elements: renderbar,
        });
        if (!ergebnis) return;
        await uploadProductionFile(`orders/${order.id}/preview-item${itemIndex}-${view}.png`, ergebnis.pngBuffer, 'image/png');
        itemRecord.previews ??= {};
        itemRecord.previews[view] = ergebnis.pngBuffer;
        erzeugt++;
      })
    );
    console.info(`[orders] Druckvorschauen: ${erzeugt}/${aufgaben.length} Ansicht(en) in ${Date.now() - begonnen} ms.`);
    return erzeugt;
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    console.error('[orders] Druckvorschau-Rendering fehlgeschlagen:', err);
    probleme.push(`Druckvorschauen: ${text}`);
    return 0;
  }
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
 * Stößt die Kommunikation an (Bestätigung an die Kundschaft, interne
 * Meldung). Die Fachlichkeit liegt vollständig in `orderIntake`.
 */
async function benachrichtige(order: OrderRecord, signierteUrl: string | null, probleme: string[]): Promise<boolean> {
  try {
    // `verarbeiteBestelleingang` wirft nicht; das try/catch bleibt als letzte
    // Sicherung, damit die Bestellung unter keinen Umständen an der
    // Kommunikation scheitert.
    await verarbeiteBestelleingang(order, signierteUrl);
    return true;
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    console.error('[orders] Bestelleingang-Kommunikation fehlgeschlagen (nicht-fatal):', err);
    probleme.push(`Kommunikation: ${text}`);
    return false;
  }
}
