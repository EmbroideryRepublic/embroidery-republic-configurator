import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, MapPin, User } from 'lucide-react';
import { aktuellerKunde } from '@/lib/account/session';
import { ladeProfil, ladeAdressen, ladeBestellungenDesKunden } from '@/lib/account/data';
import { KontoNav } from '@/components/konto/KontoNav';
import { formatiereGeld } from '@/lib/format';

export const metadata = {
  title: 'Mein Konto',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

function zeit(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { dateStyle: 'medium' });
}

export default async function KontoUebersichtPage() {
  const kunde = await aktuellerKunde();
  if (!kunde) redirect('/konto/anmelden?weiter=/konto');

  const [profil, adressen, bestellungen] = await Promise.all([
    ladeProfil(kunde.id, kunde.email),
    ladeAdressen(kunde.id),
    ladeBestellungenDesKunden(kunde.id),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Mein Konto</p>
      <h1 className="mt-2 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal text-brand">
        Willkommen{profil?.displayName ? `, ${profil.displayName}` : ''}
      </h1>
      <p className="mt-2 text-sm text-brand/60">{kunde.email}</p>

      <KontoNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/konto/bestellungen"
          className="rounded-xl border border-gold/20 bg-white p-4 shadow-elegant transition-shadow hover:shadow-[0_8px_32px_-6px_rgba(139,94,52,0.28)]"
        >
          <Package className="h-5 w-5 text-gold-dark" />
          <p className="mt-2 text-sm font-semibold text-brand">{bestellungen.length} Bestellung(en)</p>
          <p className="mt-0.5 text-xs text-brand/50">Historie & Status ansehen →</p>
        </Link>
        <Link
          href="/konto/adressen"
          className="rounded-xl border border-gold/20 bg-white p-4 shadow-elegant transition-shadow hover:shadow-[0_8px_32px_-6px_rgba(139,94,52,0.28)]"
        >
          <MapPin className="h-5 w-5 text-gold-dark" />
          <p className="mt-2 text-sm font-semibold text-brand">{adressen.length} Adresse(n)</p>
          <p className="mt-0.5 text-xs text-brand/50">Adressbuch verwalten →</p>
        </Link>
        <Link
          href="/konto/profil"
          className="rounded-xl border border-gold/20 bg-white p-4 shadow-elegant transition-shadow hover:shadow-[0_8px_32px_-6px_rgba(139,94,52,0.28)]"
        >
          <User className="h-5 w-5 text-gold-dark" />
          <p className="mt-2 text-sm font-semibold text-brand">Profil</p>
          <p className="mt-0.5 text-xs text-brand/50">Angaben & Passwort ändern →</p>
        </Link>
      </div>

      {bestellungen.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand/50">Letzte Bestellungen</h2>
          <div className="divide-y divide-gold/10 rounded-xl border border-gold/20 bg-white shadow-elegant">
            {bestellungen.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                href={`/konto/bestellungen/${b.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-cream/60"
              >
                <span>
                  <span className="font-medium text-brand">{b.bestellnummer}</span>{' '}
                  <span className="text-brand/40">· {zeit(b.bestelltAm)}</span>
                </span>
                <span className="text-brand/60">{formatiereGeld(b.totalPrice)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
