/**
 * Öffentliche Bestellansicht.
 *
 * Erreichbar über den signierten Link aus der Bestellbestätigung. Die Seite
 * zeigt IMMER die Bestelldetails – der einzige Unterschied zwischen den drei
 * Zuständen ist, was zusätzlich angeboten bzw. erklärt wird:
 *
 *   stornierbar       → Storno-Schaltfläche mit Sicherheitsabfrage
 *   frist-abgelaufen  → freundliche Erklärung + Kontaktmöglichkeiten
 *   storniert         → Bestätigung der Stornierung
 *
 * Bewusst KEINE Fehlerseite nach Fristablauf: Ein toter Link erzeugt
 * Supportaufwand und Ärger. Der Kunde soll seine Bestellung dauerhaft
 * einsehen können.
 *
 * ── Vorbereitet für das Kundenkonto ───────────────────────────────────
 * Die Darstellung hängt ausschließlich am Ansichtsmodell (`ladeBestellAnsicht`),
 * nicht an der Zugriffsart. Kommt später eine Anmeldung dazu, wird in
 * `orderAccess` ein zweiter Fall ergänzt – diese Seite bleibt unverändert
 * und kann direkt im Kundenkonto wiederverwendet werden.
 */
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { COMPANY, PAYMENT_TERM_DAYS } from '@/config/company';
import { pruefeBestellzugriff } from '@/lib/orders/orderAccess';
import { ladeBestellAnsicht } from '@/lib/orders/orderView';
import { CancelOrderButton } from '@/components/orders/CancelOrderButton';
import { Bestellfortschritt } from '@/components/orders/Bestellfortschritt';
import { formatiereGeld } from '@/lib/format';

export const metadata = {
  title: 'Ihre Bestellung',
  robots: { index: false, follow: false },
};

// Der Zustand hängt an der Serverzeit – niemals statisch vorrendern.
export const dynamic = 'force-dynamic';

function zeit(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' });
}

/**
 * Anzeige, wenn der Link nicht (mehr) verwendbar ist.
 *
 * Bewusst KEINE 404-Seite: Wer hier landet, hat in aller Regel einen echten
 * Link aus einer alten E-Mail angeklickt. Eine generische Fehlerseite würde
 * ihn ratlos zurücklassen und Supportaufwand erzeugen. Stattdessen: erklären,
 * was los ist, und einen Weg zu uns anbieten.
 *
 * Der Text unterscheidet nur zwischen „zu alt" und „nicht verwendbar" – ob
 * eine Bestellung existiert, wird NIE verraten.
 */
