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

  // Die Bestellliste zeigt eine abgeschlossene Erstattung ohnehin nicht mehr
  // an (orderVisibility.ts, Regel 5) – das darf jederzeit neu geladen werden.
  revalidatePath('/admin');

  // Die DETAILSEITE dagegen NUR revalidieren, wenn die Bestellung danach noch
  // sichtbar bleibt (Erstattung weiterhin offen/fehlgeschlagen). Ein Erfolg
  // setzt refund_status auf 'refunded' – exakt der Zustand, den
  // imAdminSichtbar() für eine stornierte Bestellung als „nichts mehr zu
  // tun" behandelt (Regel 1/5). Würde HIER ebenfalls revalidiert, holte
  // Next.js beim nächsten Rendern der gerade geöffneten Seite serverseitig
  // getOrderDetail() neu ab, die liefert dann null, und die Seite ruft
  // notFound() auf – der Admin verschwindet mitten aus seiner eigenen,
  // erfolgreichen Aktion auf eine generische 404-Seite, OHNE die
  // Erfolgsmeldung von RefundControl je zu sehen. Ohne dieses Revalidieren
  // bleibt die aktuell geöffnete Seite bewusst auf dem letzten (leicht
  // veralteten) Stand stehen – ein erneuter Aufruf der Detailseite später
  // liefert dann korrekt 404, aber nicht mitten in der gerade laufenden
  // Bestätigung.
  // ok:true bedeutet in BEIDEN Ausgängen ('erstattet' UND 'bereits_erledigt'),
  // dass refund_status jetzt 'refunded' ist – nur bei ok:false (Anspruch
  // nicht erhalten/Anbieter-Fehlschlag) bleibt die Bestellung sichtbar.
  const bleibtSichtbar = !ergebnis.ok;
  if (bleibtSichtbar) revalidatePath(`/admin/bestellung/${orderId}`);

  if (!ergebnis.ok) {
    return { ok: false, meldung: `Rückerstattung nicht erfolgreich: ${ergebnis.grund}` };
  }
  return {
    ok: true,
    meldung: ergebnis.ausgang === 'bereits_erledigt' ? 'Rückerstattung war bereits abgeschlossen.' : 'Rückerstattung abgeschlossen.',
  };
}
