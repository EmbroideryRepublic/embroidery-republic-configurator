/**
 * Admin-Layout mit Zugangs-Gate: ohne gültiges Admin-Cookie wird statt
 * der Kinder-Seiten das Login-Formular gerendert. Schreibende Server
 * Actions prüfen die Authentifizierung zusätzlich selbst (Defense in
 * Depth – das Layout schützt nur die Anzeige).
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { isAdminAuthenticated, isAdminConfigured } from '@/lib/admin/auth';
import { adminLogout } from '@/lib/actions/admin';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin | Embroidery Republic',
  robots: { index: false, follow: false },
};

// Auth hängt an Cookies – die Seiten dürfen nie statisch vorgerendert werden.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthenticated()) {
    return (
      <main className="min-h-screen bg-brand-light px-4">
        <AdminLoginForm configured={isAdminConfigured()} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-light">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm font-semibold">
              Embroidery Republic · Admin
            </Link>
            <Link href="/admin/lieferanten-bestellungen" className="text-xs text-gray-500 hover:text-gray-800">
              Lieferantenprozess
            </Link>
            <Link href="/admin/lieferanten" className="text-xs text-gray-500 hover:text-gray-800">
              Lieferanten-Mapping
            </Link>
          </div>
          <form action={adminLogout}>
            <button type="submit" className="text-xs text-gray-500 hover:text-gray-800">
              Abmelden
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </main>
  );
}
