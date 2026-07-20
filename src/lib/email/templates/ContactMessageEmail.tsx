/**
 * Interne Benachrichtigung über eine neue Kontaktanfrage aus dem
 * Kontaktformular (/kontakt). Nutzt denselben Marken-Rahmen (EmailLayout)
 * wie alle übrigen transaktionalen E-Mails. Wird über den generischen
 * Versand-Kern (sendEmail.ts) verschickt – der Reply-To wird auf die
 * Absender-E-Mail gesetzt, sodass eine Antwort direkt bei der/dem
 * Interessent:in landet.
 */
import { Text } from '@react-email/components';
import { EmailLayout, COLORS } from './EmailLayout';

interface ContactMessageEmailProps {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export function ContactMessageEmail({ name, email, subject, message }: ContactMessageEmailProps) {
  return (
    <EmailLayout previewText={`Neue Kontaktanfrage von ${name}`} title="Neue Kontaktanfrage">
      <Text style={{ margin: '0 0 4px', fontSize: 14 }}>
        <strong>Name:</strong> {name}
      </Text>
      <Text style={{ margin: '0 0 4px', fontSize: 14 }}>
        <strong>E-Mail:</strong> {email}
      </Text>
      {subject ? (
        <Text style={{ margin: '0 0 4px', fontSize: 14 }}>
          <strong>Betreff:</strong> {subject}
        </Text>
      ) : null}
      <Text
        style={{
          margin: '16px 0 4px',
          fontSize: 12,
          color: COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Nachricht
      </Text>
      <Text style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{message}</Text>
    </EmailLayout>
  );
}
