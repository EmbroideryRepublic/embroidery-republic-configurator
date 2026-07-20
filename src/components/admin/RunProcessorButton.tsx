'use client';

/**
 * Löst den Hintergrund-Processor manuell aus (verarbeitet fällige
 * Lieferantenbestellungen jetzt) – nützlich zum Testen ohne aktiven Cron.
 * Im Produktivbetrieb übernimmt das ein Scheduler via /api/cron/...
 */
import { useState, useTransition } from 'react';
import { runSupplierProcessorAction } from '@/lib/actions/admin';

export function RunProcessorButton() {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const r = await runSupplierProcessorAction();
            setMsg(r.error ?? (r.success ? 'fertig' : 'Fehler'));
          })
        }
        className="rounded bg-gold px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gold-dark disabled:opacity-50"
      >
        {isPending ? 'Verarbeite fällige …' : 'Fällige jetzt verarbeiten'}
      </button>
      {msg && <span className="text-xs text-gray-600">{msg}</span>}
    </div>
  );
}
