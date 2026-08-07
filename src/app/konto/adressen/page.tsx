import { redirect } from 'next/navigation';
import { aktuellerKunde } from '@/lib/account/session';
import { ladeAdressen } from '@/lib/account/data';
import { KontoNav } from '@/components/konto/KontoNav';
import { AdressListe } from '@/components/konto/AdressListe';

export const metadata = {
  title: 'Meine Adressen',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function AdressenPage() {
  const kunde = await aktuellerKunde();
  if (!kunde) redirect('/konto/anmelden?weiter=/konto/adressen');

  const adressen = await ladeAdressen(kunde.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Mein Konto</p>
      <h1 className="mt-2 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal text-brand">Adressbuch</h1>
      <p className="mt-2 text-sm text-brand/60">
        Ihre Standardadresse wird beim nächsten Checkout automatisch vorgeschlagen.
      </p>

      <KontoNav />

      <AdressListe adressen={adressen} />
    </main>
  );
}
