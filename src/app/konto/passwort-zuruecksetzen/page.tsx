import Link from 'next/link';
import { aktuellerKunde, istRecoverySitzung } from '@/lib/account/session';
import { PasswortZuruecksetzenForm } from '@/components/konto/PasswortZuruecksetzenForm';

export const metadata = {
  title: 'Neues Passwort vergeben',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

/**
 * Erreichbar über den Link aus der "Passwort vergessen"-E-Mail, nach dem
 * Umweg über /auth/callback (der den Code gegen eine – nur für diesen
 * Zweck gültige – Sitzung tauscht). Ohne diese Sitzung kann hier niemand
 * ein Passwort setzen, egal welche Adresse in der URL steht.
 */
export default async function PasswortZuruecksetzenPage() {
  const kunde = await aktuellerKunde();
  const erlaubt = kunde ? await istRecoverySitzung() : false;

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-serif text-2xl font-semibold text-brand">Neues Passwort vergeben</h1>
      {!kunde || !erlaubt ? (
        <div className="mt-6 rounded-2xl border border-gold/20 bg-white p-5 shadow-elegant">
          <p className="text-sm text-brand/70">
            Dieser Link ist abgelaufen oder ungültig. Bitte fordern Sie einen neuen Link an.
          </p>
          <Link href="/konto/passwort-vergessen" className="mt-3 inline-block text-sm font-medium text-gold-dark hover:underline">
            Neuen Link anfordern →
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-1 mb-6 text-sm text-brand/70">Bitte vergeben Sie ein neues Passwort für {kunde.email}.</p>
          <div className="rounded-2xl border border-gold/20 bg-white p-5 shadow-elegant">
            <PasswortZuruecksetzenForm />
          </div>
        </>
      )}
    </main>
  );
}
