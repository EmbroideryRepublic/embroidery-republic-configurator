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
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
 * Admin-Client mit Secret Key – NUR serverseitig verwenden (z.B. für
 * Admin-Bereich, Storage-Uploads in orders.ts, Bestellungen lesen).
 * Löst seit Sommer 2025 den alten "service_role"-Key ab (gleiche
 * vollen Rechte, RLS wird umgangen – Format "sb_secret_...", siehe
 * https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).
 * Niemals in Client Components importieren!
 */
export function createAdminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
