/**
 * Versandbenachrichtigung.
 *
 * Wird versendet, sobald der Betreiber die Bestellung im Adminbereich auf
 * „versendet" setzt. Zweck: Der Kunde soll erfahren, dass die Ware unterwegs
 * ist, ohne nachfragen zu müssen — die häufigste Supportanfrage überhaupt.
 *
 * Die Sendungsnummer ist optional. Nicht jeder Versandweg liefert eine, und
 * eine erfundene wäre schlimmer als keine.
 */
import { Text, Link } from '@react-email/components';
import { COMPANY } from '@/config/company';
import { EmailLayout } from './EmailLayout';

/** Öffentliche DHL-Sendungsverfolgung – kein API-Zugang nötig, funktioniert
 *  mit jeder echten DHL-Sendungsnummer. */
function dhlTrackingUrl(sendungsnummer: string): string {
  return `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${encodeURIComponent(sendungsnummer)}`;
}

export function OrderShippedEmail({
  orderNumber,
  trackingNummer,
  carrier,
  bestellansichtUrl,
}: {
  orderNumber: string;
  trackingNummer: string | null;
  /** orders.carrier – nur bei 'dhl' entsteht ein echter Tracking-Link, sonst
   *  bleibt es (wie bisher) bei reinem Klartext. */
  carrier: string | null;
  bestellansichtUrl: string | null;
}) {
  const title = `Ihre Bestellung ${orderNumber} ist unterwegs`;
  const trackingLink = trackingNummer && carrier === 'dhl' ? dhlTrackingUrl(trackingNummer) : null;

  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Gute Nachrichten: Ihre Bestellung <strong>{orderNumber}</strong> hat unser Haus verlassen und
        ist auf dem Weg zu Ihnen.
      </Text>

      {trackingNummer && (
        <Text style={{ marginTop: 12 }}>
          Sendungsnummer: <strong>{trackingNummer}</strong>
          {trackingLink && (
            <>
              {' '}
              (<Link href={trackingLink}>Sendung bei DHL verfolgen</Link>)
            </>
          )}
          <br />
          <span style={{ fontSize: 13, color: '#666' }}>
            Je nach Versanddienstleister kann es einige Stunden dauern, bis die Sendung dort im
            System auftaucht.
          </span>
        </Text>
      )}

      {bestellansichtUrl && (
        <Text style={{ marginTop: 12 }}>
          <Link href={bestellansichtUrl}>Bestellung ansehen</Link>
        </Text>
      )}

      <Text style={{ marginTop: 12 }}>
        Sollte etwas nicht stimmen, melden Sie sich bitte kurz bei uns — wir kümmern uns darum.
      </Text>

      <Text style={{ marginTop: 12, fontSize: 13 }}>
        Telefon: {COMPANY.phone}
        <br />
        E-Mail: {COMPANY.email}
      </Text>
    </EmailLayout>
  );
}
