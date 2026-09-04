/**
 * Interne Benachrichtigung, wenn die Kundschaft auf die Freigabeanfrage
 * reagiert (Freigabe erteilt ODER Änderung gewünscht) – nutzt denselben
 * Marken-Rahmen (EmailLayout) wie alle übrigen transaktionalen E-Mails, nach
 * dem Muster von ContactMessageEmail.tsx ("Bezug + Freitext" an den
 * Betreiber). Wird über den generischen Versand-Kern (sendEmail.ts)
 * verschickt.
 */
import { Text, Link } from '@react-email/components';
import { COLORS, EmailLayout } from './EmailLayout';

export function ProofFeedbackEmail({
  orderNumber,
  adminUrl,
  art,
  kommentar,
}: {
  orderNumber: string;
  adminUrl: string;
  art: 'freigegeben' | 'aenderung_gewuenscht';
  kommentar?: string;
}) {
  const title =
    art === 'freigegeben'
      ? `Vorschau freigegeben: ${orderNumber}`
      : `Änderung gewünscht: ${orderNumber}`;
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        {art === 'freigegeben' ? (
          <>
            Die Kundschaft hat die Druckvorschau für Bestellung <strong>{orderNumber}</strong> freigegeben. Die
            Produktion kann gestartet werden.
          </>
        ) : (
          <>
            Die Kundschaft möchte an der Druckvorschau für Bestellung <strong>{orderNumber}</strong> etwas geändert
            haben.
          </>
        )}
      </Text>
      {kommentar ? (
        <>
          <Text
            style={{
              margin: '16px 0 4px',
              fontSize: 12,
              color: COLORS.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Kommentar
          </Text>
          <Text style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{kommentar}</Text>
        </>
      ) : null}
      <Text style={{ marginTop: 16 }}>
        <Link href={adminUrl}>Bestellung im Adminbereich öffnen</Link>
      </Text>
    </EmailLayout>
  );
}
