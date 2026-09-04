'use server';

import { pruefeRateLimit } from '@/lib/security/rateLimit';

/**
 * Server Actions für die Kundenfreigabe der Druckvorschau.
 *
 * SICHERHEIT: identisches Muster zu orderCancellation.ts – zwei Zugriffswege,
 * beide leiten die Bestell-ID serverseitig her, niemals vertraut die Action
 * einer vom Client mitgeschickten ID direkt:
 *  - 'token': Bestell-ID steckt im signierten, geprüften Token.
 *  - 'konto': Kunden-ID kommt aus der serverseitigen Sitzung,
 *    `pruefeBestellzugriff` prüft zusätzlich per Datenbank-Nachschlag, dass
 *    die Bestellung wirklich diesem Konto gehört (IDOR-Schutz).
 *
 * Die eigentliche Geschäftslogik liegt ausschließlich in orderService.ts.
 */
import { revalidatePath } from 'next/cache';
import { aktuellerKunde } from '@/lib/account/session';
import { pruefeBestellzugriff } from '@/lib/orders/orderAccess';
import {
  freigebeVorschauDurchKunden,
  wuenscheAenderungDurchKunden,
  type KundenfreigabeErgebnis,
  type AenderungswunschErgebnis,
} from '@/lib/orders/orderService';

export interface FreigabeAktionErgebnis {
  ok: boolean;
  fehler?: string;
}

/** Wie sich der Aufrufer ausweist – analog zu StornoAnfrage in orderCancellation.ts. */
export type FreigabeAnfrage = { art: 'token'; token: string } | { art: 'konto'; orderId: string };

const FREIGABE_MELDUNGEN: Record<Extract<KundenfreigabeErgebnis, { ok: false }>['grund'], string> = {
  'nicht-gefunden': 'Die Bestellung wurde nicht gefunden. Bitte kontaktieren Sie uns direkt.',
  'nicht-angefragt': 'Für diese Bestellung liegt aktuell keine Freigabeanfrage vor.',
  fehler: 'Die Freigabe konnte technisch nicht abgeschlossen werden. Bitte kontaktieren Sie uns direkt.',
};

const AENDERUNG_MELDUNGEN: Record<Extract<AenderungswunschErgebnis, { ok: false }>['grund'], string> = {
  'nicht-gefunden': 'Die Bestellung wurde nicht gefunden. Bitte kontaktieren Sie uns direkt.',
  'nicht-angefragt': 'Für diese Bestellung liegt aktuell keine Freigabeanfrage vor.',
};

/** Löst anhand der Anfrageart die Bestell-ID auf – gemeinsamer Zugriffs- und
 *  Rate-Limit-Pfad für beide Aktionen unten. */
async function loeseZugriffAuf(
  anfrage: FreigabeAnfrage
): Promise<{ ok: true; orderId: string } | { ok: false; fehler: string }> {
  if (anfrage.art === 'konto') {
    const kunde = await aktuellerKunde();
    if (!kunde) {
      return { ok: false, fehler: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.' };
    }
    const grenze = await pruefeRateLimit('kundenfreigabe', kunde.id);
    if (!grenze.erlaubt) return { ok: false, fehler: grenze.meldung };

    const zugriff = await pruefeBestellzugriff({ art: 'konto', kundenId: kunde.id, orderId: anfrage.orderId });
    if (!zugriff.erlaubt) return { ok: false, fehler: 'Diese Bestellung wurde nicht gefunden.' };
    return { ok: true, orderId: zugriff.orderId };
  }

  const grenze = await pruefeRateLimit('kundenfreigabe', anfrage.token.slice(0, 32));
  if (!grenze.erlaubt) return { ok: false, fehler: grenze.meldung };

  const zugriff = await pruefeBestellzugriff({ art: 'token', token: anfrage.token });
  if (!zugriff.erlaubt) return { ok: false, fehler: 'Dieser Link ist nicht mehr gültig. Bitte kontaktieren Sie uns direkt.' };
  return { ok: true, orderId: zugriff.orderId };
}

function revalidiereBestellansicht(anfrage: FreigabeAnfrage, orderId: string): void {
  if (anfrage.art === 'konto') {
    revalidatePath(`/konto/bestellungen/${orderId}`);
  } else {
    revalidatePath(`/bestellung/${anfrage.token}`);
  }
}

export async function freigebeVorschauAction(anfrage: FreigabeAnfrage): Promise<FreigabeAktionErgebnis> {
  const zugriff = await loeseZugriffAuf(anfrage);
  if (!zugriff.ok) return { ok: false, fehler: zugriff.fehler };

  const ergebnis = await freigebeVorschauDurchKunden(zugriff.orderId);
  if (!ergebnis.ok) return { ok: false, fehler: FREIGABE_MELDUNGEN[ergebnis.grund] };

  revalidiereBestellansicht(anfrage, zugriff.orderId);
  return { ok: true };
}

export async function wuenscheAenderungAction(anfrage: FreigabeAnfrage, kommentar: string): Promise<FreigabeAktionErgebnis> {
  const bereinigterKommentar = kommentar.trim();
  if (!bereinigterKommentar) {
    return { ok: false, fehler: 'Bitte beschreiben Sie kurz, was geändert werden soll.' };
  }

  const zugriff = await loeseZugriffAuf(anfrage);
  if (!zugriff.ok) return { ok: false, fehler: zugriff.fehler };

  const ergebnis = await wuenscheAenderungDurchKunden(zugriff.orderId, bereinigterKommentar);
  if (!ergebnis.ok) return { ok: false, fehler: AENDERUNG_MELDUNGEN[ergebnis.grund] };

  revalidiereBestellansicht(anfrage, zugriff.orderId);
  return { ok: true };
}
