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
 * die Freigabe haengengebliebener Phase-2-/Rechnungs-Ansprueche. Zusaetzlich
 * (eigene Schritte, kein reiner SQL-Aufraeumer): Rechnungserstellungen UND
 * Bestellabschluesse (Phase 2) nachholen, die sauber fehlgeschlagen sind und
 * seitdem nie wiederholt wurden (siehe holeOffeneRechnungenNach in
 * lib/orders/orderCompletion.ts und holeOffeneAbschluesseNach in
 * lib/orders/paymentService.ts).
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
import { holeOffeneRechnungenNach } from '@/lib/orders/orderCompletion';
import { holeOffeneBestellbestaetigungenNach } from '@/lib/orders/orderCompletion';
import { holeOffeneAbschluesseNach } from '@/lib/orders/paymentService';
import { holeOffeneErstattungenNach } from '@/lib/orders/refundService';
import {
  ABSCHLUSS_CLAIM_VERWAIST_NACH_MINUTEN,
  ABSCHLUSS_RETRY_LIMIT,
  ZAHLUNG_VERFAELLT_NACH_STUNDEN,
} from '@/config/zahlung';
import { ANFRAGE_LOESCHT_NACH_MONATEN, BESTELLUNG_ANONYMISIERT_NACH_JAHREN } from '@/config/dsgvo';
import { RECHNUNG_CLAIM_VERWAIST_NACH_MINUTEN, RECHNUNG_RETRY_LIMIT } from '@/config/rechnung';
import { VERSANDLABEL_CLAIM_VERWAIST_NACH_MINUTEN } from '@/config/versand';
import { ERSTATTUNG_CLAIM_VERWAIST_NACH_MINUTEN, ERSTATTUNG_RETRY_LIMIT } from '@/config/rueckerstattung';
import { BESTAETIGUNG_CLAIM_VERWAIST_NACH_MINUTEN, BESTAETIGUNG_RETRY_LIMIT } from '@/config/bestaetigung';

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

  // ── Offene Bestellabschlüsse (Phase 2) nachholen ────────────────────
  // VOR den offenen Rechnungen: Ein hier nachgeholter Abschluss legt intern
  // meist auch gleich die Rechnung an (schliesseBestellungAb → erzeugeRechnung).
  // Schlägt nur die Rechnung dabei sauber fehl, greift im selben Lauf direkt
  // der nachfolgende Schritt. Bewusst einzeln abgefangen, aus demselben Grund
  // wie die Wartung oben.
  let abschluesseNachgeholt: { gefunden: number; abgeschlossen: number; weiterhinOffen: number } | { fehler: string };
  try {
    abschluesseNachgeholt = await holeOffeneAbschluesseNach(ABSCHLUSS_RETRY_LIMIT);
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler);
    protokoll.fehler('CRON', 'abschluss_retry_fehlgeschlagen', meldung);
    abschluesseNachgeholt = { fehler: meldung };
  }

  // ── Offene Rechnungen nachholen ─────────────────────────────────────
  // Eigener Schritt statt Teil von raeumeAuf(): Jeder Treffer rendert ein
  // PDF und verschickt eine echte E-Mail – kein reiner SQL-Aufräumschritt.
  // Bewusst einzeln abgefangen, aus demselben Grund wie die Wartung oben.
  let rechnungenNachgeholt: { gefunden: number; erstellt: number; fehlgeschlagen: number } | { fehler: string };
  try {
    rechnungenNachgeholt = await holeOffeneRechnungenNach(RECHNUNG_RETRY_LIMIT);
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler);
    protokoll.fehler('CRON', 'rechnungs_retry_fehlgeschlagen', meldung);
    rechnungenNachgeholt = { fehler: meldung };
  }

  // ── Offene Rückerstattungen nachholen ───────────────────────────────
  // Eigener Schritt statt Teil von raeumeAuf(): Jeder Treffer löst einen
  // echten Zahlungsanbieter-Aufruf aus – kein reiner SQL-Aufräumschritt.
  // Bewusst einzeln abgefangen, aus demselben Grund wie die Wartung oben.
  let erstattungenNachgeholt: { gefunden: number; erstattet: number; weiterhinOffen: number } | { fehler: string };
  try {
    erstattungenNachgeholt = await holeOffeneErstattungenNach(ERSTATTUNG_RETRY_LIMIT);
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler);
    protokoll.fehler('CRON', 'erstattungs_retry_fehlgeschlagen', meldung);
    erstattungenNachgeholt = { fehler: meldung };
  }

  // ── Offene Bestellbestätigungen nachholen ───────────────────────────
  // Eigener Schritt statt Teil von raeumeAuf(): Jeder Treffer löst einen
  // echten Versandversuch beim Mail-Anbieter aus – kein reiner SQL-
  // Aufräumschritt. Bewusst einzeln abgefangen, aus demselben Grund wie die
  // Wartung oben. Siehe Vorfall 2026-08-21 (Migration 0030).
  let bestaetigungenNachgeholt: { gefunden: number; zugestellt: number; weiterhinOffen: number } | { fehler: string };
  try {
    bestaetigungenNachgeholt = await holeOffeneBestellbestaetigungenNach(BESTAETIGUNG_RETRY_LIMIT);
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler);
    protokoll.fehler('CRON', 'bestaetigungs_retry_fehlgeschlagen', meldung);
    bestaetigungenNachgeholt = { fehler: meldung };
  }

  return NextResponse.json({
    ok: true,
    reclaimed,
    wartung,
    abschluesseNachgeholt,
    rechnungenNachgeholt,
    erstattungenNachgeholt,
    bestaetigungenNachgeholt,
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
  rechnungserstellungenFreigegeben: number;
  versandlabelFreigegeben: number;
  erstattungenFreigegeben: number;
  bestaetigungenFreigegeben: number;
  anfragenGeloescht: number;
  bestellungenAnonymisiert: number;
  fehler?: string;
}> {
  const leer = {
    rateLimitFenster: 0,
    sitzungen: 0,
    ereignisse: 0,
    zahlungenVerfallen: 0,
    abschluesseFreigegeben: 0,
    rechnungserstellungenFreigegeben: 0,
    versandlabelFreigegeben: 0,
    erstattungenFreigegeben: 0,
    bestaetigungenFreigegeben: 0,
    anfragenGeloescht: 0,
    bestellungenAnonymisiert: 0,
  };
  try {
    const db = createAdminClient();
    const [limits, sitzungen, ereignisse, verfall, haengend, rechnungHaengend, versandHaengend, erstattungHaengend, bestaetigungHaengend, anfragen, anonymisiert] = await Promise.all([
      db.rpc('raeume_rate_limit_auf'),
      db.rpc('raeume_admin_sitzungen_auf'),
      db.rpc('raeume_system_ereignisse_auf'),
      // Z3: offene Zahlungen nach der Frist auf 'failed'.
      db.rpc('verfalle_offene_zahlungen', { p_stunden: ZAHLUNG_VERFAELLT_NACH_STUNDEN }),
      // Z5: hängengebliebene Phase-2-Ansprüche freigeben, damit ein neuer
      // Lauf sie übernimmt (Absturz mitten in Phase 2).
      db.rpc('gib_haengende_abschluesse_frei', { p_minuten: ABSCHLUSS_CLAIM_VERWAIST_NACH_MINUTEN }),
      // Migration 0026: dasselbe Prinzip für Rechnungs- und Label-Erstellung.
      db.rpc('gib_haengende_rechnungserstellung_frei', { p_minuten: RECHNUNG_CLAIM_VERWAIST_NACH_MINUTEN }),
      db.rpc('gib_haengende_versandlabel_frei', { p_minuten: VERSANDLABEL_CLAIM_VERWAIST_NACH_MINUTEN }),
      // Migration 0029: dasselbe Prinzip für die Rückerstattung – sicher
      // dank stabilem Idempotenzschlüssel, siehe config/rueckerstattung.ts.
      db.rpc('gib_haengende_erstattungen_frei', { p_minuten: ERSTATTUNG_CLAIM_VERWAIST_NACH_MINUTEN }),
      // Migration 0030: dasselbe Prinzip für die Bestellbestätigung.
      db.rpc('gib_haengende_bestellbestaetigungen_frei', { p_minuten: BESTAETIGUNG_CLAIM_VERWAIST_NACH_MINUTEN }),
      // DSGVO (H6, Migration 0022): Anfragen ohne Vertrag löschen und
      // Bestellungen nach Ablauf der steuerlichen Aufbewahrungsfrist
      // anonymisieren – siehe docs/dsgvo-loeschkonzept.md. Bei den heutigen
      // (jungen) Testdaten dauerhaft ein No-op, bis Daten tatsächlich so alt
      // werden; genau dann soll es aber ohne manuellen Eingriff greifen.
      db.rpc('loesche_alte_anfragen', { p_monate: ANFRAGE_LOESCHT_NACH_MONATEN }),
      db.rpc('anonymisiere_alte_bestellungen', { p_jahre: BESTELLUNG_ANONYMISIERT_NACH_JAHREN }),
    ]);
    const fehlerObj =
      limits.error || sitzungen.error || ereignisse.error || verfall.error || haengend.error ||
      rechnungHaengend.error || versandHaengend.error || erstattungHaengend.error || bestaetigungHaengend.error ||
      anfragen.error || anonymisiert.error;
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
      rechnungserstellungenFreigegeben: (rechnungHaengend.data as number) ?? 0,
      versandlabelFreigegeben: (versandHaengend.data as number) ?? 0,
      erstattungenFreigegeben: (erstattungHaengend.data as number) ?? 0,
      bestaetigungenFreigegeben: (bestaetigungHaengend.data as number) ?? 0,
      anfragenGeloescht: (anfragen.data as number) ?? 0,
      bestellungenAnonymisiert: (anonymisiert.data as number) ?? 0,
    };
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler);
    protokoll.fehler('CRON', 'aufraeumen_fehlgeschlagen', meldung);
    return { ...leer, fehler: meldung };
  }
}
