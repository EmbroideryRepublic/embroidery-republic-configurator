/**
 * Supabase-Client für die Verwendung im Browser (Client Components).
 * Nutzt den öffentlichen Publishable Key (löst seit Sommer 2025 den alten
 * "anon"-Key ab, siehe https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
 * – gleiche Rechte, gleiche RLS-Wirkung, nur neues Format "sb_publishable_...").
 * Zugriff wird über Row Level Security in der Datenbank eingeschränkt
 * (siehe supabase/migrations/0001_init.sql).
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
