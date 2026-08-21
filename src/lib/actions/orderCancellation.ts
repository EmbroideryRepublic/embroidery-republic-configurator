'use server';

import { pruefeRateLimit } from '@/lib/security/rateLimit';

/**
 * Server Action für die Selbststornierung durch den Kunden.
 *
 * SICHERHEIT: Zwei Zugriffswege, beide leiten die Bestell-ID serverseitig
 * her – niemals vertraut die Action einer vom Client mitgeschickten ID:
 *  - 'token': Der Token ist geheim und wird gegen die Signatur geprüft;
 *    die Bestell-ID steckt darin. Würde die ID direkt vom Client übergeben,
 *    könnte jeder mit einem beliebigen gültigen Token eine fremde
 *    Bestellung stornieren.
 *  - 'konto': Die Kunden-ID kommt ausschließlich aus der serverseitigen
 *    Sitzung (aktuellerKunde()), niemals vom Client. `pruefeBestellzugriff`
 *    prüft zusätzlich per Datenbank-Nachschlag, dass die übergebene
 *    Bestell-ID wirklich diesem Konto gehört (IDOR-Schutz) – exakt dieselbe
 *    Prüfung wie beim Ansehen der Bestellung in /konto/bestellungen/[id].
 *
 * Die eigentliche Geschäftslogik – insbesondere die Fristprüfung – liegt
 * ausschließlich in orderService. Diese Datei ist reine Transportschicht.
 */
import { revalidatePath } from 'next/cache';
import { aktuellerKunde } from '@/lib/account/session';
import { pruefeBestellzugriff } from '@/lib/orders/orderAccess';
import { storniereBestellungDurchKunden, type StornoErgebnis } from '@/lib/orders/orderService';
import { stelleErstattungSicher } from '@/lib/orders/refundService';

export interface StornoAktionErgebnis {
  ok: boolean;
  /** Für den Kunden verständliche Meldung, falls etwas nicht ging. */
  fehler?: string;
}

/** Wie sich der Aufrufer ausweist – analog zu Bestellzugriff in orderAccess.ts. */
export type StornoAnfrage = { art: 'token'; token: string } | { art: 'konto'; orderId: string };

/**
 * Stößt die Rückerstattung nach einer frischen Stornierung an – nicht-fatal:
 * Die Stornierung selbst steht bereits fest und gilt unabhängig davon, ob
 * der Erstattungsversuch sofort gelingt. Schlägt er fehl, bleibt
 * `refund_status='failed'` sichtbar und über den Admin-Bereich wiederholbar
 * (siehe refundService.ts).
 */
async function stosseErstattungAnFallsNoetig(orderId: string, erstattungAusstehend: boolean): Promise<void> {
  if (!erstattungAusstehend) return;
  try {
    const erstattung = await stelleErstattungSicher(orderId);
    if (!erstattung.ok) {
      console.warn(`[storno] Rückerstattung für ${orderId} nicht sofort erfolgreich: ${erstattung.grund}`);
    }
  } catch (err) {
    console.error(`[storno] Rückerstattungsanstoß für ${orderId} fehlgeschlagen (nicht-fatal):`, err);
  }
}

const STORNO_MELDUNGEN: Record<Extract<StornoErgebnis, { ok: false }>['grund'], string> = {
  'nicht-gefunden': 'Die Bestellung wurde nicht gefunden. Bitte kontaktieren Sie uns direkt.',
  'frist-abgelaufen':
    'Die Stornofrist ist inzwischen abgelaufen. Bitte kontaktieren Sie uns – wir prüfen, was sich noch machen lässt.',
  'keine-bestellung': 'Für Anfragen gibt es keine Stornierung. Bitte kontaktieren Sie uns direkt.',
  'nicht-stornierbar':
    'Diese Bestellung ist bereits abgeschlossen und kann nicht mehr storniert werden. Bitte kontaktieren Sie uns direkt.',
  fehler: 'Die Stornierung konnte technisch nicht abgeschlossen werden. Bitte kontaktieren Sie uns direkt.',
};

export async function storniereBestellungAction(anfrage: StornoAnfrage): Promise<StornoAktionErgebnis> {
  if (anfrage.art === 'konto') {
    const kunde = await aktuellerKunde();
    if (!kunde) {
      return { ok: false, fehler: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.' };
    }

    // Wie beim Token: wiederholte Fehlversuche deuten auf Raten hin.
    const grenze = await pruefeRateLimit('stornierung', kunde.id);
    if (!grenze.erlaubt) {
      return { ok: false, fehler: grenze.meldung };
    }

    const zugriff = await pruefeBestellzugriff({ art: 'konto', kundenId: kunde.id, orderId: anfrage.orderId });
    if (!zugriff.erlaubt) {
      return { ok: false, fehler: 'Diese Bestellung wurde nicht gefunden.' };
    }

    const ergebnis = await storniereBestellungDurchKunden(zugriff.orderId);
    if (!ergebnis.ok) {
      return { ok: false, fehler: STORNO_MELDUNGEN[ergebnis.grund] };
    }
    await stosseErstattungAnFallsNoetig(zugriff.orderId, ergebnis.erstattungAusstehend);

    // Die Seite zeigt danach den Zustand „storniert".
    revalidatePath(`/konto/bestellungen/${zugriff.orderId}`);
    revalidatePath('/konto/bestellungen');
    return { ok: true };
  }

  const { token } = anfrage;
  // Der Token ist geheim; wiederholte Fehlversuche deuten auf Raten hin.
  const grenze = await pruefeRateLimit('stornierung', token.slice(0, 32));
  if (!grenze.erlaubt) {
    return { ok: false, fehler: grenze.meldung };
  }

  const zugriff = await pruefeBestellzugriff({ art: 'token', token });
  if (!zugriff.erlaubt) {
    return { ok: false, fehler: 'Dieser Link ist nicht mehr gültig. Bitte kontaktieren Sie uns direkt.' };
  }

  const ergebnis = await storniereBestellungDurchKunden(zugriff.orderId);

  if (!ergebnis.ok) {
    return { ok: false, fehler: STORNO_MELDUNGEN[ergebnis.grund] };
  }
  await stosseErstattungAnFallsNoetig(zugriff.orderId, ergebnis.erstattungAusstehend);

  // Die Seite zeigt danach den Zustand „storniert".
  revalidatePath(`/bestellung/${token}`);
  return { ok: true };
}
