import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { aktuellerKunde } from '@/lib/account/session';
import { pruefeBestellzugriff } from '@/lib/orders/orderAccess';
import { ladeBestellAnsicht } from '@/lib/orders/orderView';
import { KontoNav } from '@/components/konto/KontoNav';
import { CancelOrderButton } from '@/components/orders/CancelOrderButton';
import { Bestellfortschritt } from '@/components/orders/Bestellfortschritt';
import { BestellPositionen } from '@/components/orders/BestellPositionen';

export const metadata = {
  title: 'Bestellung',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

function zeit(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' });
}

export default async function KontoBestellDetailPage({ params }: { params: { id: string } }) {
  const kunde = await aktuellerKunde();
  if (!kunde) redirect(`/konto/anmelden?weiter=/konto/bestellungen/${params.id}`);

  const zugriff = await pruefeBestellzugriff({ art: 'konto', kundenId: kunde.id, orderId: params.id });
  if (!zugriff.erlaubt) notFound();

  const bestellung = await ladeBestellAnsicht(zugriff.orderId);
  if (!bestellung) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Mein Konto</p>
      <h1 className="mt-2 font-serif text-[clamp(1.5rem,3vw,2rem)] font-normal text-brand">
        Bestellung {bestellung.bestellnummer}
      </h1>
      <p className="mt-1 text-sm text-brand/50">Eingegangen am {zeit(bestellung.bestelltAm)}</p>

      <KontoNav />

      <div className="space-y-6">
        <Bestellfortschritt status={bestellung.status} trackingNummer={bestellung.trackingNummer} versendetAm={bestellung.versendetAm} />

        {bestellung.zustand === 'storniert' && (
          <section className="rounded-lg border border-brand/20 bg-cream/60 p-4">
            <h2 className="text-sm font-semibold text-brand">Diese Bestellung wurde storniert</h2>
            {/* Wortlaut identisch zur Storno-Bestätigungsmail (OrderCancellationEmail.tsx)
                und zur Token-Bestellansicht (bestellung/[token]/page.tsx) – dieselbe,
                bereits freigegebene Formulierung an einer dritten Stelle angewendet. */}
            <p className="mt-1 text-sm text-brand/70">
              {bestellung.erstattungsstatus !== 'not_applicable'
                ? 'Der bereits gezahlte Betrag wird vollständig zurückerstattet. Die Rückerstattung erfolgt über den ursprünglichen Zahlungsweg. Für diesen Auftrag wird keine Rechnung gestellt und wir beschaffen keine Ware.'
                : 'Es sind Ihnen keine Kosten entstanden.'}
            </p>
          </section>
        )}

        {bestellung.zustand === 'stornierbar' && (
          <section className="rounded-lg border border-gold/40 bg-gold-light/30 p-4">
            <h2 className="text-sm font-semibold text-brand">Sie können diese Bestellung noch stornieren</h2>
            <p className="mt-1 text-sm text-brand/70">
              Innerhalb von zwei Stunden nach Bestelleingang können Sie Ihre Bestellung selbst stornieren. Danach geht
              sie in die Bearbeitung und wir beschaffen die Ware.
            </p>
            <div className="mt-3">
              <CancelOrderButton orderId={bestellung.orderId} fristBis={zeit(bestellung.stornofristBis)} />
            </div>
          </section>
        )}

        {bestellung.zustand === 'frist-abgelaufen' && (
          <section className="rounded-lg border border-brand/[0.08] bg-white p-4">
            <h2 className="text-sm font-semibold text-brand">Selbststornierung nicht mehr möglich</h2>
            <p className="mt-1 text-sm text-brand/70">
              Die zweistündige Stornofrist ist am {zeit(bestellung.stornofristBis)} abgelaufen. Ihre Bestellung ist
              inzwischen in Bearbeitung.
            </p>
          </section>
        )}

        <BestellPositionen bestellung={bestellung} />

        {bestellung.lieferadresse && (
          <section className="rounded-lg border border-brand/[0.08] bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-brand">Lieferadresse</h2>
            <p className="text-sm text-brand/70">
              {bestellung.kundenName}
              <br />
              {bestellung.lieferadresse.strasse}
              <br />
              {bestellung.lieferadresse.plz} {bestellung.lieferadresse.ort}, {bestellung.lieferadresse.land}
            </p>
          </section>
        )}

        <p className="text-xs text-brand/50">
          Fragen zu dieser Bestellung?{' '}
          <Link href="/kontakt" className="text-gold-dark hover:underline">
            Kontaktieren Sie uns direkt
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
