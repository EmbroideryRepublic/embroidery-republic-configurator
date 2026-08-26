'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { verwirfGespeicherteKennung } from '@/lib/hooks/useSubmitGuard';

/**
 * Räumt clientseitigen Zustand auf, sobald die Kundschaft mit einer
 * BESTÄTIGT bezahlten Bestellung auf der Zahlungs-Rückkehrseite landet.
 *
 * Bewusst als eigene, winzige Client-Insel neben der weiterhin rein
 * lesenden Server-Komponente (siehe Kopfkommentar dort: "Diese Seite LIEST
 * nur") – das betrifft ausschließlich die Datenbank/den Bestellstatus.
 * Reines Browser-Storage-Aufräumen ist davon unberührt und gehört hier hin,
 * weil genau HIER der einzige verlässliche Punkt ist, an dem feststeht,
 * dass der Karte/PayPal-Bezahlvorgang für DIESE Bestellung abgeschlossen
 * ist – vorher hätte ein Löschen der Absendekennung eine echte Doppel-
 * Bestellung riskiert, falls der Redirect selbst abbricht und die Kundschaft
 * denselben Warenkorb sofort erneut absendet (siehe Kommentar in
 * CartDrawer.tsx, handleSubmit).
 *
 * Fund vom 2026-08-26 (Produktionsreife-Audit): Ohne dieses Aufräumen blieb
 * der Warenkorb nach einer erfolgreichen Karten-/PayPal-Zahlung gefüllt UND
 * die Absendekennung bestehen – ein späterer, inhaltlich neuer Bestellversuch
 * hätte fälschlich wieder diese bereits abgeschlossene Bestellung geliefert.
 */
export function ZahlungErfolgAufraeumen() {
  const clearCart = useCartStore((s) => s.clear);

  useEffect(() => {
    clearCart();
    verwirfGespeicherteKennung('er-absendung-bestellung');
    // Absichtlich ohne Abhängigkeiten – läuft genau einmal beim Mounten
    // dieser Seite, nicht bei jedem Store-Update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
