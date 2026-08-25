'use server';

/**
 * Server Action: erzeugt nachträglich EINE fehlende Druckvorschau
 * (Position × Ansicht) für die Admin-Produktionsansicht.
 *
 * Reine Vermittlung, exakt wie shippingActions.ts/orderStatusActions.ts:
 * prüft die Berechtigung, lädt die Bestellung aus der Datenbank (dieselbe
 * Rekonstruktion wie beim Zahlungs-Webhook, ladeBestellungFuerAbschluss) und
 * ruft dieselbe Rendering-Funktion auf, die auch beim regulären
 * Bestellabschluss läuft (renderUndLadeEineDruckvorschauHoch,
 * orderCompletion.ts) – kein zweites, paralleles Rendering-System.
 *
 * Schlägt ehrlich fehl, wenn die zugrunde liegende Logo-Datei nicht mehr im
 * Storage existiert (z.B. bei älteren Testbestellungen, deren Dateien nur in
 * einer lokalen Testablage lagen) – der von renderUndLadeEineDruckvorschauHoch
 * gelieferte Grund wird unverändert durchgereicht, statt ihn zu verschleiern.
 */
import { revalidatePath } from 'next/cache';
import { istAdmin } from '@/lib/admin/auth';
import { ladeBestellungFuerAbschluss, renderUndLadeEineDruckvorschauHoch } from '@/lib/orders/orderCompletion';
import type { PrintView } from '@/types';

export interface DruckvorschauAktionErgebnis {
  ok: boolean;
  meldung: string;
}

export async function erzeugeDruckvorschauNeu(
  orderId: string,
  itemIndex: number,
  view: PrintView
): Promise<DruckvorschauAktionErgebnis> {
  if (!(await istAdmin())) {
    return { ok: false, meldung: 'Nicht angemeldet.' };
  }

  const order = await ladeBestellungFuerAbschluss(orderId);
  if (!order) {
    return { ok: false, meldung: 'Bestellung nicht gefunden.' };
  }
  const itemRecord = order.items[itemIndex];
  if (!itemRecord) {
    return { ok: false, meldung: 'Diese Position existiert nicht (mehr).' };
  }
  const elements = itemRecord.elements.filter((el) => el.view === view);
  if (elements.length === 0) {
    return { ok: false, meldung: 'Für diese Ansicht sind keine Personalisierungselemente hinterlegt.' };
  }

  const ergebnis = await renderUndLadeEineDruckvorschauHoch(orderId, itemIndex, itemRecord, view, elements);
  if (!ergebnis.ok) {
    return { ok: false, meldung: ergebnis.grund ?? 'Vorschau konnte aus unbekanntem Grund nicht erzeugt werden.' };
  }

  revalidatePath(`/admin/bestellung/${orderId}`);
  return { ok: true, meldung: 'Vorschau wurde erzeugt.' };
}
