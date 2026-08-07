import Link from 'next/link';
import { redirect } from 'next/navigation';
import { aktuellerKunde } from '@/lib/account/session';
import { RegistrierenForm } from '@/components/konto/RegistrierenForm';

export const metadata = {
  title: 'Konto anlegen',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function RegistrierenPage() {
  const kunde = await aktuellerKunde();
  if (kunde) redirect('/konto');

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <Link href="/" className="text-xs text-brand/50 hover:text-brand">
        ← Zur Startseite
      </Link>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-brand">Konto anlegen</h1>
      <p className="mt-1 mb-6 text-sm text-brand/60">
        Adressen speichern, Bestellungen an einem Ort verfolgen, beim nächsten Mal schneller zur Kasse.
      </p>
      <div className="rounded-2xl border border-gold/20 bg-white p-5 shadow-elegant">
        <RegistrierenForm />
      </div>
      <p className="mt-6 text-center text-xs text-brand/40">
        Ein Konto ist nie Voraussetzung fürs Bestellen – Sie können auch jederzeit als Gast bestellen.
      </p>
    </main>
  );
}
