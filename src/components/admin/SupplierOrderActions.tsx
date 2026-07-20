'use client';

/**
 * Aktions-Buttons je Lieferantenbestellung im Admin-Monitoring:
 * erneut anstoßen / pausieren / dauerhaft abbrechen. Jede Aktion ruft eine
 * statusmaschinen- und idempotenzsichere Server Action; das Ergebnis wird
 * inline gezeigt. Ungültige Aktionen (z.B. Abbruch eines laufenden Laufs)
 * werden von der Action abgelehnt und hier als Hinweis dargestellt.
 */
import { useState, useTransition } from 'react';
import {
  cancelSupplierOrderAction,
  pauseSupplierOrderAction,
  retrySupplierOrderAction,
} from '@/lib/actions/admin';

type ActionFn = (orderId: string, supplierId: string) => Promise<{ success: boolean; error?: string }>;

export function SupplierOrderActions({ orderId, supplierId }: { orderId: string; supplierId: string }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (fn: ActionFn, label: string) =>
    startTransition(async () => {
      const r = await fn(orderId, supplierId);
      setMsg({ ok: r.success, text: r.success ? `${label} ok` : (r.error ?? 'Fehler') });
    });

  const btn = 'rounded border px-2 py-0.5 text-xs transition-colors disabled:opacity-50';
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(retrySupplierOrderAction as ActionFn, 'Erneut angestoßen')}
        className={`${btn} border-gold text-gold-dark hover:bg-gold hover:text-white`}
      >
        Erneut anstoßen
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(pauseSupplierOrderAction as ActionFn, 'Pausiert')}
        className={`${btn} border-gray-300 text-gray-600 hover:bg-gray-100`}
      >
        Pausieren
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(cancelSupplierOrderAction as ActionFn, 'Abgebrochen')}
        className={`${btn} border-red-200 text-red-600 hover:bg-red-50`}
      >
        Abbrechen
      </button>
      {msg && <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
    </div>
  );
}
