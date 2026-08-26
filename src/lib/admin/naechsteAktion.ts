/**
 * Leitet aus den bereits geladenen `AdminOrderDetail`-Feldern ab, was der
 * Betreiber als Nächstes tun sollte – reine Ableitungslogik, KEINE neue
 * Datenhaltung (Fund vom 2026-08-26, Produktionsreife-Audit: alle nötigen
 * Felder – Status, Zahlungsstatus, Stornofrist, Sendungsnummer, DHL-Fehler,
 * fehlende Vorschauen, Rechnungsnummer, Lieferantenstatus – sind bereits
 * Teil der Detailseite).
 *
 * Nutzt ausschließlich die bestehende Statuslogik (config/orderStatus.ts,
 * orderVisibility.ts) – kein neuer Workflow, keine neuen Zustandsfelder.
 */
import type { AdminOrderDetail } from './data';

export type NaechsteAktionTon = 'ok' | 'hinweis' | 'kritisch';

export interface NaechsteAktion {
  text: string;
  ton: NaechsteAktionTon;
}

export function berechneNaechsteAktion(order: AdminOrderDetail): NaechsteAktion | null {
  if (order.orderType !== 'order') return null; // Anfrage: kein Bestellstatus

  if (order.status === 'cancelled') {
    if (order.refundStatus === 'required' || order.refundStatus === 'failed') {
      return { text: 'Rückerstattung offen bzw. fehlgeschlagen – siehe unten.', ton: 'kritisch' };
    }
    return null; // erledigt
  }

  if (order.paymentStatus === 'pending') {
    return { text: 'Zahlung steht noch aus – abwarten.', ton: 'hinweis' };
  }
  if (order.paymentStatus === 'failed') {
    return { text: 'Zahlung ist fehlgeschlagen – keine Aktion nötig, Kundschaft kann erneut bezahlen.', ton: 'hinweis' };
  }

  if (!order.orderConfirmationSentAt && order.lastConfirmationEmailError) {
    return {
      text: `Bestellbestätigung konnte nicht zugestellt werden: ${order.lastConfirmationEmailError}`,
      ton: 'kritisch',
    };
  }

  if (order.adminStatus.code === 'stornierbar') {
    const uhrzeit = order.adminStatus.stornofristEndeIso
      ? new Date(order.adminStatus.stornofristEndeIso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
      : null;
    return {
      text: uhrzeit
        ? `Stornofrist läuft noch bis ${uhrzeit} – noch nicht produzieren.`
        : 'Stornofrist läuft noch – noch nicht produzieren.',
      ton: 'hinweis',
    };
  }

  // Ab hier: produktionsbereit (weder storniert noch stornierbar, Zahlung ok).
  const fehlendeVorschau = order.items.some((item) => {
    const ansichtenMitElementen = new Set(item.elements.map((e) => e.view));
    return [...ansichtenMitElementen].some((view) => !item.previewUrlByView[view]);
  });
  if (fehlendeVorschau) {
    return { text: 'Für mindestens eine Ansicht fehlt die Druckvorschau – im Bereich „Personalisierung" erzeugen.', ton: 'kritisch' };
  }

  const hatLieferantenBezug = Object.keys(order.supplierDraft.positionsBySupplier).length > 0;
  if (hatLieferantenBezug && order.supplierOrders.some((so) => so.status !== 'ordered')) {
    return { text: 'Noch nicht beim Lieferanten bestellt.', ton: 'hinweis' };
  }

  if (order.lastInvoiceError) {
    return { text: `Rechnungserstellung ist fehlgeschlagen: ${order.lastInvoiceError}`, ton: 'kritisch' };
  }
  if (!order.invoiceNumber) {
    return { text: 'Rechnung noch nicht erstellt – wird automatisch nachgeholt, bei Wiederholung prüfen.', ton: 'hinweis' };
  }

  if (order.status === 'new') {
    return { text: 'Auf „In Produktion" setzen.', ton: 'ok' };
  }
  if (order.status === 'in_production') {
    if (order.lastShippingError) {
      return { text: `Letzter DHL-Label-Versuch fehlgeschlagen: ${order.lastShippingError}`, ton: 'kritisch' };
    }
    if (!order.trackingNumber) {
      return { text: 'Versandlabel erstellen (oder Sendungsnummer manuell eintragen).', ton: 'ok' };
    }
    return { text: 'Auf „Versendet" setzen.', ton: 'ok' };
  }
  if (order.status === 'shipped') {
    return { text: 'Nach Zustellung auf „Abgeschlossen" setzen.', ton: 'hinweis' };
  }

  return null; // 'completed' oder unbekannt: nichts weiter zu tun
}
