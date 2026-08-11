/**
 * ═══════════════════════════════════════════════════════════════════════
 * WEBHOOK-EINGANG FÜR ZAHLUNGSANBIETER
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Bewusst EINE Route mit dynamischem Segment (`/api/webhooks/stripe`,
 * `/api/webhooks/test`, später `/api/webhooks/paypal`). Ein weiterer
 * Anbieter braucht damit keine neue Route – nur eine weitere Implementierung
 * des Ports.
 *
 * ── Diese Datei entscheidet NICHTS ────────────────────────────────────
 * Sie nimmt entgegen, lässt den Adapter die Echtheit prüfen und übersetzen,
 * und übergibt das Ergebnis an die Geschäftslogik (`paymentService`). Ob
 * eine Bestellung als bezahlt gilt, ob abgeschlossen wird, ob der Betrag
 * stimmt – all das fällt dort, nicht hier.
 *
 * ── Der Rohtext ist unantastbar ───────────────────────────────────────
 * Der Body wird als TEXT gelesen und unverändert weitergereicht. Jede
 * Umformung – auch `JSON.parse` mit anschließendem `JSON.stringify` –
 * verändert Zeichenfolge und Reihenfolge und macht damit die Signatur
 * ungültig. Deshalb `request.text()`, niemals `request.json()`.
 *
 * ── Antwortverhalten ──────────────────────────────────────────────────
 * Zahlungsanbieter wiederholen die Zustellung, solange sie keine
 * 2xx-Antwort erhalten. Deshalb:
 *   • 200 – verarbeitet ODER bewusst ignoriert (z.B. Ereignis, das uns
 *           nicht betrifft). Eine Wiederholung würde nichts ändern.
 *   • 400 – Signatur ungültig oder unlesbar. Wiederholung sinnlos, und die
 *           Meldung stammt womöglich gar nicht vom Anbieter.
 *   • 500 – bei uns ist etwas schiefgegangen. Wiederholung erwünscht.
 * Der Unterschied zwischen 400 und 500 ist wichtig: Bei 500 versucht der
 * Anbieter es später erneut, bei 400 nicht.
 */
import { NextResponse } from 'next/server';
import { waehleZahlungsAnbieter, ZahlungsAnbieterFehlt } from '@/lib/payments/registry';
import type { ZahlungsAnbieterId } from '@/lib/payments/types';
import { verarbeiteZahlungsEreignis } from '@/lib/orders/paymentService';
import { pruefeRateLimit } from '@/lib/security/rateLimit';

/** Bekannte Anbieterkennungen – schützt vor Aufrufen mit Fantasienamen. */
const BEKANNTE_ANBIETER: readonly string[] = ['test', 'stripe', 'paypal'];

export async function POST(request: Request, { params }: { params: { anbieter: string } }): Promise<NextResponse> {
  const anbieterId = params.anbieter;

  if (!BEKANNTE_ANBIETER.includes(anbieterId)) {
    return NextResponse.json({ fehler: 'Unbekannter Anbieter.' }, { status: 404 });
  }

  let anbieter;
  try {
    anbieter = waehleZahlungsAnbieter(anbieterId as ZahlungsAnbieterId);
  } catch (err) {
    if (err instanceof ZahlungsAnbieterFehlt) {
      console.warn(`[webhook] ${anbieterId} ist nicht eingerichtet.`);
      return NextResponse.json({ fehler: 'Anbieter nicht eingerichtet.' }, { status: 404 });
    }
    throw err;
  }

  // UNVERÄNDERT lesen – siehe Kopfkommentar.
  const rohBody = await request.text();
  // Vollständige Header statt einer einzelnen Signatur-Kopfzeile: jeder
  // Anbieter braucht andere (Stripe genau eine, PayPal vier) – siehe
  // Kopfkommentar von ZahlungsAnbieter.leseEreignis in lib/payments/types.ts.
  const ereignis = await anbieter.leseEreignis(rohBody, request.headers);
  if (!ereignis) {
    // Entweder gefälscht oder für uns bedeutungslos. In beiden Fällen darf
    // keine Wiederholung ausgelöst werden – aber es wird protokolliert.
    console.warn(`[webhook] ${anbieterId}: Ereignis verworfen (Signatur ungültig oder nicht relevant).`);
    return NextResponse.json({ status: 'verworfen' }, { status: 400 });
  }

  // ── Rate-Limit NACH der Signaturprüfung ─────────────────────────────
  // Erst hier, bewusst: Läge es davor, könnte eine Flut gefälschter Anfragen
  // das Limit aufbrauchen und echte Stripe-Zustellungen aussperren. Nach der
  // Signaturprüfung ist das Ereignis nachweislich echt – jetzt bremst das
  // Limit nur noch einen Missbrauch mit gültigen Signaturen.
  const grenze = await pruefeRateLimit('webhook');
  if (!grenze.erlaubt) {
    // 429 statt 200: Stripe soll erneut zustellen, wenn wir gerade drosseln.
    console.warn(`[webhook] ${anbieterId}: Rate-Limit erreicht.`);
    return NextResponse.json({ status: 'gedrosselt' }, { status: 429 });
  }

  try {
    const ergebnis = await verarbeiteZahlungsEreignis(ereignis);
    if (!ergebnis.ok) {
      if (ergebnis.wiederholen) {
        // TECHNISCH gescheitert (z.B. Datenbank nicht erreichbar). Die
        // Zahlung ist beim Anbieter erfolgt, wir konnten sie nur nicht
        // verbuchen. 500 → der Anbieter stellt erneut zu. Würde hier 200
        // stehen, ginge eine bestätigte Zahlung dauerhaft verloren.
        console.error(`[webhook] ${anbieterId}: Ereignis technisch gescheitert – ${ergebnis.grund}`);
        return NextResponse.json({ status: 'fehler', grund: ergebnis.grund }, { status: 500 });
      }
      // FACHLICH abgelehnt (z.B. Betragsabweichung, unbekannte Bestellung).
      // Deterministisch – eine Wiederholung ergäbe dasselbe. Deshalb 200 mit
      // klarer Angabe; der Vorgang steht in der Bestell-Historie.
      console.warn(`[webhook] ${anbieterId}: Ereignis fachlich abgelehnt – ${ergebnis.grund}`);
      return NextResponse.json({ status: 'abgelehnt', grund: ergebnis.grund }, { status: 200 });
    }
    return NextResponse.json({
      status: ergebnis.bereitsVerarbeitet ? 'bereits_verarbeitet' : 'verarbeitet',
      wirkung: ergebnis.wirkung,
    });
  } catch (err) {
    // Hier ist bei UNS etwas schiefgegangen – eine Wiederholung ist
    // erwünscht, deshalb 500.
    console.error(`[webhook] ${anbieterId}: Verarbeitung fehlgeschlagen:`, err);
    return NextResponse.json({ fehler: 'Verarbeitung fehlgeschlagen.' }, { status: 500 });
  }
}
