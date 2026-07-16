/**
 * Supabase-Client für die Verwendung im Browser (Client Components).
 * Nutzt den öffentlichen anon-key – Zugriff wird über Row Level Security
 * in der Datenbank eingeschränkt (siehe supabase/migrations/0001_init.sql).
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
