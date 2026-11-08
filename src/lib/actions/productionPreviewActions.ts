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
import {
  erzeugeProduktionsunterlagenNeu,
  ladeBestellungFuerAbschluss,
  renderUndLadeEineDruckvorschauHoch,
} from '@/lib/orders/orderCompletion';
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

/**
 * Erzeugt ALLE Druckvorschauen und das Produktionsblatt (PDF) einer
 * bestehenden Bestellung aus den gespeicherten Daten neu – mit dem aktuellen
 * Rendering. Sinnvoll, wenn die Bilder einer Bestellung mit einem inzwischen
 * behobenen Darstellungsfehler entstanden sind (siehe
 * orderCompletion.ts::erzeugeProduktionsunterlagenNeu).
 *
 * Verschickt nichts: weder Kundschaft noch Betreiber bekommen eine E-Mail.
 * Eine bereits an die Kundschaft gesendete Vorschau-Freigabe bleibt, wie sie
 * war – wer vorher eine Freigabe anfragen will, erzeugt zuerst neu.
 */
export async function erzeugeProduktionsunterlagenNeuAktion(orderId: string): Promise<DruckvorschauAktionErgebnis> {
  if (!(await istAdmin())) {
    return { ok: false, meldung: 'Nicht angemeldet.' };
  }

  const ergebnis = await erzeugeProduktionsunterlagenNeu(orderId);
  // Auch ein Teilerfolg zeigt neue Vorschauen – Seite auffrischen.
  if (ergebnis.vorschauen > 0 || ergebnis.produktionsblattErneuert) {
    revalidatePath(`/admin/bestellung/${orderId}`);
  }
  if (!ergebnis.ok) {
    const gruende = ergebnis.probleme.join(' · ') || 'Unbekannter Grund.';
    return {
      ok: false,
      meldung: ergebnis.produktionsblattErneuert
        ? `Vorschauen neu erzeugt, aber: ${gruende}`
        : `Produktionsblatt nicht ersetzt. ${gruende}`,
    };
  }
  return {
    ok: true,
    meldung: `${ergebnis.vorschauen} Vorschau${ergebnis.vorschauen === 1 ? '' : 'en'} und das Produktionsblatt wurden neu erzeugt.`,
  };
}
