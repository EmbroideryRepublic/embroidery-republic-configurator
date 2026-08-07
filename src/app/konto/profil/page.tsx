import { redirect } from 'next/navigation';
import { aktuellerKunde } from '@/lib/account/session';
import { ladeProfil } from '@/lib/account/data';
import { KontoNav } from '@/components/konto/KontoNav';
import { ProfilForm } from '@/components/konto/ProfilForm';
import { EmailAendernForm } from '@/components/konto/EmailAendernForm';
import { PasswortAendernForm } from '@/components/konto/PasswortAendernForm';
import { KontoLoeschenButton } from '@/components/konto/KontoLoeschenButton';

export const metadata = {
  title: 'Mein Profil',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const kunde = await aktuellerKunde();
  if (!kunde) redirect('/konto/anmelden?weiter=/konto/profil');

  const profil = await ladeProfil(kunde.id, kunde.email);
  if (!profil) redirect('/konto');

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Mein Konto</p>
      <h1 className="mt-2 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal text-brand">Profil</h1>

      <KontoNav />

      <div className="space-y-6">
        <section className="rounded-xl border border-gold/20 bg-white p-5 shadow-elegant">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand/50">Persönliche Angaben</h2>
          <ProfilForm profil={profil} />
        </section>

        <section className="rounded-xl border border-gold/20 bg-white p-5 shadow-elegant">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand/50">E-Mail-Adresse</h2>
          <EmailAendernForm aktuelleEmail={kunde.email} />
        </section>

        <section className="rounded-xl border border-gold/20 bg-white p-5 shadow-elegant">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand/50">Passwort</h2>
          <PasswortAendernForm />
        </section>

        <section className="rounded-xl border border-red-200 bg-white p-5 shadow-elegant">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-red-600/70">Konto löschen</h2>
          <p className="mb-4 text-xs text-brand/60">
            Sie können Ihr Konto jederzeit selbst und unwiderruflich löschen, statt auf die automatische Löschfrist zu
            warten.
          </p>
          <KontoLoeschenButton />
        </section>
      </div>
    </main>
  );
}
