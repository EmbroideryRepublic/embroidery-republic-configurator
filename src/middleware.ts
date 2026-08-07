/**
 * Aktualisiert die Supabase-Auth-Sitzung (Kundenkonto) je Anfrage.
 *
 * ── Warum überhaupt Middleware, wo das Projekt bisher bewusst keine hatte ─
 * `docs/next-upgrade-entscheidung.md` führte "keine middleware.ts" als Beleg
 * dafür an, dass zwei Middleware-spezifische npm-Advisories nicht anwendbar
 * sind. Mit dem Kundenkonto (additiv, supabase/migrations/0023) kommt jetzt
 * genau eine Middleware hinzu – aber bewusst so eng wie möglich gehalten:
 *
 *   1. NUR für /konto/* und /auth/* (siehe `matcher` unten) – der gesamte
 *      übrige Shop (Produktseiten, Konfigurator, Checkout) bleibt exakt so
 *      unberührt wie zuvor.
 *   2. KEINE Redirects hier – nur Sitzungs-Cookies auffrischen. Die
 *      Zugriffskontrolle für geschützte /konto-Unterseiten passiert in der
 *      jeweiligen Seite selbst (Server-Component-`redirect()`), nicht in
 *      der Middleware. Genau das eine der beiden zuvor ausgeschlossenen
 *      Advisories (Middleware/Proxy-Redirect-Cache-Poisoning) betraf
 *      Middleware, die selbst umleitet – das tut diese hier nicht.
 *
 * `docs/next-upgrade-entscheidung.md` ist entsprechend zu ergänzen (siehe
 * dortiger Verweis auf diese Datei).
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  // Ohne konfigurierte Supabase-Zugangsdaten (z.B. lokale Umgebung ohne
  // Projekt, siehe docs/entscheidungen-produktionsreife.md Abschnitt 3)
  // WIRFT `createServerClient` synchron – eine Middleware ohne Auffangnetz
  // hätte damit JEDE Anfrage an /konto/* und /auth/* mit 500 beantwortet,
  // real nachgewiesen beim abschließenden Grün-Gate dieses Durchlaufs. Sie
  // ist reine Sitzungsauffrischung (kein Redirect, keine Zugriffsprüfung –
  // die liegt weiterhin in den Seiten selbst über `aktuellerKunde()`, das
  // ebenfalls fail-closed auf "nicht angemeldet" zurückfällt), deshalb hier
  // bewusst weich statt hart abgesichert: Ohne Zugangsdaten oder bei einem
  // sonstigen Fehler läuft die Anfrage unverändert durch, statt die gesamte
  // Kontostrecke lahmzulegen.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return response;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        // Dieselben cookieOptions wie in lib/supabase/server.ts – sonst
        // überschriebe die Middleware (läuft vor jeder /konto-Anfrage) das
        // dort gesetzte Cookie wieder mit den schwächeren Library-Defaults.
        cookieOptions: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        },
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request: { headers: request.headers } });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      }
    );

    // getUser() statt getSession(): prüft den Token gegen den Auth-Server
    // nach und erneuert ihn bei Bedarf – reiner Lesezugriff, kein Redirect.
    await supabase.auth.getUser();
  } catch (fehler) {
    console.error('[middleware] Sitzungsauffrischung fehlgeschlagen (nicht-fatal):', fehler instanceof Error ? fehler.message : fehler);
  }

  return response;
}

export const config = {
  matcher: ['/konto/:path*', '/auth/:path*'],
};
