'use server';

/**
 * Server Action für den Statuswechsel im Adminbereich.
 *
 * Reine Vermittlung: prüft die Berechtigung, ruft `orderService` auf und
 * frischt die Seite auf. Die Fachlogik — welcher Übergang erlaubt ist, welche
 * Zeitstempel gesetzt werden, welche E-Mail rausgeht — liegt vollständig in
 * `orderService`, damit es genau einen Ort dafür gibt.
 */
import { revalidatePath } from 'next/cache';
import { istAdmin } from '@/lib/admin/auth';
import { setzeBestellstatus } from '@/lib/orders/orderService';
import { STATUS_LABELS } from '@/config/orderStatus';
import type { OrderStatus } from '@/lib/actions/orderTypes';

export interface StatusAktionErgebnis {
  ok: boolean;
  meldung: string;
}

export async function aendereBestellstatus(
  orderId: string,
  nach: OrderStatus,
  trackingNummer?: string
): Promise<StatusAktionErgebnis> {
  if (!(await istAdmin())) {
    return { ok: false, meldung: 'Nicht angemeldet.' };
  }

  const ergebnis = await setzeBestellstatus(orderId, nach, {
    ...(trackingNummer ? { trackingNummer } : {}),
  });

  if (!ergebnis.ok) {
    const texte: Record<string, string> = {
      'nicht-gefunden': 'Bestellung nicht gefunden.',
      'uebergang-unzulaessig': ergebnis.aktuell
        ? `Nicht möglich: Die Bestellung steht auf „${STATUS_LABELS[ergebnis.aktuell]}".`
        : 'Dieser Statuswechsel ist nicht zulässig.',
      'noch-nicht-freigegeben':
        'Noch nicht möglich: Die Stornofrist für diese Bestellung läuft noch (oder die Zahlung steht aus). Der Kunde kann in dieser Zeit noch selbst stornieren.',
      fehler: 'Der Statuswechsel ist fehlgeschlagen.',
    };
    return { ok: false, meldung: texte[ergebnis.grund] ?? 'Unbekannter Fehler.' };
  }

  revalidatePath(`/admin/bestellung/${orderId}`);
  revalidatePath('/admin');

  return {
    ok: true,
    meldung: ergebnis.bereitsErreicht
      ? `Bestellung steht bereits auf „${STATUS_LABELS[nach]}".`
      : `Status auf „${STATUS_LABELS[nach]}" gesetzt.`,
  };
}
