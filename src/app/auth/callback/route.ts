/**
 * Ziel jedes Links aus den Konto-E-Mails (Registrierung bestätigen, Passwort
 * zurücksetzen) – der Link wird in lib/actions/konto.ts mit
 * `baueKontoLink()` (lib/account/authLink.ts) gebaut:
 * `/auth/callback?typ=…&token_hash=…`.
 *
 * Diese Route löst das Einmal-Token serverseitig mit `verifyOtp` ein – danach
 * ist der Sitzungs-Cookie gesetzt und die Person angemeldet. Das ist bewusst
 * NICHT Supabases „action_link": der leitet nur weiter, wenn `redirectTo`
 * exakt in der Dashboard-Allowlist steht, und liefert die Sitzung im
 * URL-Fragment (für den Server unlesbar) statt als `code`. Begründung und
 * Beleg: authLink.ts. Der `code`-Zweig bleibt für den PKCE-Ablauf erhalten.
 *
 * `typ` unterscheidet, wohin es geht und ob eine Willkommensmail folgt:
 *   - 'registrierung' → Konto ist ab jetzt bestätigt; Willkommensmail; zum
 *     Konto-Dashboard.
 *   - 'zuruecksetzen' → zur Passwort-Eingabeseite (die Sitzung aus dem
 *     Recovery-Link erlaubt dort GENAU EINE Aktion: ein neues Passwort
 *     setzen, siehe passwortZuruecksetzenAction).
 */
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { istGueltigerTokenHash, otpTypFuer } from '@/lib/account/authLink';
import { protokoll } from '@/lib/observability/log';
import { sendeWillkommensMailFuerBestaetigung, aktiviereNewsletterNachBestaetigung } from '@/lib/actions/konto';

/**
 * Löst den Link ein und liefert die Person – oder null, wenn der Link
 * ungültig, abgelaufen oder schon benutzt ist. Jeder Fehler (auch ein
 * Konfigurationsfehler) endet als „Link ungültig": nie ein Absturz, nie eine
 * halb eingerichtete Sitzung.
 */
async function loeseLinkEin(searchParams: URLSearchParams): Promise<User | null> {
  try {
    const supabase = createClient();

    const tokenHash = searchParams.get('token_hash');
    if (tokenHash) {
      const otpTyp = otpTypFuer(searchParams.get('typ'));
      if (!otpTyp || !istGueltigerTokenHash(tokenHash)) return null;
      const { data, error } = await supabase.auth.verifyOtp({ type: otpTyp, token_hash: tokenHash });
      return error ? null : data.user;
    }

    const code = searchParams.get('code');
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      return error ? null : data.user;
    }
  } catch (fehler) {
    protokoll.fehler('AUTH', 'callback_fehlgeschlagen', 'Auth-Link konnte nicht eingelöst werden.', fehler);
  }
  return null;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const typ = searchParams.get('typ');

  const user = await loeseLinkEin(searchParams);
  // Weder Token noch Sitzung dürfen zwischengespeichert werden.
  const antwort = (pfad: string) => {
    const res = NextResponse.redirect(`${origin}${pfad}`);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  };

  if (!user) return antwort('/konto/anmelden?fehler=link-ungueltig');

  if (typ === 'registrierung' && user.email) {
    // Nicht-fatal: Ein Fehler beim Versand der Willkommensmail darf die
    // erfolgreich abgeschlossene Bestätigung nicht rückgängig machen –
    // dieselbe Haltung wie überall sonst im Bestellvorgang (E-Mail ist
    // "nice to have", die eigentliche Aktion bereits vollzogen).
    await sendeWillkommensMailFuerBestaetigung(user.email).catch(() => {});
    // Newsletter-Absicht aus der Registrierung (Parameter im Link, siehe
    // registrierenAction) – erst JETZT, nach eingelöstem Link, darf sie
    // tatsächlich aktiviert werden.
    if (searchParams.get('newsletter') === '1') {
      await aktiviereNewsletterNachBestaetigung(user.id, user.email).catch(() => {});
    }
  }
  return antwort(typ === 'zuruecksetzen' ? '/konto/passwort-zuruecksetzen' : '/konto');
}
