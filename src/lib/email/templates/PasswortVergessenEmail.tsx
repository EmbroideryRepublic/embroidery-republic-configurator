/**
 * Link zum Zurücksetzen des Passworts. Wird IMMER nur verschickt, wenn zur
 * angegebenen Adresse tatsächlich ein Konto existiert – die Server Action
 * (lib/actions/konto.ts, passwortVergessenAction) meldet nach außen aber in
 * jedem Fall denselben Erfolg, um nicht zu verraten, welche Adressen
 * registriert sind.
 */
import { Button, Text } from '@react-email/components';
import { COLORS, EmailLayout } from './EmailLayout';

export function PasswortVergessenEmail({ zuruecksetzenUrl }: { zuruecksetzenUrl: string }) {
  const title = 'Passwort zurücksetzen';
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Wir haben eine Anfrage erhalten, das Passwort Ihres Kontos bei Embroidery Republic zurückzusetzen. Klicken
        Sie auf die Schaltfläche unten, um ein neues Passwort zu vergeben.
      </Text>
      <Button
        href={zuruecksetzenUrl}
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
        Neues Passwort vergeben
      </Button>
      <Text style={{ marginTop: 20, fontSize: 12, color: COLORS.muted }}>
        Funktioniert die Schaltfläche nicht? Kopieren Sie diesen Link in Ihren Browser:
        <br />
        <a href={zuruecksetzenUrl} style={{ color: COLORS.gold }}>
          {zuruecksetzenUrl}
        </a>
      </Text>
      <Text style={{ marginTop: 20, fontSize: 12, color: COLORS.muted }}>
        Haben Sie diese Anfrage nicht gestellt? Dann können Sie diese Nachricht ignorieren – Ihr Passwort bleibt
        unverändert.
      </Text>
    </EmailLayout>
  );
}
