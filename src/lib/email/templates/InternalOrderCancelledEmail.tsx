/**
 * Interne Mitteilung an den Betreiber: Die Kundschaft hat eine Bestellung
 * innerhalb der Stornofrist selbst storniert.
 *
 * Gehört zur sofortigen Benachrichtigung (config/orderProcess.ts): Die
 * Eingangsmeldung geht unmittelbar raus und nennt die laufende Stornofrist. Wird
 * dann storniert, soll der Betreiber das erfahren, BEVOR er Ware beschafft –
 * früher wurde die Meldung zurückgehalten und bei Storno zurückgezogen.
 */
import { Text } from '@react-email/components';
import { EmailLayout, COLORS } from './EmailLayout';

export function InternalOrderCancelledEmail({
  orderNumber,
  kundeName,
  kundeEmail,
  storniertAm,
  erstattungFaellig,
}: {
  orderNumber: string;
  kundeName: string | null;
  kundeEmail: string | null;
  storniertAm: string;
  /** true = zum Stornozeitpunkt war bereits bezahlt (payment_status 'paid'). */
  erstattungFaellig: boolean;
}) {
  const title = `Bestellung storniert: ${orderNumber}`;
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Die Kundschaft hat die Bestellung <strong>{orderNumber}</strong> am {storniertAm} innerhalb der Stornofrist selbst
        storniert. <strong>Bitte nichts beschaffen und nichts produzieren.</strong>
      </Text>
      <Text style={{ backgroundColor: COLORS.background, padding: 10, borderRadius: 6, margin: '12px 0 0' }}>
        {erstattungFaellig
          ? 'Die Bestellung war bereits bezahlt. Die Rückerstattung ist fällig; ihr Stand steht im Adminbereich bei der Bestellung.'
          : 'Es war noch nichts bezahlt – es ist nichts zu erstatten.'}
      </Text>
      {(kundeName || kundeEmail) && (
        <Text style={{ marginTop: 12, fontSize: 13, color: COLORS.muted }}>
          Kundschaft: {kundeName ?? '–'}
          {kundeEmail ? ` · ${kundeEmail}` : ''}
        </Text>
      )}
    </EmailLayout>
  );
}
