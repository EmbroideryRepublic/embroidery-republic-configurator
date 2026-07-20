/**
 * Geschützter Cron-Endpoint: verarbeitet alle fälligen Lieferanten-
 * bestellungen (queued + fällig) und übernimmt verwaiste Locks. Von einem
 * externen Scheduler (z.B. alle paar Minuten) aufzurufen – so läuft der
 * gesamte Lieferantenprozess autonom, ohne Admin-Klick.
 *
 * Absicherung über ein Shared Secret (CRON_SECRET): entweder als
 * `Authorization: Bearer <CRON_SECRET>` (Vercel-Cron-Konvention) oder als
 * `?secret=<CRON_SECRET>`. Ohne konfiguriertes Secret liefert der Endpoint
 * bewusst 503 (nicht scharf schalten, solange nicht abgesichert).
 *
 * Beispiel (manuell/Test):
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        http://localhost:3001/api/cron/process-supplier-orders
 */
import { NextResponse, type NextRequest } from 'next/server';
import { processDueSupplierOrders } from '@/lib/suppliers/lifecycle/orchestrator';

export const dynamic = 'force-dynamic';
// Läufe können (mit echter Browser-Automatisierung) länger dauern.
export const maxDuration = 60;

async function handle(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET nicht konfiguriert – Endpoint deaktiviert.' }, { status: 503 });
  }
  const authorized =
    req.headers.get('authorization') === `Bearer ${secret}` || req.nextUrl.searchParams.get('secret') === secret;
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '25') || 25;
  const { reclaimed, processed } = await processDueSupplierOrders({ limit });

  return NextResponse.json({
    ok: true,
    reclaimed,
    processed: processed.length,
    results: processed.map((r) => ({ supplierId: r.supplierId, skipped: r.skipped, status: r.status, reason: r.reason })),
  });
}

export const GET = handle;
export const POST = handle;
