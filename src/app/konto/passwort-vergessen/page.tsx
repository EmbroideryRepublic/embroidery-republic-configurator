import Link from 'next/link';
import { PasswortVergessenForm } from '@/components/konto/PasswortVergessenForm';

export const metadata = {
  title: 'Passwort vergessen',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function PasswortVergessenPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <Link href="/konto/anmelden" className="text-xs text-brand/50 hover:text-brand">
        ← Zur Anmeldung
      </Link>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-brand">Passwort vergessen</h1>
      <p className="mt-1 mb-6 text-sm text-brand/60">
        Geben Sie Ihre E-Mail-Adresse ein – wir senden Ihnen einen Link zum Zurücksetzen.
      </p>
      <div className="rounded-2xl border border-gold/20 bg-white p-5 shadow-elegant">
        <PasswortVergessenForm />
      </div>
    </main>
  );
}
