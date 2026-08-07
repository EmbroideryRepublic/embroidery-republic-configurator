/**
 * Willkommens-Mail, NACHDEM die E-Mail-Adresse bestätigt wurde (ausgelöst
 * vom Auth-Callback, app/auth/callback/route.ts – nicht bei der
 * Registrierung selbst, sonst käme sie vor der eigentlichen Bestätigung).
 */
import { Button, Text } from '@react-email/components';
import { basisUrl } from '@/lib/seo/basisUrl';
import { COLORS, EmailLayout } from './EmailLayout';

export function KontoWillkommenEmail(_props: Record<string, never>) {
  const title = 'Willkommen bei Embroidery Republic';
  const kontoUrl = `${basisUrl()}/konto`;
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Ihre E-Mail-Adresse ist bestätigt und Ihr Konto ist ab sofort einsatzbereit. Sie können jetzt Adressen
        hinterlegen, Ihre Bestellungen an einem Ort verfolgen und beim nächsten Einkauf schneller zur Kasse gehen.
      </Text>
      <Button
        href={kontoUrl}
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
        Zu meinem Konto
      </Button>
      <Text style={{ marginTop: 20, fontSize: 12, color: COLORS.muted }}>
        Hinweis: Ein Konto ist bei uns nie Voraussetzung fürs Bestellen – Sie können jederzeit auch als Gast
        bestellen. Das Konto ist ein zusätzlicher, bequemer Weg, keine Pflicht.
      </Text>
    </EmailLayout>
  );
}
