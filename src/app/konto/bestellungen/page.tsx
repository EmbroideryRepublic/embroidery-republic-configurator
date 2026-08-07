import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PackageOpen } from 'lucide-react';
import { aktuellerKunde } from '@/lib/account/session';
import { ladeBestellungenDesKunden } from '@/lib/account/data';
import { KontoNav } from '@/components/konto/KontoNav';
import { STATUS_LABELS } from '@/config/orderStatus';
import type { OrderStatus } from '@/lib/actions/orderTypes';
import { formatiereGeld } from '@/lib/format';

export const metadata = {
  title: 'Meine Bestellungen',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

function zeit(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { dateStyle: 'medium' });
}

const STATUS_FARBE: Record<OrderStatus, string> = {
  new: 'bg-blue-50 text-blue-700',
  in_production: 'bg-amber-50 text-amber-700',
  shipped: 'bg-purple-50 text-purple-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default async function BestellungenPage() {
  const kunde = await aktuellerKunde();
  if (!kunde) redirect('/konto/anmelden?weiter=/konto/bestellungen');

  const bestellungen = await ladeBestellungenDesKunden(kunde.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Mein Konto</p>
      <h1 className="mt-2 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal text-brand">Bestellungen</h1>

      <KontoNav />

      {bestellungen.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gold/30 bg-white p-10 text-center">
          <PackageOpen className="mx-auto h-8 w-8 text-brand/20" />
          <p className="mt-3 text-sm text-brand/60">
            Noch keine Bestellung mit diesem Konto verknüpft.
          </p>
          <p className="mt-1 text-xs text-brand/40">
            Frühere Gastbestellungen finden Sie über den Link in Ihrer Bestellbestätigung.
          </p>
          <Link href="/produkt" className="mt-4 inline-block text-sm font-medium text-gold-dark hover:underline">
            Zum Sortiment →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gold/10 rounded-2xl border border-gold/20 bg-white shadow-elegant">
          {bestellungen.map((b) => (
            <Link
              key={b.id}
              href={`/konto/bestellungen/${b.id}`}
              className="flex items-center justify-between gap-3 px-4 py-4 text-sm transition-colors hover:bg-cream/60"
            >
              <div>
                <p className="font-medium text-brand">
                  {b.bestellnummer} {b.orderType === 'inquiry' && <span className="text-brand/40">(Anfrage)</span>}
                </p>
                <p className="text-xs text-brand/40">{zeit(b.bestelltAm)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_FARBE[b.status as OrderStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[b.status as OrderStatus] ?? b.status}
                </span>
                <span className="w-20 text-right text-brand/70">{formatiereGeld(b.totalPrice)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
