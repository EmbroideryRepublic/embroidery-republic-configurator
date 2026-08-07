import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { aktuellerKunde } from '@/lib/account/session';
import { AnmeldenForm } from '@/components/konto/AnmeldenForm';

export const metadata = {
  title: 'Anmelden',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function AnmeldenPage() {
  const kunde = await aktuellerKunde();
  if (kunde) redirect('/konto');

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <Link href="/" className="text-xs text-brand/50 hover:text-brand">
        ← Zur Startseite
      </Link>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-brand">Anmelden</h1>
      <p className="mt-1 mb-6 text-sm text-brand/60">
        Melden Sie sich an, um Ihre Bestellungen und Adressen zu verwalten.
      </p>
      <div className="rounded-2xl border border-gold/20 bg-white p-5 shadow-elegant">
        <Suspense>
          <AnmeldenForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-xs text-brand/40">
        Ein Konto ist nie Voraussetzung fürs Bestellen – Sie können auch jederzeit als Gast bestellen.
      </p>
    </main>
  );
}
