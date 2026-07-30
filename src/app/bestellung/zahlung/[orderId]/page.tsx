/**
 * Rückleitungsseite nach dem Bezahlvorgang.
 *
 * Stripe (bzw. der Testanbieter) leitet nach Abschluss oder Abbruch hierher
 * zurück – die URL ist in `starteZahlung()` als `rueckkehrUrl` /
 * `abbruchUrl` hinterlegt.
 *
 * ── Diese Seite LIEST nur ──────────────────────────────────────────────
 * Sie löst keinerlei Zustandsänderung aus. Ob eine Bestellung als bezahlt
 * gilt, entscheidet ausschließlich der Webhook. Diese Seite zeigt nur an,
 * was in der Datenbank steht. Das ist der Grund, warum alle Fehlerfälle
 * unkritisch sind:
 *
 *   Webhook vor Rückleitung   → hier steht bereits „bezahlt"
 *   Webhook nach Rückleitung  → hier steht „wird geprüft"; der Kunde muss
 *                               nichts tun, die Bestätigung kommt per E-Mail
 *   Rückleitung ohne Webhook  → „wird geprüft"; Stripe stellt nach, spätestens
 *                               greift der Verfall nach 24 h
 *   Browser geschlossen       → der Ablauf hängt nicht an dieser Seite
 *
 * ── Drei Zustände ──────────────────────────────────────────────────────
 *   paid            → Erfolg, Bestätigung ist unterwegs
 *   pending         → Zahlung wird geprüft (oder Rückleitung kam vor Webhook)
 *   failed/abbruch  → abgebrochen, erneuter Versuch möglich
 */
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { COMPANY } from '@/config/company';

export const metadata = {
  title: 'Zahlung',
  robots: { index: false, follow: false },
};

// Hängt am Live-Zustand der Bestellung – nie statisch vorrendern.
export const dynamic = 'force-dynamic';

type Anzeige = 'bezahlt' | 'ausstehend' | 'gescheitert';

function bestimmeAnzeige(paymentStatus: string | null, abgebrochen: boolean): Anzeige {
  if (paymentStatus === 'paid') return 'bezahlt';
  if (paymentStatus === 'failed' || abgebrochen) return 'gescheitert';
  return 'ausstehend';
}

const INHALT: Record<Anzeige, { icon: typeof CheckCircle2; farbe: string; titel: string; text: string }> = {
  bezahlt: {
    icon: CheckCircle2,
    farbe: 'text-green-600',
    titel: 'Vielen Dank – Ihre Zahlung ist eingegangen.',
    text: 'Ihre Bestellung ist bestätigt. Die Bestellbestätigung mit allen Details erhalten Sie in Kürze per E-Mail.',
  },
  ausstehend: {
    icon: Clock,
    farbe: 'text-amber-600',
    titel: 'Ihre Zahlung wird geprüft.',
    text:
      'Das kann einen Moment dauern. Sie müssen nichts weiter tun – sobald die Zahlung bestätigt ist, ' +
      'erhalten Sie die Bestellbestätigung per E-Mail. Sie können diese Seite schließen.',
  },
  gescheitert: {
    icon: XCircle,
    farbe: 'text-red-600',
    titel: 'Der Bezahlvorgang wurde nicht abgeschlossen.',
    text:
      'Es wurde nichts abgebucht. Sie können die Zahlung aus Ihrem Warenkorb heraus erneut starten. ' +
      'Ihre Bestellung ist gespeichert und geht nicht verloren.',
  },
};

export default async function ZahlungsRueckkehr({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams: { abgebrochen?: string };
}) {
  const abgebrochen = searchParams.abgebrochen === '1';

  // NUR lesen. Kein Update, kein Seiteneffekt.
  let paymentStatus: string | null = null;
  let gefunden = false;
  try {
    const db = createAdminClient();
    const { data } = await db
      .from('orders')
      .select('payment_status')
      .eq('id', params.orderId)
      .maybeSingle();
    if (data) {
      gefunden = true;
      paymentStatus = (data.payment_status as string | null) ?? null;
    }
  } catch {
    // Bei einem Lesefehler bleibt es beim neutralen „wird geprüft" –
    // die Seite darf nie mit einem Fehler abbrechen.
  }

  const anzeige = gefunden ? bestimmeAnzeige(paymentStatus, abgebrochen) : 'ausstehend';
  const { icon: Icon, farbe, titel, text } = INHALT[anzeige];
  const bestellnummer = gefunden ? buildOrderNumber(params.orderId) : null;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <Icon className={`mb-6 h-16 w-16 ${farbe}`} aria-hidden />
      <h1 className="mb-3 text-2xl font-semibold text-brand">{titel}</h1>
      {bestellnummer && <p className="mb-2 text-sm text-brand/50">Bestellnummer {bestellnummer}</p>}
      <p className="mb-8 max-w-md text-brand/60">{text}</p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-brand px-5 py-3 text-sm font-medium text-white transition hover:bg-brand/90"
        >
          Zur Startseite
        </Link>
        {anzeige === 'gescheitert' && (
          <Link
            href="/#konfigurator"
            className="rounded-md border border-brand px-5 py-3 text-sm font-medium text-brand transition hover:bg-brand/5"
          >
            Erneut versuchen
          </Link>
        )}
      </div>

      {anzeige !== 'bezahlt' && (
        <p className="mt-8 text-xs text-brand/40">
          Fragen? {COMPANY.email} · {COMPANY.phone}
        </p>
      )}
    </main>
  );
}
