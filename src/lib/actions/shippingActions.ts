'use server';

/**
 * Server Action für die Versandlabel-Erstellung im Adminbereich.
 *
 * Reine Vermittlung, exakt wie orderStatusActions.ts: prüft die
 * Berechtigung, ruft shippingService auf und frischt die Seite auf. Die
 * Fachlogik liegt vollständig in shippingService.
 */
import { revalidatePath } from 'next/cache';
import { istAdmin } from '@/lib/admin/auth';
import { erzeugeVersandlabelFuerBestellung } from '@/lib/orders/shippingService';

export interface VersandAktionErgebnis {
  ok: boolean;
  meldung: string;
  sendungsnummer?: string;
}

export async function erstelleDhlLabel(orderId: string, gewichtKg: number): Promise<VersandAktionErgebnis> {
  if (!(await istAdmin())) {
    return { ok: false, meldung: 'Nicht angemeldet.' };
  }
  if (!Number.isFinite(gewichtKg) || gewichtKg <= 0) {
    return { ok: false, meldung: 'Bitte ein gültiges Gewicht angeben.' };
  }

  const ergebnis = await erzeugeVersandlabelFuerBestellung(orderId, gewichtKg);
  if (!ergebnis.ok) {
    return { ok: false, meldung: ergebnis.meldung };
  }

  revalidatePath(`/admin/bestellung/${orderId}`);
  revalidatePath('/admin');

  return { ok: true, meldung: `Label erstellt: ${ergebnis.sendungsnummer}.`, sendungsnummer: ergebnis.sendungsnummer };
}
