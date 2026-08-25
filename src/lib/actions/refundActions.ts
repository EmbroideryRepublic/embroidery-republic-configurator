'use server';

/**
 * Server Action für den Rückerstattungs-Retry im Adminbereich.
 *
 * Reine Vermittlung, exakt wie shippingActions.ts/orderStatusActions.ts:
 * prüft die Berechtigung, ruft refundService auf und frischt die Seite auf.
 * Die Fachlogik liegt vollständig in refundService.
 *
 * Der automatische ERSTE Versuch läuft bereits direkt bei der Stornierung
 * (orderCancellation.ts/orderStatusActions.ts) – diese Action deckt den
 * Retry-Fall ab: ein fehlgeschlagener Versuch (`refund_status='failed'`)
 * oder ein Admin, der eine noch nicht abgeschlossene Erstattung erneut
 * anstoßen möchte.
 */
import { revalidatePath } from 'next/cache';
import { istAdmin } from '@/lib/admin/auth';
import { stelleErstattungSicher } from '@/lib/orders/refundService';

export interface ErstattungAktionErgebnis {
  ok: boolean;
  meldung: string;
}

export async function retryErstattung(orderId: string): Promise<ErstattungAktionErgebnis> {
  if (!(await istAdmin())) {
    return { ok: false, meldung: 'Nicht angemeldet.' };
  }

  const ergebnis = await stelleErstattungSicher(orderId);

  // Liste und Detailseite zeigen seit der Trennung von Sichtbarkeit und
  // Bearbeitungsstatus (2026-08-25, orderVisibility.ts) JEDE Bestellung
  // unabhängig vom refund_status – getOrderDetail() liefert nie mehr `null`
  // deswegen. Beide Pfade können deshalb bedingungslos neu geladen werden;
  // die frühere Fallunterscheidung (nur revalidieren, wenn die Bestellung
  // „noch sichtbar" bleibt) existierte ausschließlich wegen der inzwischen
  // entfernten Sichtbarkeitsprüfung in getOrderDetail().
  revalidatePath('/admin');
  revalidatePath(`/admin/bestellung/${orderId}`);

  if (!ergebnis.ok) {
    return { ok: false, meldung: `Rückerstattung nicht erfolgreich: ${ergebnis.grund}` };
  }
  return {
    ok: true,
    meldung: ergebnis.ausgang === 'bereits_erledigt' ? 'Rückerstattung war bereits abgeschlossen.' : 'Rückerstattung abgeschlossen.',
  };
}
