/**
 * Bitte um Freigabe der Druckvorschau – löst das Versprechen aus FAQ/Über-uns
 * ein ("Vor Produktionsstart erhalten Sie eine finale Vorschau zur
 * Freigabe"). Gesendet vom Betreiber ausgelöst (RequestProofApprovalButton),
 * NICHT bei einem Statusübergang – die Bestellung steht zu diesem Zeitpunkt
 * noch auf 'new', der Produktionsstart wartet erst auf diese Freigabe.
 *
 * `bestellansichtUrl` ist hier bewusst PFLICHT (anders als bei den übrigen
 * Status-Mails, wo der Link optional ergänzend ist) – der Link ist der
 * eigentliche Zweck dieser Mail.
 */
import { Text, Link } from '@react-email/components';
import { COLORS, EmailLayout } from './EmailLayout';

export function OrderProofRequestEmail({
  orderNumber,
  bestellansichtUrl,
}: {
  orderNumber: string;
  bestellansichtUrl: string;
}) {
  const title = `Bitte Druckvorschau für ${orderNumber} freigeben`;
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Für Ihre Bestellung <strong>{orderNumber}</strong> liegt jetzt die finale Druckvorschau vor – so, wie
        Ihre Motive tatsächlich auf dem Kleidungsstück platziert werden.
      </Text>
      <Text style={{ marginTop: 12 }}>
        Bitte sehen Sie sich die Vorschau kurz an und geben Sie sie frei, damit wir mit der Produktion beginnen
        können:
      </Text>
      <Text style={{ marginTop: 12 }}>
        <Link href={bestellansichtUrl}>Vorschau ansehen und freigeben</Link>
      </Text>
      <Text style={{ marginTop: 16, fontSize: 12, color: COLORS.muted }}>
        Passt etwas nicht, können Sie dort statt der Freigabe auch eine Änderung wünschen – wir melden uns dann
        umgehend bei Ihnen.
      </Text>
    </EmailLayout>
  );
}
