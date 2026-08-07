/**
 * Wer ist (falls überhaupt jemand) als Kundenkonto angemeldet?
 *
 * Einzige Stelle, die den SSR-Supabase-Client für die Sitzungsprüfung
 * verwendet – Seiten und Server Actions rufen ausschließlich `aktuellerKunde()`
 * auf, nie `createClient().auth.*` direkt. Genau das Muster, das das Projekt
 * bereits für Admin-Auth (`lib/admin/auth.ts`) und Steuersätze
 * (`config/pricing/steuer.ts`) durchhält: eine Stelle, die die Frage
 * beantwortet, kein Aufrufer rät selbst.
 *
 * `supabase.auth.getUser()` statt `getSession()`: `getUser()` prüft den
 * Token gegen den Supabase-Auth-Server nach, `getSession()` läse ihn nur aus
 * dem (clientseitig fälschbaren) Cookie. Für jede Zugriffsentscheidung ist
 * das der einzig sichere Weg – von Supabase selbst so empfohlen.
 */
import { createClient } from '@/lib/supabase/server';

export interface AngemeldeterKunde {
  id: string;
  email: string;
}

export async function aktuellerKunde(): Promise<AngemeldeterKunde | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;
    return { id: user.id, email: user.email };
  } catch (fehler) {
    // Kein Cookie-Kontext oder Supabase nicht erreichbar – wie überall sonst
    // im Projekt: fail-closed für eine Zugriffsentscheidung (siehe
    // lib/admin/auth.ts, istAdmin()), nicht fail-open.
    console.error('[konto] Sitzung konnte nicht geprüft werden:', fehler instanceof Error ? fehler.message : fehler);
    return null;
  }
}
