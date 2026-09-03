'use client';

/**
 * Echte Löschung einer stornierten Bestellung direkt in der Bestellliste.
 *
 * Erscheint nur, wenn der Aufrufer sie überhaupt für zulässig hält
 * (status === 'cancelled' und invoiceNumber === null) – die WIRKLICH
 * maßgebliche Prüfung sitzt trotzdem serverseitig, atomar im selben DELETE
 * (siehe orderService.ts::loescheStornierteBestellung, Migration 0034).
 * Diese Komponente kann also nie mehr erlauben, als das Backend sowieso
 * durchsetzt – die Bedingung hier ist reine UI-Sparsamkeit (Button gar nicht
 * erst anzeigen, wo er ohnehin abgelehnt würde).
 */
import { useState, useTransition } from 'react';
import { loescheBestellung } from '@/lib/actions/orderStatusActions';

export function DeleteOrderButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [offen, setOffen] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();

  function loeschen() {
    starte(async () => {
      const r = await loescheBestellung(orderId);
      if (!r.ok) {
        setMeldung(r.meldung);
        return;
      }
      // Bei Erfolg entfernt revalidatePath (in der Action) die Zeile aus der
      // Liste beim nächsten Rendern – kein eigener Erfolgstext nötig, das
      // Verschwinden der Zeile ist der Beleg.
    });
  }

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        title={`Bestellung ${orderNumber} endgültig löschen`}
        className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <span aria-hidden="true">🗑</span>
        <span className="sr-only">Löschen</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 whitespace-nowrap">
      <span className="text-xs text-gray-600">Löschen?</span>
      <button
        type="button"
        disabled={laeuft}
        onClick={loeschen}
        className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {laeuft ? '…' : 'Ja'}
      </button>
      <button
        type="button"
        disabled={laeuft}
        onClick={() => setOffen(false)}
        className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
      >
        Abbrechen
      </button>
      {meldung && <span className="text-xs text-red-600">{meldung}</span>}
    </div>
  );
}
