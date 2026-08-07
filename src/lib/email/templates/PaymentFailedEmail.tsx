/**
 * Benachrichtigung, wenn eine Vorabzahlung nicht zustande kam (Abbruch,
 * Ablehnung oder Zeitablauf – siehe paymentService.ts,
 * markiereZahlungAlsGescheitert). Wichtigster Zweck: der Kundschaft sagen,
 * dass NICHTS produziert wird, solange nicht bezahlt ist, und wie sie es
 * erneut versuchen kann.
 */
import { Button, Text } from '@react-email/components';
import { COMPANY } from '@/config/company';
import { basisUrl } from '@/lib/seo/basisUrl';
import { COLORS, EmailLayout } from './EmailLayout';

export function PaymentFailedEmail({ orderNumber, bestellansichtUrl }: { orderNumber: string; bestellansichtUrl?: string }) {
  const title = `Zahlung nicht erfolgreich: ${orderNumber}`;
  const link = bestellansichtUrl ?? `${basisUrl()}/produkt`;
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Die Zahlung für Ihre Bestellung <strong>{orderNumber}</strong> konnte leider nicht abgeschlossen werden – sei
        es durch einen Abbruch, eine Ablehnung durch Ihre Bank oder eine Zeitüberschreitung.
      </Text>
      <Text style={{ marginTop: 12 }}>
        Keine Sorge: Es wurde <strong>nichts abgebucht</strong> und es läuft noch keine Produktion. Sie können es
        gern erneut versuchen.
      </Text>
      <Button
        href={link}
        style={{
          marginTop: 20,
          backgroundColor: COLORS.gold,
          color: '#ffffff',
          padding: '12px 28px',
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Erneut versuchen
      </Button>
      <Text style={{ marginTop: 20, fontSize: 12, color: COLORS.muted }}>
        Fragen dazu? Wir helfen gern: {COMPANY.phone} · {COMPANY.email}
      </Text>
    </EmailLayout>
  );
}
