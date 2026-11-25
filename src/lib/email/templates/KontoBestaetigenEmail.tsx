/**
 * Bestätigung der E-Mail-Adresse bei der Registrierung. Der Link stammt aus
 * `admin.generateLink({type:'signup'})` (lib/actions/konto.ts) – Supabase
 * verschickt hierfür bewusst KEINE eigene E-Mail, damit die Kundschaft
 * durchgehend dieselbe Markenqualität sieht wie bei der Bestellbestätigung.
 */
import { Button, Text } from '@react-email/components';
import { COLORS, EmailLayout } from './EmailLayout';

export function KontoBestaetigenEmail({ bestaetigungsUrl }: { bestaetigungsUrl: string }) {
  const title = 'Bitte bestätige deine E-Mail-Adresse';
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Vielen Dank für deine Registrierung bei Embroidery Republic! Bitte bestätige deine E-Mail-Adresse, um dein
        Konto zu aktivieren.
      </Text>
      <Button
        href={bestaetigungsUrl}
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
        E-Mail-Adresse bestätigen
      </Button>
      <Text style={{ marginTop: 20, fontSize: 12, color: COLORS.muted }}>
        Funktioniert die Schaltfläche nicht? Kopiere diesen Link in deinen Browser:
        <br />
        <a href={bestaetigungsUrl} style={{ color: COLORS.gold }}>
          {bestaetigungsUrl}
        </a>
      </Text>
      <Text style={{ marginTop: 20, fontSize: 12, color: COLORS.muted }}>
        Hast du dich nicht registriert? Dann kannst du diese Nachricht ignorieren – es wurde kein Konto ohne
        diesen Bestätigungsschritt angelegt.
      </Text>
    </EmailLayout>
  );
}