function LinkNichtVerwendbar({ grund }: { grund: 'ungueltig' | 'abgelaufen' | 'nicht-konfiguriert' }) {
  const abgelaufen = grund === 'abgelaufen';

  return (
    <main className="min-h-screen bg-brand-light px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-800">
            ← Zur Startseite
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-brand">
            {abgelaufen ? 'Dieser Link ist nicht mehr gültig' : 'Dieser Link lässt sich nicht öffnen'}
          </h1>
        </div>

        <section className="rounded-lg border border-gray-300 bg-white p-4">
          <p className="text-sm text-gray-700">
            {abgelaufen
              ? 'Links zur Bestellansicht sind aus Sicherheitsgründen zeitlich begrenzt. Ihre Bestellung ist davon nicht betroffen – sie bleibt selbstverständlich bestehen.'
              : 'Der Link ist unvollständig oder wurde beim Kopieren abgeschnitten. Das passiert häufig, wenn er über mehrere Zeilen umgebrochen wurde.'}
          </p>
          <p className="mt-3 text-sm text-gray-700">
            Schreiben Sie uns kurz – am besten mit Ihrer Bestellnummer aus der Bestätigungsmail. Wir senden Ihnen den
            aktuellen Stand umgehend zu.
          </p>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-brand hover:underline">
              <Phone className="h-4 w-4" aria-hidden="true" />
              {COMPANY.phone}
            </a>
            <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 text-brand hover:underline">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {COMPANY.email}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function BestellAnsichtSeite({ params }: { params: { token: string } }) {
  const zugriff = pruefeBestellzugriff({ art: 'token', token: params.token });
  if (!zugriff.erlaubt) return <LinkNichtVerwendbar grund={zugriff.grund} />;

  const bestellung = await ladeBestellAnsicht(zugriff.orderId);
  // Signatur gültig, Bestellung aber nicht (mehr) vorhanden. Bewusst dieselbe
  // Anzeige wie bei einem ungültigen Link: Ob es die Bestellung gibt, geht
  // niemanden etwas an, der keinen gültigen Link besitzt.
  if (!bestellung) return <LinkNichtVerwendbar grund="ungueltig" />;

  return (
    <main className="min-h-screen bg-brand-light px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-800">
            ← Zur Startseite
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-brand">Bestellung {bestellung.bestellnummer}</h1>
          <p className="mt-1 text-sm text-gray-600">Eingegangen am {zeit(bestellung.bestelltAm)}</p>
        </div>

        {/* Fortschritt zuerst: Das ist die Frage, wegen der der Kunde die
            Seite öffnet. Die Storno-Hinweise darunter sind Nebenschauplatz. */}
        <Bestellfortschritt
          status={bestellung.status}
          trackingNummer={bestellung.trackingNummer}
          versendetAm={bestellung.versendetAm}
        />

        {/* Zustandsabhängiger Hinweisbereich */}
        {bestellung.zustand === 'storniert' && (
          <section className="rounded-lg border border-gray-300 bg-gray-50 p-4">
            <h2 className="text-sm font-semibold text-gray-900">Diese Bestellung wurde storniert</h2>
            <p className="mt-1 text-sm text-gray-700">
              {bestellung.storniertAm ? `Storniert am ${zeit(bestellung.storniertAm)}.` : 'Die Bestellung ist storniert.'}{' '}
              Es entstehen Ihnen keine Kosten. Eine Bestätigung haben wir Ihnen per E-Mail gesendet.
            </p>
          </section>
        )}

        {bestellung.zustand === 'stornierbar' && (
          <section className="rounded-lg border border-gold/40 bg-gold-light/30 p-4">
            <h2 className="text-sm font-semibold text-brand">Sie können diese Bestellung noch stornieren</h2>
            <p className="mt-1 text-sm text-gray-700">
              Innerhalb von zwei Stunden nach Bestelleingang können Sie Ihre Bestellung selbst stornieren. Danach geht
              sie in die Bearbeitung und wir beschaffen die Ware.
            </p>
            <div className="mt-3">
              <CancelOrderButton token={params.token} fristBis={zeit(bestellung.stornofristBis)} />
            </div>
          </section>
        )}

        {bestellung.zustand === 'frist-abgelaufen' && (
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-brand">Selbststornierung nicht mehr möglich</h2>
            <p className="mt-1 text-sm text-gray-700">
              Die zweistündige Stornofrist ist am {zeit(bestellung.stornofristBis)} abgelaufen. Ihre Bestellung ist
              inzwischen in Bearbeitung.
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Sie haben trotzdem eine Frage oder einen Sonderfall? Melden Sie sich gern direkt bei uns – wir schauen,
              was sich machen lässt.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <a href={COMPANY.phoneHref} className="inline-flex items-center gap-1.5 text-gold-dark hover:underline">
                <Phone className="h-4 w-4" /> {COMPANY.phone}
              </a>
              <a href={COMPANY.emailHref} className="inline-flex items-center gap-1.5 text-gold-dark hover:underline">
                <Mail className="h-4 w-4" /> {COMPANY.email}
              </a>
            </div>
          </section>
        )}

        {/* Bestelldetails – in ALLEN Zuständen identisch */}
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-brand">Ihre Positionen</h2>
          <ul className="space-y-3">
            {bestellung.positionen.map((pos, i) => (
              <li key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-gray-900">{pos.produktName}</p>
                <p className="text-xs text-gray-600">
                  {pos.farbe} · {pos.veredelung}
                </p>
                <p className="mt-1 text-xs text-gray-700">
                  {pos.groessen.map((g) => `${g.groesse} × ${g.menge}`).join(' · ')}
                  <span className="text-gray-500"> ({pos.menge} Stück)</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-sm font-semibold text-brand">
            Gesamt: {formatiereGeld(bestellung.gesamtpreis)}
          </p>
        </section>

        {bestellung.lieferadresse && (
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-brand">Lieferadresse</h2>
            <p className="text-sm text-gray-700">
              {bestellung.kundenName}
              <br />
              {bestellung.lieferadresse.strasse}
              <br />
              {bestellung.lieferadresse.plz} {bestellung.lieferadresse.ort}, {bestellung.lieferadresse.land}
            </p>
          </section>
        )}

        {bestellung.zustand !== 'storniert' && (
          <p className="text-xs text-gray-500">
            Die Rechnung erhalten Sie separat, zahlbar innerhalb von {PAYMENT_TERM_DAYS} Tagen ohne Abzug.
          </p>
        )}
      </div>
    </main>
  );
}
