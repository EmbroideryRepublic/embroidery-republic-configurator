/**
 * Eigener Rechnungsnummernkreis der Website (Migration 0028).
 *
 * Bewusst AUSSERHALB von lib/invoicing/: Diese Funktion braucht einen
 * Datenbankzugriff, den lib/invoicing/ laut eigenem Architekturtest
 * (__tests__/architektur.test.ts, verbietet u.a. „@supabase" überall in
 * diesem Baum) niemals selbst besitzen darf. orderCompletion.ts – das
 * bereits legitim `createAdminClient()` verwendet – ruft diese Funktion auf
 * und reicht das Ergebnis als reine Closure (`Rechnungsauftrag.
 * naechsteRechnungsnummer`) an den gewählten Rechnungsanbieter weiter. Der
 * Anbieter selbst sieht nie eine Datenbankverbindung.
 */
import type { createAdminClient } from '@/lib/supabase/server';

/**
 * Zieht atomar die nächste Nummer für das übergebene Jahr (siehe
 * naechste_rechnungsnummer() in Migration 0028) und formatiert sie als
 * "RE-{jahr}-{6-stellig}", z.B. "RE-2026-000001".
 *
 * Bewusst ein anderes Präfix als der unabhängige lokale Rechnungsnummernkreis
 * der separaten Buchhaltungs-Anwendung ("ER-...") – siehe Migrationskommentar.
 */
export async function ziehNaechsteRechnungsnummer(
  db: ReturnType<typeof createAdminClient>,
  jahr: number
): Promise<string> {
  const { data, error } = await db.rpc('naechste_rechnungsnummer', { p_jahr: jahr });
  if (error) {
    throw new Error(`Rechnungsnummer konnte nicht gezogen werden: ${error.message}`);
  }
  const nummer = typeof data === 'number' ? data : Number(data);
  if (!Number.isFinite(nummer) || nummer <= 0) {
    throw new Error(`Rechnungsnummer-Funktion lieferte einen unerwarteten Wert: ${JSON.stringify(data)}`);
  }
  return `RE-${jahr}-${String(nummer).padStart(6, '0')}`;
}
