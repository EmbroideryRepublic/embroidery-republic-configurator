/**
 * Admin-Monitoring des Lieferantenprozesses: jede (Bestellung × Lieferant)
 * mit Status, Versuchen, geplantem nächsten Versuch, letztem Fehler und
 * Audit-Verlauf – plus Aktionen (erneut anstoßen / pausieren / abbrechen)
 * und ein manueller Processor-Lauf. Rein lesende Datenbeschaffung; alle
 * Schreibvorgänge laufen über statusmaschinensichere Server Actions.
 */
import Link from 'next/link';
import { listSupplierOrderPipeline, type AdminSupplierPipelineRow } from '@/lib/admin/data';
import { getSupplierDescriptor } from '@/lib/suppliers/registry';
import type { SupplierId } from '@/lib/suppliers';
import { SupplierOrderActions } from '@/components/admin/SupplierOrderActions';
import { RunProcessorButton } from '@/components/admin/RunProcessorButton';
import { isAdminAuthenticated } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  queued: 'bg-blue-50 text-blue-700',
  processing: 'bg-indigo-50 text-indigo-700',
  cart_prepared: 'bg-teal-50 text-teal-700',
  ordered: 'bg-green-50 text-green-700',
  blocked: 'bg-amber-50 text-amber-700',
  paused: 'bg-gray-100 text-gray-500',
  failed: 'bg-red-50 text-red-700',
  cancelled: 'bg-gray-200 text-gray-500',
};

function fmt(ts: string | null): string {
  if (!ts) return '–';
  const d = new Date(ts);
  return d.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
}

function Row({ row }: { row: AdminSupplierPipelineRow }) {
  let supplierLabel = row.supplierId;
  try {
    supplierLabel = getSupplierDescriptor(row.supplierId as SupplierId).label;
  } catch {
    /* unbekannter Lieferant – ID anzeigen */
  }
  const stale = row.status === 'processing' && row.lockedAt && Date.now() - new Date(row.lockedAt).getTime() > 10 * 60_000;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[row.status] ?? 'bg-gray-100'}`}>
            {row.status}
          </span>
          <Link href={`/admin/bestellung/${row.orderId}`} className="text-sm font-medium hover:underline">
            {row.orderNumber}
          </Link>
          <span className="text-xs text-gray-500">· {supplierLabel}</span>
          {stale && <span className="text-xs text-red-600">· Lock verwaist</span>}
        </div>
        <span className="text-xs text-gray-400">akt. {fmt(row.updatedAt)}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        <span>
          Versuche: <strong>{row.attemptCount}</strong>/{row.maxAttempts}
        </span>
        <span>Modus: {row.mode}</span>
        <span>nächster Versuch: {fmt(row.nextAttemptAt)}</span>
        {row.lastError && <span className="text-red-600">Fehler: {row.lastError}</span>}
      </div>

      {row.events.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-gray-500">Verlauf ({row.events.length})</summary>
          <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
            {row.events.map((e, i) => (
              <li key={i}>
                <span className="text-gray-400">{fmt(e.at)}</span> [{e.eventType}]{' '}
                {e.fromStatus || e.toStatus ? `${e.fromStatus ?? '–'}→${e.toStatus ?? '–'} ` : ''}
                {e.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-2">
        <SupplierOrderActions orderId={row.orderId} supplierId={row.supplierId} />
      </div>
    </div>
  );
}

export default async function SupplierPipelinePage() {
  // SICHERHEIT: Die Prüfung MUSS hier stehen, nicht nur im Layout. Next.js
  // rendert Seite und Layout parallel und serialisiert das Seitenergebnis in
  // den RSC-Payload des HTML – auch wenn das Layout `children` verwirft.
  // Ohne diese Wache lagen Kundendaten und signierte Datei-URLs im Quelltext
  // der Login-Seite (real nachgewiesen).
  if (!isAdminAuthenticated()) return null;
  const rows = await listSupplierOrderPipeline();
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Lieferantenprozess – Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">
            Status jeder Lieferantenbestellung, Versuche, geplanter Retry, Fehler und Verlauf. Aktionen respektieren
            die Statusmaschine (kein Doppelbestellen).
          </p>
        </div>
        <RunProcessorButton />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(counts).map(([status, n]) => (
          <span key={status} className={`rounded px-2 py-0.5 ${STATUS_STYLE[status] ?? 'bg-gray-100'}`}>
            {status}: {n}
          </span>
        ))}
        {rows.length === 0 && <span className="text-gray-500">Noch keine Lieferantenbestellungen.</span>}
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <Row key={`${row.orderId}:${row.supplierId}`} row={row} />
        ))}
      </div>
    </section>
  );
}
