/**
 * Beliebtheit aus echten Verkaufszahlen.
 *
 * Bewusst KEIN Produktfeld: Beliebtheit ist nichts, was gepflegt wird,
 * sondern etwas, das entsteht. Grundlage sind die bestellten Mengen aus
 * `order_items` – damit wächst die Sortierung von selbst mit dem Geschäft.
 *
 * ── Fehler dürfen die Shop-Seite nie umwerfen ─────────────────────────
 * Schlägt die Abfrage fehl, wird eine leere Auswertung zurückgegeben; die
 * Sortierung fällt dann auf den nachvollziehbaren Ersatz zurück
 * (Qualitätsstufe, dann Preis – siehe filter.ts). Ein Datenbankproblem
 * verändert die Reihenfolge, aber es zeigt keine Fehlerseite.
 */
import { createAdminClient } from '@/lib/supabase/server';
import type { Beliebtheit } from './filter';

/** Zeitfenster: Was vor einem Vierteljahr gefragt war, sagt heute wenig. */
const FENSTER_TAGE = 90;
/** Zwischenspeicher – die Zahlen ändern sich in Minuten nicht spürbar. */
const GUELTIG_MS = 60 * 60 * 1000;

let zwischenspeicher: { werte: Beliebtheit; bis: number } | null = null;

export async function ladeBeliebtheit(): Promise<Beliebtheit> {
  if (zwischenspeicher && zwischenspeicher.bis > Date.now()) return zwischenspeicher.werte;

  const werte: Beliebtheit = {};
  try {
    const seit = new Date(Date.now() - FENSTER_TAGE * 24 * 60 * 60 * 1000).toISOString();
    const db = createAdminClient();
    const { data, error } = await db
      .from('order_items')
      .select('product_id, quantity, orders!inner(created_at)')
      .gte('orders.created_at', seit);

    if (!error && data) {
      for (const zeile of data as { product_id: string; quantity: number }[]) {
        werte[zeile.product_id] = (werte[zeile.product_id] ?? 0) + (zeile.quantity ?? 0);
      }
    }
  } catch {
    // Bewusst still: siehe Kopfkommentar.
  }

  zwischenspeicher = { werte, bis: Date.now() + GUELTIG_MS };
  return werte;
}
