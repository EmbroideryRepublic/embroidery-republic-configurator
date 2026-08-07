/**
 * Automatische Eingangsbestätigung AN die anfragende Person – bisher gab es
 * nur die interne Benachrichtigung (ContactMessageEmail, an uns selbst).
 * Ohne diese Bestätigung weiß die anfragende Person nicht, ob ihre
 * Nachricht überhaupt angekommen ist.
 */
import { Text } from '@react-email/components';
import { COMPANY } from '@/config/company';
import { COLORS, EmailLayout } from './EmailLayout';

export function ContactAutoReplyEmail({ name, message }: { name: string; message: string }) {
  const title = 'Ihre Nachricht ist bei uns angekommen';
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>Hallo {name},</Text>
      <Text style={{ marginTop: 12 }}>
        vielen Dank für Ihre Nachricht. Wir melden uns persönlich bei Ihnen zurück – in der Regel innerhalb eines
        Werktags.
      </Text>
      <Text style={{ marginTop: 16, fontSize: 13, color: COLORS.muted, borderLeft: `2px solid ${COLORS.border}`, paddingLeft: 12 }}>
        {message}
      </Text>
      <Text style={{ marginTop: 20, fontSize: 13 }}>
        Bei dringenden Fragen erreichen Sie uns auch telefonisch: {COMPANY.phone}
      </Text>
    </EmailLayout>
  );
}
