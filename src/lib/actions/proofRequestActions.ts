'use server';

/**
 * Server Action für den Admin-Auslöser der Kundenfreigabe: verschickt die
 * Bitte um Freigabe der Druckvorschau. Reine Vermittlung, exakt wie
 * orderStatusActions.ts – die Fachlogik liegt vollständig in
 * orderService.ts::sendeVorschauFreigabeAnfrage.
 */
import { revalidatePath } from 'next/cache';
import { istAdmin } from '@/lib/admin/auth';
import { sendeVorschauFreigabeAnfrage } from '@/lib/orders/orderService';

export interface ProofRequestAktionErgebnis {
  ok: boolean;
  meldung: string;
}

export async function sendeVorschauFreigabeAnfrageAction(orderId: string): Promise<ProofRequestAktionErgebnis> {
  if (!(await istAdmin())) {
    return { ok: false, meldung: 'Nicht angemeldet.' };
  }

  const ergebnis = await sendeVorschauFreigabeAnfrage(orderId);
  if (!ergebnis.ok) {
    const texte: Record<string, string> = {
      'nicht-gefunden': 'Bestellung nicht gefunden.',
      'keine-email': 'Für diese Bestellung ist keine E-Mail-Adresse hinterlegt.',
      'kein-link': 'Der Bestellansicht-Link konnte nicht erzeugt werden (ORDER_TOKEN_SECRET fehlt).',
    };
    return { ok: false, meldung: texte[ergebnis.grund] ?? 'Unbekannter Fehler.' };
  }

  revalidatePath(`/admin/bestellung/${orderId}`);

  return { ok: true, meldung: 'Freigabeanfrage wurde an die Kundschaft gesendet.' };
}
