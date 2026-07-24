/**
 * Geschützter Cron-Endpoint: verarbeitet alle fälligen Lieferanten-
 * bestellungen (queued + fällig) und übernimmt verwaiste Locks. Von einem
 * externen Scheduler (z.B. alle paar Minuten) aufzurufen – so läuft der
 * gesamte Lieferantenprozess autonom, ohne Admin-Klick.
 *
 * Absicherung ueber ein Shared Secret (CRON_SECRET), ausschliesslich als
 * `Authorization: Bearer <CRON_SECRET>`. Ohne konfiguriertes Secret liefert
 * der Endpoint bewusst 503 (nicht scharf schalten, solange nicht
 * abgesichert).
 *
 * Uebernimmt zusaetzlich die Wartung: abgelaufene Rate-Limit-Fenster,
 * Admin-Sitzungen und Systemereignisse, den Verfall offener Zahlungen sowie
 * die Freigabe haengengebliebener Phase-2-Ansprueche.
 *
 * Beispiel (manuell/Test):
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        http://localhost:3001/api/cron/process-supplier-orders
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { protokoll } from '@/lib/observability/log';
import { processDueSupplierOrders } from '@/lib/suppliers/lifecycle/orchestrator';
import { ABSCHLUSS_CLAIM_VERWAIST_NACH_MINUTEN, ZAHLUNG_VERFAELLT_NACH_STUNDEN } from '@/config/zahlung';

export const dynamic = 'force-dynamic';
// Läufe können (mit echter Browser-Automatisierung) länger dauern.
export const maxDuration = 60;

async function handle(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET nicht konfiguriert – Endpoint deaktiviert.' }, { status: 503 });
  }
  // NUR über den Authorization-Header. Der frühere Weg über
  // `?secret=...` ist am 2026-07-22 entfallen: Query-Parameter landen in
  // Server-Zugriffsprotokollen, in der Browser-Historie, im Referer-Header
  // und in Fehlerberichten. Genau dafür gibt es den Header.
  //
  // Zeitkonstanter Vergleich, damit die Laufzeit nicht verrät, wie viele
  // Zeichen stimmten – dasselbe Vorgehen wie bei orderAccessToken.ts.
  const mitgeliefert = req.headers.get('authorization') ?? '';
  const erwartet = `Bearer ${secret}`;
  const a = createHash('sha256').update(mitgeliefert).digest();
  const b = createHash('sha256').update(erwartet).digest();
  if (!timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '25') || 25;
  const { reclaimed, processed } = await processDueSupplierOrders({ limit });

  // ── Wartung ───────────────────────────────────────────────────────
  // Mehrere Tabellen wachsen ohne Pflege (Rate-Limit-Fenster, Sitzungen,
  // Ereignisse); zusätzlich verfallen offene Zahlungen und werden verwaiste
  // Phase-2-Ansprüche freigegeben. Alles hier anzuhängen spart eine zweite
  // Route, die man absichern, überwachen und einplanen müsste.
  //
  // Läuft NACH der eigentlichen Aufgabe und wird einzeln abgefangen: Ein
  // Fehler in der Wartung darf die Lieferantenverarbeitung nicht entwerten.
  const wartung = await raeumeAuf();

  return NextResponse.json({
    ok: true,
    reclaimed,
    wartung,
    processed: processed.length,
    results: processed.map((r) => ({ supplierId: r.supplierId, skipped: r.skipped, status: r.status, reason: r.reason })),
  });
}

export const GET = handle;
export const POST = handle;

/**
 * Wartung: Aufräumen, Zahlungsverfall, Freigabe verwaister Ansprüche.
 *
 * Wirft nie: Das Ergebnis wird berichtet, nicht erzwungen. Die Route hat
 * eine andere Hauptaufgabe, und eine misslungene Wartung ist kein Grund,
 * sie fehlschlagen zu lassen.
 */
async function raeumeAuf(): Promise<{
  rateLimitFenster: number;
  sitzungen: number;
  ereignisse: number;
  zahlungenVerfallen: number;
  abschluesseFreigegeben: number;
  fehler?: string;
}> {
  const leer = { rateLimitFenster: 0, sitzungen: 0, ereignisse: 0, zahlungenVerfallen: 0, abschluesseFreigegeben: 0 };
  try {
    const db = createAdminClient();
    const [limits, sitzungen, ereignisse, verfall, haengend] = await Promise.all([
      db.rpc('raeume_rate_limit_auf'),
      db.rpc('raeume_admin_sitzungen_auf'),
      db.rpc('raeume_system_ereignisse_auf'),
      // Z3: offene Zahlungen nach der Frist auf 'failed'.
      db.rpc('verfalle_offene_zahlungen', { p_stunden: ZAHLUNG_VERFAELLT_NACH_STUNDEN }),
      // Z5: hängengebliebene Phase-2-Ansprüche freigeben, damit ein neuer
      // Lauf sie übernimmt (Absturz mitten in Phase 2).
      db.rpc('gib_haengende_abschluesse_frei', { p_minuten: ABSCHLUSS_CLAIM_VERWAIST_NACH_MINUTEN }),
    ]);
    const fehlerObj = limits.error || sitzungen.error || ereignisse.error || verfall.error || haengend.error;
    if (fehlerObj) {
      protokoll.fehler('CRON', 'aufraeumen_fehlgeschlagen', fehlerObj.message);
      return { ...leer, fehler: fehlerObj.message };
    }
    return {
      rateLimitFenster: (limits.data as number) ?? 0,
      sitzungen: (sitzungen.data as number) ?? 0,
      ereignisse: (ereignisse.data as number) ?? 0,
      zahlungenVerfallen: (verfall.data as number) ?? 0,
      abschluesseFreigegeben: (haengend.data as number) ?? 0,
    };
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler);
    protokoll.fehler('CRON', 'aufraeumen_fehlgeschlagen', meldung);
    return { ...leer, fehler: meldung };
  }
}
