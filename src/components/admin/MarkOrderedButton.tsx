/**
 * „Als bei TG bestellt markieren" – der Abschluss des MANUELLEN Ablaufs.
 *
 * Der Betreiber bestellt selbst im Shop des Lieferanten und hält das Ergebnis
 * hier fest. Setzt den Lieferantenauftrag auf 'ordered'; die Browser-
 * Automatisierung ist daran nicht beteiligt (sie ruht).
 */
'use client';

import { useState, useTransition } from 'react';
import { markSupplierOrderedAction } from '@/lib/actions/admin';
import type { SupplierId } from '@/lib/suppliers';

export function MarkOrderedButton({
  orderId,
  supplierId,
  bereitsBestellt,
}: {
  orderId: string;
  supplierId: SupplierId;
  bereitsBestellt: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  if (bereitsBestellt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">
        ✓ Bei Textil-Großhandel bestellt
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setFehler(null);
            const r = await markSupplierOrderedAction(orderId, supplierId);
            if (!r.success) setFehler(r.error ?? 'Markieren fehlgeschlagen.');
          })
        }
        className="rounded border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-800 transition-colors hover:bg-green-50 disabled:opacity-50"
      >
        {isPending ? 'Wird gespeichert …' : 'Als bei TG bestellt markieren'}
      </button>
      {fehler && <span className="text-xs text-red-600">{fehler}</span>}
    </span>
  );
}
