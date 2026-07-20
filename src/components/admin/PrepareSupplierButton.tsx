'use client';

/**
 * Der "Beim Lieferanten bestellen"-Button auf der Bestell-Detailseite.
 * Ruft die Server Action auf und zeigt das Ergebnis (bzw. den Hinweis,
 * dass die Browser-Automatisierung noch Stub-Status hat) direkt inline –
 * die persistierten Laufprotokolle rendert die Seite serverseitig nach
 * dem revalidatePath ohnehin neu.
 */
import { useState, useTransition } from 'react';
import { prepareSupplierOrderAction, type PrepareSupplierOrderResult } from '@/lib/actions/admin';

export function PrepareSupplierButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PrepareSupplierOrderResult | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setResult(await prepareSupplierOrderAction(orderId));
          })
        }
        className="rounded bg-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-dark disabled:opacity-50"
      >
        {isPending ? 'Bereite Warenkorb vor …' : 'Beim Lieferanten bestellen'}
      </button>

      {result && !result.success && <p className="text-xs text-red-600">{result.error}</p>}
      {result?.success && (
        <ul className="space-y-0.5 text-xs text-gray-600">
          {result.results?.map((r) => (
            <li key={r.supplierId}>
              <span className="font-medium">{r.supplierId}:</span>{' '}
              {r.skipped ? 'übersprungen' : (r.status ?? 'verarbeitet')} – {r.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
