/**
 * Sicherheitsbenachrichtigung: das Passwort wurde geändert (entweder über
 * "Passwort vergessen" oder aktiv im Profil). Der wichtigste Zweck: Wurde
 * das NICHT selbst veranlasst, ist das der früheste Hinweis auf einen
 * fremden Zugriff.
 */
import { Text } from '@react-email/components';
import { COMPANY } from '@/config/company';
import { COLORS, EmailLayout } from './EmailLayout';

export function PasswortGeaendertEmail(_props: Record<string, never>) {
  const title = 'Dein Passwort wurde geändert';
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Das Passwort deines Kontos bei Embroidery Republic wurde soeben geändert.
      </Text>
      <Text style={{ marginTop: 16, fontSize: 13, color: COLORS.muted }}>
        Warst du das nicht? Kontaktiere uns bitte umgehend – wir helfen dir, dein Konto abzusichern.
      </Text>
      <Text style={{ marginTop: 16, fontSize: 13 }}>
        Telefon: {COMPANY.phone}
        <br />
        E-Mail: {COMPANY.email}
      </Text>
    </EmailLayout>
  );
}
