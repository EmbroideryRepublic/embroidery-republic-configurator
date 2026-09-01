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
import { BestellPositionen } from '@/components/orders/BestellPositionen';
import { formatiereZeitpunkt } from '@/lib/format';

export const metadata = {
  title: 'Ihre Bestellung',
  robots: { index: false, follow: false },
};

// Der Zustand hängt an der Serverzeit – niemals statisch vorrendern.
export const dynamic = 'force-dynamic';

function zeit(iso: string): string {
  return formatiereZeitpunkt(iso, { dateStyle: 'long', timeStyle: 'short' });
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
          <Link href="/" className="text-xs text-brand/50 hover:text-brand">
            ← Zur Startseite
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-brand">
            {abgelaufen ? 'Dieser Link ist nicht mehr gültig' : 'Dieser Link lässt sich nicht öffnen'}
          </h1>
        </div>

        <section className="rounded-lg border border-brand/20 bg-white p-4">
          <p className="text-sm text-brand/70">
            {abgelaufen
              ? 'Links zur Bestellansicht sind aus Sicherheitsgründen zeitlich begrenzt. Ihre Bestellung ist davon nicht betroffen – sie bleibt selbstverständlich bestehen.'
              : 'Der Link ist unvollständig oder wurde beim Kopieren abgeschnitten. Das passiert häufig, wenn er über mehrere Zeilen umgebrochen wurde.'}
          </p>
          <p className="mt-3 text-sm text-brand/70">
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
  const zugriff = await pruefeBestellzugriff({ art: 'token', token: params.token });
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
          <Link href="/" className="text-xs text-brand/50 hover:text-brand">
            ← Zur Startseite
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-brand">Bestellung {bestellung.bestellnummer}</h1>
          <p className="mt-1 text-sm text-brand/60">Eingegangen am {zeit(bestellung.bestelltAm)}</p>
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
          <section className="rounded-lg border border-brand/20 bg-cream/60 p-4">
            <h2 className="text-sm font-semibold text-brand">Diese Bestellung wurde storniert</h2>
            <p className="mt-1 text-sm text-brand/70">
              {bestellung.storniertAm ? `Storniert am ${zeit(bestellung.storniertAm)}.` : 'Die Bestellung ist storniert.'}{' '}
              {/* Wortlaut identisch zur Storno-Bestätigungsmail (OrderCancellationEmail.tsx)
                  – dieselbe, bereits freigegebene Formulierung, nur an einer zweiten Stelle
                  angewendet (Review vom 2026-08-20: diese Seite zeigte bislang IMMER den
                  „keine Kosten"-Text, auch wenn tatsächlich eine Rückerstattung ansteht). */}
              {bestellung.erstattungsstatus !== 'not_applicable' ? (
                <>
                  Der bereits gezahlte Betrag wird vollständig zurückerstattet. Die Rückerstattung erfolgt über den
                  ursprünglichen Zahlungsweg. Für diesen Auftrag wird keine Rechnung gestellt und wir beschaffen keine
                  Ware.
                </>
              ) : (
                <>Es entstehen Ihnen keine Kosten.</>
              )}{' '}
              Eine Bestätigung haben wir Ihnen per E-Mail gesendet.
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
              <CancelOrderButton token={params.token} fristBis={zeit(bestellung.stornofristBis)} />
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
            <p className="mt-2 text-sm text-brand/70">
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

        {bestellung.zustand !== 'storniert' &&
          (!bestellung.zahlungsart || bestellung.zahlungsart === 'invoice' ? (
            <p className="text-xs text-brand/50">
              Die Rechnung erhalten Sie separat, zahlbar innerhalb von {PAYMENT_TERM_DAYS} Tagen ohne Abzug.
            </p>
          ) : bestellung.zahlungsstatus === 'paid' ? (
            <p className="text-xs text-brand/50">Die Zahlung ist bereits bei uns eingegangen – vielen Dank.</p>
          ) : null)}
      </div>
    </main>
  );
}
