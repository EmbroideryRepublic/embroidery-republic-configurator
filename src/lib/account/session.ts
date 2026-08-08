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

/**
 * Unterscheidet eine frische Recovery-Sitzung (aus dem Link der "Passwort
 * vergessen"-E-Mail) von einer ganz normalen, bereits angemeldeten Sitzung.
 * Ohne diese Prüfung könnte jede aktive Sitzung – z.B. eine an einem fremden
 * Gerät vergessene – ein neues Passwort setzen, ohne das alte zu kennen.
 * `getClaims()` verifiziert das Access Token (serverseitig bei symmetrischem
 * Signing, sonst per WebCrypto) und liefert den `amr`-Claim (Authentication
 * Method Reference) – bei einem über den Recovery-Link getauschten Code
 * enthält er `recovery`, bei einer normalen Anmeldung z.B. `password`. Jeder
 * Fehler oder unklare Zustand fällt auf "keine Recovery-Sitzung" zurück
 * (fail-closed, wie überall sonst bei Zugriffsentscheidungen).
 *
 * WICHTIG: Diese Funktion muss sowohl von der Seite (UI-Gating) ALS AUCH von
 * `passwortZuruecksetzenAction` (der eigentlichen Mutation) aufgerufen
 * werden. Die Seite entscheidet nur, was gerendert wird – ein direkter
 * Aufruf der Server Action (die Next.js-Action-ID steckt im ausgelieferten
 * JS-Bundle, unabhängig vom gerenderten Zweig) würde die UI-Prüfung sonst
 * vollständig umgehen.
 */
export async function istRecoverySitzung(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) return false;
    const amr = data.claims.amr;
    if (!Array.isArray(amr)) return false;
    return amr.some((eintrag) => (typeof eintrag === 'string' ? eintrag === 'recovery' : eintrag?.method === 'recovery'));
  } catch {
    return false;
  }
}
