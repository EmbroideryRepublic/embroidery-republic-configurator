'use server';

/**
 * Server Action für die Admin-Adresskorrektur. Reine Vermittlung, exakt wie
 * orderStatusActions.ts – die Fachlogik liegt vollständig in
 * orderService.ts::korrigiereLieferadresseDurchAdmin.
 */
import { revalidatePath } from 'next/cache';
import { istAdmin } from '@/lib/admin/auth';
import {
  korrigiereLieferadresseDurchAdmin,
  type LieferadresseKorrektur,
} from '@/lib/orders/orderService';

export interface AdresskorrekturErgebnis {
  ok: boolean;
  meldung: string;
}

export async function korrigiereLieferadresseAction(
  orderId: string,
  korrektur: LieferadresseKorrektur
): Promise<AdresskorrekturErgebnis> {
  if (!(await istAdmin())) {
    return { ok: false, meldung: 'Nicht angemeldet.' };
  }

  const ergebnis = await korrigiereLieferadresseDurchAdmin(orderId, korrektur);
  if (!ergebnis.ok) {
    const texte: Record<string, string> = {
      'nicht-gefunden': 'Bestellung nicht gefunden.',
      'bereits-label-erstellt':
        'Nicht mehr möglich: Für diese Bestellung wurde bereits ein Versandlabel erstellt.',
      fehler: 'Die Adresse konnte nicht gespeichert werden.',
    };
    return { ok: false, meldung: texte[ergebnis.grund] ?? 'Unbekannter Fehler.' };
  }

  revalidatePath(`/admin/bestellung/${orderId}`);
  return { ok: true, meldung: 'Adresse aktualisiert.' };
}
