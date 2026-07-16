/**
 * Supabase-Client für die Verwendung auf dem Server
 * (Server Components, Route Handlers, Server Actions).
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Aufruf aus einer Server Component ohne Schreibrechte auf Cookies –
            // kann ignoriert werden, wenn Middleware die Session aktualisiert.
          }
        },
      },
    }
  );
}

/**
 * Admin-Client mit service_role-Key – NUR serverseitig verwenden
 * (z.B. für Admin-Bereich, PDF-Erstellung, Bestellungen lesen).
 * Niemals in Client Components importieren!
 */
export function createAdminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
