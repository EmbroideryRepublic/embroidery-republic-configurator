/**
 * Ziel jedes Supabase-Auth-Links (Registrierung bestätigen, Passwort
 * zurücksetzen) – siehe lib/actions/konto.ts, wo `redirectTo` auf genau
 * diese Route zeigt.
 *
 * Supabases eigener Verify-Endpunkt prüft den Link zuerst selbst und leitet
 * ERST DANACH hierher weiter, mit einem PKCE-`code` im Query-String (der
 * von `@supabase/ssr` erwartete Standardablauf). Diese Route tauscht den
 * Code gegen eine Sitzung – danach ist der Cookie gesetzt und die Person
 * ist angemeldet.
 *
 * `typ` (aus dem in konto.ts gesetzten `redirectTo`) unterscheidet, wohin es
 * geht und ob eine Willkommensmail folgt:
 *   - 'registrierung' → Konto ist ab jetzt bestätigt; Willkommensmail; zum
 *     Konto-Dashboard.
 *   - 'zuruecksetzen' → zur Passwort-Eingabeseite (die Sitzung aus dem
 *     Recovery-Link erlaubt dort GENAU EINE Aktion: ein neues Passwort
 *     setzen, siehe passwortZuruecksetzenAction).
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendeWillkommensMailFuerBestaetigung, aktiviereNewsletterNachBestaetigung } from '@/lib/actions/konto';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const typ = searchParams.get('typ');

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (typ === 'registrierung' && data.user?.email) {
        // Nicht-fatal: Ein Fehler beim Versand der Willkommensmail darf die
        // erfolgreich abgeschlossene Bestätigung nicht rückgängig machen –
        // dieselbe Haltung wie überall sonst im Bestellvorgang (E-Mail ist
        // "nice to have", die eigentliche Aktion bereits vollzogen).
        await sendeWillkommensMailFuerBestaetigung(data.user.email).catch(() => {});
        // Newsletter-Absicht aus der Registrierung (siehe redirectTo in
        // registrierenAction) – erst JETZT, nach bestätigtem Code-Tausch,
        // darf sie tatsächlich aktiviert werden.
        if (searchParams.get('newsletter') === '1') {
          await aktiviereNewsletterNachBestaetigung(data.user.id, data.user.email).catch(() => {});
        }
      }
      const ziel = typ === 'zuruecksetzen' ? '/konto/passwort-zuruecksetzen' : '/konto';
      return NextResponse.redirect(`${origin}${ziel}`);
    }
  }

  return NextResponse.redirect(`${origin}/konto/anmelden?fehler=link-ungueltig`);
}
