'use server';

import { pruefeRateLimit } from '@/lib/security/rateLimit';

/**
 * Server Action für die Selbststornierung durch den Kunden.
 *
 * SICHERHEIT: Die Action bekommt ausschließlich den TOKEN, niemals eine
 * Bestell-ID. Sie prüft den Token selbst und leitet die Bestell-ID daraus
 * ab. Würde die ID vom Client übergeben, könnte jeder mit einem beliebigen
 * gültigen Token eine fremde Bestellung stornieren.
 *
 * Die eigentliche Geschäftslogik – insbesondere die Fristprüfung – liegt
 * ausschließlich in orderService. Diese Datei ist reine Transportschicht.
 */
import { revalidatePath } from 'next/cache';
import { pruefeBestellzugriff } from '@/lib/orders/orderAccess';
import { storniereBestellungDurchKunden } from '@/lib/orders/orderService';

export interface StornoAktionErgebnis {
  ok: boolean;
  /** Für den Kunden verständliche Meldung, falls etwas nicht ging. */
  fehler?: string;
}

export async function storniereBestellungAction(token: string): Promise<StornoAktionErgebnis> {
  // Der Token ist geheim; wiederholte Fehlversuche deuten auf Raten hin.
  const grenze = await pruefeRateLimit('stornierung', token.slice(0, 32));
  if (!grenze.erlaubt) {
    return { ok: false, fehler: grenze.meldung };
  }

  const zugriff = pruefeBestellzugriff({ art: 'token', token });
  if (!zugriff.erlaubt) {
    return { ok: false, fehler: 'Dieser Link ist nicht mehr gültig. Bitte kontaktieren Sie uns direkt.' };
  }

  const ergebnis = await storniereBestellungDurchKunden(zugriff.orderId);

  if (!ergebnis.ok) {
    const meldungen: Record<string, string> = {
      'nicht-gefunden': 'Die Bestellung wurde nicht gefunden. Bitte kontaktieren Sie uns direkt.',
      'frist-abgelaufen':
        'Die Stornofrist ist inzwischen abgelaufen. Bitte kontaktieren Sie uns – wir prüfen, was sich noch machen lässt.',
      'keine-bestellung': 'Für Anfragen gibt es keine Stornierung. Bitte kontaktieren Sie uns direkt.',
      fehler: 'Die Stornierung konnte technisch nicht abgeschlossen werden. Bitte kontaktieren Sie uns direkt.',
    };
    return { ok: false, fehler: meldungen[ergebnis.grund] ?? meldungen.fehler };
  }

  // Die Seite zeigt danach den Zustand „storniert".
  revalidatePath(`/bestellung/${token}`);
  return { ok: true };
}
